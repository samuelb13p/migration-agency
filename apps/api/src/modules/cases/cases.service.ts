import { NotificationType, RoleName, VisaCaseStatus } from "@migration-agency/shared";
import type { AuthenticatedUser } from "../../common/types/auth";
import { HttpError } from "../../common/http-error";
import { prisma } from "../../lib/prisma";
import { writeAuditLog } from "../audit/audit.service";
import { evaluateCaseCompleteness } from "../completeness/completeness.service";
import { notificationsService } from "../notifications/notifications.service";
import { ensureCaseAccess } from "./cases.access";

export const casesService = {
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
