import { NotificationType, RoleName, VisaCaseStatus } from "@migration-agency/shared";
import type { AuthenticatedUser } from "../../common/types/auth";
import { HttpError } from "../../common/http-error";
import { hashPassword } from "../../lib/password";
import { prisma } from "../../lib/prisma";
import { writeAuditLog } from "../audit/audit.service";
import { evaluateCaseCompleteness } from "../completeness/completeness.service";
import { contractsService } from "../contracts/contracts.service";
import { emailService } from "../notifications/email.service";
import { notificationsService } from "../notifications/notifications.service";
import { ensureCaseAccess } from "./cases.access";

export const casesService = {
  async createByAgent(
    authUser: AuthenticatedUser,
    input: {
      caseNumber: string;
      visaTypeId: string;
      contractTemplateId: string;
      status: VisaCaseStatus;
      customer: { firstName: string; lastName: string; email: string; passportNumber: string };
    },
  ) {
    if (![RoleName.AGENT, RoleName.ADMIN].includes(authUser.roleName)) {
      throw new HttpError(403, "Only agents or admins can create visa cases for customers.");
    }

    const normalizedEmail = input.customer.email.trim().toLowerCase();
    const normalizedCaseNumber = input.caseNumber.trim();
    const normalizedPassportNumber = input.customer.passportNumber.trim();

    const [visaType, existingCase, existingUser, customerRole, contractTemplate] = await Promise.all([
      prisma.visaType.findUnique({ where: { id: input.visaTypeId } }),
      prisma.visaCase.findUnique({ where: { caseNumber: normalizedCaseNumber } }),
      prisma.user.findUnique({ where: { email: normalizedEmail } }),
      prisma.role.findUnique({ where: { name: RoleName.CUSTOMER } }),
      prisma.contractTemplate.findUnique({ where: { id: input.contractTemplateId } }),
    ]);

    if (!visaType) {
      throw new HttpError(404, "Visa type not found.");
    }

    if (existingCase) {
      throw new HttpError(409, "A visa case with this case number already exists.");
    }

    if (existingUser) {
      throw new HttpError(409, "A customer with this email already exists.");
    }

    if (!customerRole) {
      throw new HttpError(422, "Customer role is not configured.");
    }

    if (!contractTemplate) {
      throw new HttpError(404, "Contract template not found.");
    }

    const agentProfile =
      authUser.roleName === RoleName.AGENT
        ? await prisma.agentProfile.findUnique({ where: { userId: authUser.id } })
        : null;

    if (authUser.roleName === RoleName.AGENT && !agentProfile) {
      throw new HttpError(404, "Agent profile not found.");
    }

    const passwordHash = await hashPassword(normalizedPassportNumber);

    const created = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          roleId: customerRole.id,
          customerProfile: {
            create: {
              firstName: input.customer.firstName.trim(),
              lastName: input.customer.lastName.trim(),
              passportNumber: normalizedPassportNumber,
            },
          },
        },
        include: {
          customerProfile: true,
        },
      });

      if (!user.customerProfile) {
        throw new HttpError(500, "Customer profile could not be created.");
      }

      const visaCase = await tx.visaCase.create({
        data: {
          caseNumber: normalizedCaseNumber,
          visaTypeId: input.visaTypeId,
          customerProfileId: user.customerProfile.id,
          agentProfileId: agentProfile?.id,
          status: input.status,
        },
        include: {
          visaType: true,
          customerProfile: true,
          agentProfile: true,
        },
      });

      await tx.auditLog.createMany({
        data: [
          {
            actorUserId: authUser.id,
            visaCaseId: visaCase.id,
            action: "customer.create_by_agent",
            entityType: "User",
            entityId: user.id,
            metadata: { email: normalizedEmail },
          },
          {
            actorUserId: authUser.id,
            visaCaseId: visaCase.id,
            action: "visa_case.create_by_agent",
            entityType: "VisaCase",
            entityId: visaCase.id,
            metadata: { caseNumber: normalizedCaseNumber, status: input.status },
          },
        ],
      });

      return { user, visaCase };
    });

    await contractsService.createForVisaCase({
      caseId: created.visaCase.id,
      contractTemplateId: contractTemplate.id,
      generatedByUserId: authUser.id,
      updateCaseStatusToContractSent: false,
    });

    let emailSent = true;

    try {
      await emailService.sendCustomerAccessEmail({
        email: normalizedEmail,
        password: normalizedPassportNumber,
        firstName: input.customer.firstName.trim(),
        caseNumber: normalizedCaseNumber,
      });
    } catch (error) {
      emailSent = false;

      console.log({
        actorUserId: authUser.id,
        visaCaseId: created.visaCase.id,
        action: "customer.access_email.failed",
        entityType: "VisaCase",
        entityId: created.visaCase.id,
        metadata: { message: error instanceof Error ? error.message : "Unknown email error." },
      });
      
      await writeAuditLog({
        actorUserId: authUser.id,
        visaCaseId: created.visaCase.id,
        action: "customer.access_email.failed",
        entityType: "VisaCase",
        entityId: created.visaCase.id,
        metadata: { message: error instanceof Error ? error.message : "Unknown email error." },
      });
    }

    return {
      ...created.visaCase,
      emailSent,
      customerEmail: normalizedEmail,
    };
  },

  async create(
    authUser: AuthenticatedUser,
    input: { visaTypeId: string; customerProfileId: string; agentProfileId?: string },
  ) {
    if (![RoleName.CUSTOMER, RoleName.ADMIN].includes(authUser.roleName)) {
      throw new HttpError(403, "Only customers or admins can create visa cases.");
    }

    const visaType = await prisma.visaType.findUnique({ where: { id: input.visaTypeId } });
    if (!visaType) {
      throw new HttpError(404, "Visa type not found.");
    }

    let customerProfileId = input.customerProfileId;

    if (authUser.roleName === RoleName.CUSTOMER) {
      const customerProfile = await prisma.customerProfile.findUnique({ where: { userId: authUser.id } });
      if (!customerProfile) {
        throw new HttpError(404, "Customer profile not found.");
      }

      customerProfileId = customerProfile.id;
    }

    const record = await prisma.visaCase.create({
      data: {
        caseNumber: `CASE-${Date.now()}`,
        visaTypeId: input.visaTypeId,
        customerProfileId,
        agentProfileId: input.agentProfileId,
        status: VisaCaseStatus.WAITING_DOCUMENTS,
      },
      include: { visaType: true },
    });

    await writeAuditLog({
      actorUserId: authUser.id,
      visaCaseId: record.id,
      action: "visa_case.create",
      entityType: "VisaCase",
      entityId: record.id,
    });

    if (record.agentProfileId) {
      const assignedAgent = await prisma.agentProfile.findUnique({
        where: { id: record.agentProfileId },
      });

      if (assignedAgent) {
        await notificationsService.create({
          recipientUserId: assignedAgent.userId,
          caseId: record.id,
          type: NotificationType.DOCUMENT_UPLOADED,
          title: "New case assigned",
          message: `A ${record.visaType.name} visa case has been created and assigned to you.`,
        });
      }
    }

    return record;
  },

  async list(authUser: AuthenticatedUser) {
    if (authUser.roleName === RoleName.ADMIN) {
      return prisma.visaCase.findMany({
        include: {
          visaType: true,
          customerProfile: true,
          agentProfile: true,
        },
        orderBy: { updatedAt: "desc" },
      });
    }

    if (authUser.roleName === RoleName.CUSTOMER) {
      const customerProfile = await prisma.customerProfile.findUnique({ where: { userId: authUser.id } });
      if (!customerProfile) return [];

      return prisma.visaCase.findMany({
        where: { customerProfileId: customerProfile.id },
        include: {
          visaType: true,
          customerProfile: true,
          agentProfile: true,
        },
        orderBy: { updatedAt: "desc" },
      });
    }

    const agentProfile = await prisma.agentProfile.findUnique({ where: { userId: authUser.id } });
    if (!agentProfile) return [];

    return prisma.visaCase.findMany({
      where: { agentProfileId: agentProfile.id },
      include: {
        visaType: true,
        customerProfile: true,
        agentProfile: true,
      },
      orderBy: { updatedAt: "desc" },
    });
  },

  getById(caseId: string, authUser: AuthenticatedUser) {
    return ensureCaseAccess(caseId, authUser);
  },

  async update(
    caseId: string,
    authUser: AuthenticatedUser,
    input: { status?: VisaCaseStatus; agentProfileId?: string | null; submittedAt?: string },
  ) {
    await ensureCaseAccess(caseId, authUser);

    if (authUser.roleName === RoleName.CUSTOMER && input.status && input.status !== VisaCaseStatus.WAITING_DOCUMENTS) {
      throw new HttpError(403, "Customers cannot move visa case status directly.");
    }

    const record = await prisma.visaCase.update({
      where: { id: caseId },
      data: {
        status: input.status,
        agentProfileId: input.agentProfileId,
        submittedAt: input.submittedAt ? new Date(input.submittedAt) : undefined,
      },
    });

    await writeAuditLog({
      actorUserId: authUser.id,
      visaCaseId: caseId,
      action: "visa_case.update",
      entityType: "VisaCase",
      entityId: caseId,
      metadata: input,
    });

    return record;
  },

  async getChecklist(caseId: string, authUser: AuthenticatedUser) {
    await ensureCaseAccess(caseId, authUser);
    return evaluateCaseCompleteness(caseId);
  },
};
