import PDFDocument from "pdfkit";
import { ContractStatus, NotificationType, RoleName, VisaCaseStatus } from "@migration-agency/shared";
import type { AuthenticatedUser } from "../../common/types/auth";
import { HttpError } from "../../common/http-error";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { storageService } from "../../lib/storage";
import { writeAuditLog } from "../audit/audit.service";
import { ensureCaseAccess } from "../cases/cases.access";
import { notificationsService } from "../notifications/notifications.service";

function formatAgreementDate(value: Date) {
  return value.toLocaleDateString("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function renderTemplateBody(
  templateBody: string,
  input: { customerName: string; visaTypeName: string; caseNumber: string; agencyName: string; agreementDate: string; agentName: string },
) {
  return templateBody
    .replaceAll("{{customer_name}}", input.customerName)
    .replaceAll("{{agency_name}}", input.agencyName)
    .replaceAll("{{visa_type_name}}", input.visaTypeName)
    .replaceAll("{{case_number}}", input.caseNumber)
    .replaceAll("{{agreement_date}}", input.agreementDate)
    .replaceAll("{{agent_name}}", input.agentName);
}

async function renderContractPdf(input: {
  customerName: string;
  visaTypeName: string;
  caseId: string;
  caseNumber: string;
  templateName: string;
  templateBody: string;
  agencyName: string;
  agreementDate: string;
  agentName: string;
}) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const document = new PDFDocument();

    document.on("data", (chunk) => chunks.push(chunk as Buffer));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    document.fontSize(22).text(input.templateName);
    document.moveDown();
    document.fontSize(12).text(`Case ID: ${input.caseId}`);
    document.text(`Case Number: ${input.caseNumber}`);
    document.text(`Customer: ${input.customerName}`);
    document.text(`Visa Type: ${input.visaTypeName}`);
    document.moveDown();
    document.text(renderTemplateBody(input.templateBody, input));
    document.end();
  });
}

async function buildContractPdfFromRecord(contract: {
  id: string;
  visaCase: {
    id: string;
    caseNumber: string;
    visaType: { name: string };
    customerProfile: { firstName: string; lastName: string };
    agentProfile: { firstName: string; lastName: string } | null;
  };
  contractTemplate: { name: string; body: string };
  createdAt: Date;
  sentAt?: Date | null;
}) {
  const customerName = `${contract.visaCase.customerProfile.firstName} ${contract.visaCase.customerProfile.lastName}`;
  const agentName = contract.visaCase.agentProfile
    ? `${contract.visaCase.agentProfile.firstName} ${contract.visaCase.agentProfile.lastName}`
    : "Agency Representative";

  return renderContractPdf({
    customerName,
    visaTypeName: contract.visaCase.visaType.name,
    caseId: contract.visaCase.id,
    caseNumber: contract.visaCase.caseNumber,
    templateName: contract.contractTemplate.name,
    templateBody: contract.contractTemplate.body,
    agencyName: env.AGENCY_NAME,
    agreementDate: formatAgreementDate(contract.sentAt ?? contract.createdAt),
    agentName,
  });
}

function mapContractForResponse(contract: {
  id: string;
  status: string;
  createdAt: Date;
  acceptedAt: Date | null;
  generatedFileUrl: string;
  contractTemplate: { id: string; name: string; version: string; body: string };
  visaCase: {
    caseNumber: string;
    visaType: { name: string };
    customerProfile: { firstName: string; lastName: string };
    agentProfile: { firstName: string; lastName: string } | null;
  };
  sentAt?: Date | null;
}) {
  const customerName = `${contract.visaCase.customerProfile.firstName} ${contract.visaCase.customerProfile.lastName}`;
  const agentName = contract.visaCase.agentProfile
    ? `${contract.visaCase.agentProfile.firstName} ${contract.visaCase.agentProfile.lastName}`
    : "Agency Representative";

  return {
    ...contract,
    renderedBody: renderTemplateBody(contract.contractTemplate.body, {
      customerName,
      agencyName: env.AGENCY_NAME,
      visaTypeName: contract.visaCase.visaType.name,
      caseNumber: contract.visaCase.caseNumber,
      agreementDate: formatAgreementDate(contract.sentAt ?? contract.createdAt),
      agentName,
    }),
  };
}

