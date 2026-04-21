import path from "path";
import { NotificationType, RoleName, UploadedDocumentStatus } from "@migration-agency/shared";
import type { AuthenticatedUser } from "../../common/types/auth";
import { storageConfig } from "../../config/env";
import { HttpError } from "../../common/http-error";
import { prisma } from "../../lib/prisma";
import { storageService } from "../../lib/storage";
import { writeAuditLog } from "../audit/audit.service";
import { ensureCaseAccess } from "../cases/cases.access";
import { evaluateCaseCompleteness } from "../completeness/completeness.service";
import { notificationsService } from "../notifications/notifications.service";

export const uploadsService = {
  async upload(
    caseId: string,
    documentTypeId: string,
    file: Express.Multer.File | undefined,
    authUser: AuthenticatedUser,
  ) {
    if (!file) {
      throw new HttpError(422, "A file is required.");
    }

    const targetCase = await ensureCaseAccess(caseId, authUser);

    if (authUser.roleName === RoleName.AGENT) {
      throw new HttpError(403, "Agents cannot upload customer documents in this MVP.");
    }

    if (!storageConfig.allowedMimeTypes.includes(file.mimetype)) {
      throw new HttpError(422, "Unsupported file type.");
    }

    if (file.size > storageConfig.maxFileSizeBytes) {
      throw new HttpError(422, "File exceeds the maximum allowed size.");
    }

    const documentType = await prisma.documentType.findUnique({
      where: { id: documentTypeId },
    });

    if (!documentType) {
      throw new HttpError(404, "Document type not found.");
    }

    const documentRule = await prisma.visaTypeRequiredDocument.findUnique({
      where: {
        visaTypeId_documentTypeId: {
          visaTypeId: targetCase.visaTypeId,
          documentTypeId,
        },
      },
    });

    if (!documentRule) {
      throw new HttpError(422, "Document type does not belong to this visa checklist.");
    }

    const existingVersions = await prisma.uploadedDocument.findMany({
      where: { visaCaseId: caseId, documentTypeId },
      orderBy: { versionNumber: "desc" },
    });

    const versionNumber = (existingVersions[0]?.versionNumber ?? 0) + 1;
    const extension = path.extname(file.originalname) || ".bin";
    const storageKey = `${caseId}/${documentTypeId}/v${versionNumber}${extension}`;
    await storageService.save(file.buffer, storageKey);

    const created = await prisma.uploadedDocument.create({
      data: {
        visaCaseId: caseId,
        documentTypeId,
        uploadedByUserId: authUser.id,
        originalFileName: file.originalname,
        storedFileName: path.basename(storageKey),
        fileUrl: storageKey,
        mimeType: file.mimetype,
        fileSizeBytes: file.size,
        versionNumber,
        status: UploadedDocumentStatus.PENDING,
      },
    });

    const checklist = await evaluateCaseCompleteness(caseId);

    if (targetCase.agentProfileId) {
      const assignedAgent = await prisma.agentProfile.findUnique({
        where: { id: targetCase.agentProfileId },
      });

      if (assignedAgent) {
        await notificationsService.sendEmailReadyNotification({
          recipientUserId: assignedAgent.userId,
          caseId,
          type: NotificationType.DOCUMENT_UPLOADED,
          title: "Document uploaded",
          message: `${file.originalname} was uploaded to the case.`,
        });

        if (checklist.missingRequiredDocumentIds.length === 0) {
          await notificationsService.sendEmailReadyNotification({
            recipientUserId: assignedAgent.userId,
            caseId,
            type: NotificationType.CHECKLIST_COMPLETED,
            title: "Checklist completed",
            message: "All required documents are present and ready for review.",
          });
        }
      }
    }

    await writeAuditLog({
      actorUserId: authUser.id,
      visaCaseId: caseId,
      action: "document.upload",
      entityType: "UploadedDocument",
      entityId: created.id,
      metadata: { documentTypeId, versionNumber },
    });

    return created;
  },

  async list(caseId: string, authUser: AuthenticatedUser) {
    await ensureCaseAccess(caseId, authUser);
    return prisma.uploadedDocument.findMany({
      where: { visaCaseId: caseId },
      include: {
        documentType: true,
        reviewedByAgent: true,
      },
      orderBy: [{ documentTypeId: "asc" }, { versionNumber: "desc" }],
    });
  },

  async getDownloadToken(uploadId: string, authUser: AuthenticatedUser) {
    const upload = await prisma.uploadedDocument.findUnique({
      where: { id: uploadId },
    });

    if (!upload) {
      throw new HttpError(404, "Upload not found.");
    }

    await ensureCaseAccess(upload.visaCaseId, authUser);

    return {
      token: storageService.createSignedToken(upload.fileUrl),
      fileName: upload.originalFileName,
    };
  },

  async downloadByToken(token: string) {
    const storageKey = storageService.verifySignedToken(token);
    const file = await storageService.read(storageKey);
    const upload = await prisma.uploadedDocument.findFirst({ where: { fileUrl: storageKey } });

    if (!upload) {
      throw new HttpError(404, "Upload not found.");
    }

    return { file, upload };
  },
};
