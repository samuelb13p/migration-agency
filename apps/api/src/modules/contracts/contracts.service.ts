import PDFDocument from "pdfkit";
import { ContractStatus, NotificationType, RoleName, VisaCaseStatus } from "@migration-agency/shared";
import type { AuthenticatedUser } from "../../common/types/auth";
import { HttpError } from "../../common/http-error";
import { prisma } from "../../lib/prisma";
import { storageService } from "../../lib/storage";
import { writeAuditLog } from "../audit/audit.service";
import { ensureCaseAccess } from "../cases/cases.access";
import { notificationsService } from "../notifications/notifications.service";

async function renderContractPdf(input: { customerName: string; visaTypeName: string; caseId: string }) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const document = new PDFDocument();

    document.on("data", (chunk) => chunks.push(chunk as Buffer));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    document.fontSize(22).text("Migration Services Agreement");
    document.moveDown();
    document.fontSize(12).text(`Case ID: ${input.caseId}`);
    document.text(`Customer: ${input.customerName}`);
    document.text(`Visa Type: ${input.visaTypeName}`);
    document.moveDown();
    document.text("This contract is a server-generated MVP PDF based on stored visa case data.");
    document.end();
  });
}

export const contractsService = {
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

    const pdf = await renderContractPdf({
      customerName: `${record.customerProfile.firstName} ${record.customerProfile.lastName}`,
      visaTypeName: record.visaType.name,
      caseId: record.id,
    });

    const storageKey = `contracts/${record.id}/${Date.now()}.pdf`;
    await storageService.save(pdf, storageKey);

    const contract = await prisma.contract.create({
      data: {
        visaCaseId: caseId,
        contractTemplateId: template.id,
        generatedByUserId: authUser.id,
        generatedFileUrl: storageKey,
        status: ContractStatus.GENERATED,
      },
    });

    await prisma.visaCase.update({
      where: { id: caseId },
      data: { status: VisaCaseStatus.CONTRACT_SENT },
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
    return prisma.contract.findMany({
      where: { visaCaseId: caseId },
      orderBy: { createdAt: "desc" },
    });
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
    const file = await storageService.read(storageKey);
    const contract = await prisma.contract.findFirst({
      where: { generatedFileUrl: storageKey },
    });

    if (!contract) {
      throw new HttpError(404, "Contract not found.");
    }

    return {
      file,
      contract,
    };
  },
};