export const contractsService = {
  listActiveTemplates() {
    return prisma.contractTemplate.findMany({
      where: { isActive: true },
      orderBy: [{ name: "asc" }, { version: "desc" }],
    });
  },

  async createForVisaCase(input: {
    caseId: string;
    contractTemplateId: string;
    generatedByUserId: string;
    updateCaseStatusToContractSent?: boolean;
  }) {
    const record = await prisma.visaCase.findUnique({
      where: { id: input.caseId },
      include: {
        customerProfile: true,
        visaType: true,
        agentProfile: true,
      },
    });

    if (!record) {
      throw new HttpError(404, "Visa case not found.");
    }

    const template = await prisma.contractTemplate.findUnique({
      where: { id: input.contractTemplateId },
    });

    if (!template) {
      throw new HttpError(404, "Contract template not found.");
    }

    const pdf = await renderContractPdf({
      customerName: `${record.customerProfile.firstName} ${record.customerProfile.lastName}`,
      visaTypeName: record.visaType.name,
      caseId: record.id,
      caseNumber: record.caseNumber,
      templateName: template.name,
      templateBody: template.body,
      agencyName: env.AGENCY_NAME,
      agreementDate: formatAgreementDate(new Date()),
      agentName: record.agentProfile ? `${record.agentProfile.firstName} ${record.agentProfile.lastName}` : "Agency Representative",
    });

    const storageKey = `contracts/${record.id}/${Date.now()}.pdf`;
    await storageService.save(pdf, storageKey);

    const contract = await prisma.contract.create({
      data: {
        visaCaseId: input.caseId,
        contractTemplateId: template.id,
        generatedByUserId: input.generatedByUserId,
        generatedFileUrl: storageKey,
        status: ContractStatus.SENT,
        sentAt: new Date(),
      },
      include: {
        contractTemplate: true,
      },
    });

    if (input.updateCaseStatusToContractSent) {
      await prisma.visaCase.update({
        where: { id: input.caseId },
        data: { status: VisaCaseStatus.CONTRACT_SENT },
      });
    }

    return contract;
  },

  async generate(caseId: string, authUser: AuthenticatedUser) {
    const record = await prisma.visaCase.findUnique({
      where: { id: caseId },
      include: {
        customerProfile: true,
        visaType: true,
      },
    });

    if (!record) {
      throw new HttpError(404, "Visa case not found.");
    }

    await ensureCaseAccess(caseId, authUser);

    if (authUser.roleName === RoleName.CUSTOMER) {
      throw new HttpError(403, "Customers cannot generate contracts.");
    }

    if (
      ![VisaCaseStatus.DOCUMENTS_UPLOADED, VisaCaseStatus.UNDER_REVIEW, VisaCaseStatus.APPROVED].includes(
        record.status as unknown as VisaCaseStatus,
      )
    ) {
      throw new HttpError(409, "Visa case is not ready for contract generation.");
    }

    const template = await prisma.contractTemplate.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    if (!template) {
      throw new HttpError(404, "No active contract template found.");
    }

    const contract = await this.createForVisaCase({
      caseId,
      contractTemplateId: template.id,
      generatedByUserId: authUser.id,
      updateCaseStatusToContractSent: true,
    });

    const customerProfile = await prisma.customerProfile.findUnique({
      where: { id: record.customerProfileId },
    });

    if (customerProfile) {
      await notificationsService.sendEmailReadyNotification({
        recipientUserId: customerProfile.userId,
        caseId,
        type: NotificationType.CONTRACT_SENT,
        title: "Contract sent",
        message: "Your contract has been generated and is ready for download.",
      });
    }

    await writeAuditLog({
      actorUserId: authUser.id,
      visaCaseId: caseId,
      action: "contract.generate",
      entityType: "Contract",
      entityId: contract.id,
    });

    return contract;
  },

  async list(caseId: string, authUser: AuthenticatedUser) {
    await ensureCaseAccess(caseId, authUser);
    const contracts = await prisma.contract.findMany({
      where: { visaCaseId: caseId },
      include: {
        contractTemplate: true,
        visaCase: {
          include: {
            visaType: true,
            customerProfile: true,
            agentProfile: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return contracts.map(mapContractForResponse);
  },

  async accept(contractId: string, authUser: AuthenticatedUser) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        contractTemplate: true,
        visaCase: {
          include: {
            customerProfile: true,
          },
        },
      },
    });

    if (!contract) {
      throw new HttpError(404, "Contract not found.");
    }

    await ensureCaseAccess(contract.visaCaseId, authUser);

    if (authUser.roleName !== RoleName.CUSTOMER) {
      throw new HttpError(403, "Only customers can sign contracts.");
    }

    const updated = await prisma.contract.update({
      where: { id: contractId },
      data: {
        status: ContractStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
      include: {
        contractTemplate: true,
        visaCase: {
          include: {
            visaType: true,
            customerProfile: true,
            agentProfile: true,
          },
        },
      },
    });

    await notificationsService.create({
      recipientUserId: contract.generatedByUserId,
      caseId: contract.visaCaseId,
      type: NotificationType.CONTRACT_ACCEPTED,
      title: "Contract signed",
      message: `${contract.visaCase.customerProfile.firstName} ${contract.visaCase.customerProfile.lastName} signed the contract.`,
    });

    await writeAuditLog({
      actorUserId: authUser.id,
      visaCaseId: contract.visaCaseId,
      action: "contract.accept",
      entityType: "Contract",
      entityId: contract.id,
    });

    return mapContractForResponse(updated);
  },

  async getDownloadToken(contractId: string, authUser: AuthenticatedUser) {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new HttpError(404, "Contract not found.");
    }

    await ensureCaseAccess(contract.visaCaseId, authUser);

    return {
      token: storageService.createSignedToken(contract.generatedFileUrl),
    };
  },

  async downloadByToken(token: string) {
    const storageKey = storageService.verifySignedToken(token);
    const contract = await prisma.contract.findFirst({
      where: { generatedFileUrl: storageKey },
      include: {
        contractTemplate: true,
        visaCase: {
          include: {
            visaType: true,
            customerProfile: true,
            agentProfile: true,
          },
        },
      },
    });

    if (!contract) {
      throw new HttpError(404, "Contract not found.");
    }

    const file = await buildContractPdfFromRecord(contract);

    return {
      file,
      contract,
    };
  },
};
