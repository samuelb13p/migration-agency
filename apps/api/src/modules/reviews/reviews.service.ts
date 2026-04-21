import { NotificationType, RoleName, UploadedDocumentStatus, VisaCaseStatus } from "@migration-agency/shared";
import type { AuthenticatedUser } from "../../common/types/auth";
import { HttpError } from "../../common/http-error";
import { prisma } from "../../lib/prisma";
import { writeAuditLog } from "../audit/audit.service";
import { ensureCaseAccess } from "../cases/cases.access";
import { notificationsService } from "../notifications/notifications.service";

export const reviewsService = {
  async review(uploadId: string, authUser: AuthenticatedUser, input: { status: UploadedDocumentStatus; reviewNotes?: string }) {
    if (![RoleName.AGENT, RoleName.ADMIN].includes(authUser.roleName)) {
      throw new HttpError(403, "Only agents or admins can review documents.");
    }

    const upload = await prisma.uploadedDocument.findUnique({
      where: { id: uploadId },
      include: {
        visaCase: {
          include: {
            customerProfile: true,
          },
        },
        documentType: true,
      },
    });

    if (!upload) {
      throw new HttpError(404, "Upload not found.");
    }

    await ensureCaseAccess(upload.visaCaseId, authUser);

    const agentProfile =
      authUser.roleName === RoleName.AGENT ? await prisma.agentProfile.findUnique({ where: { userId: authUser.id } }) : null;

    const review = await prisma.uploadedDocument.update({
      where: { id: uploadId },
      data: {
        status: input.status,
        reviewNotes: input.reviewNotes,
        reviewedByAgentId: agentProfile?.id,
        reviewedAt: new Date(),
      },
    });

    if ([UploadedDocumentStatus.REJECTED, UploadedDocumentStatus.REUPLOAD_REQUESTED].includes(input.status)) {
      await prisma.visaCase.update({
        where: { id: upload.visaCaseId },
        data: { status: VisaCaseStatus.REJECTED },
      });
    }

    if (input.status === UploadedDocumentStatus.APPROVED) {
      await prisma.visaCase.update({
        where: { id: upload.visaCaseId },
        data: { status: VisaCaseStatus.UNDER_REVIEW },
      });
    }

    const notificationType =
      input.status === UploadedDocumentStatus.APPROVED
        ? NotificationType.DOCUMENT_APPROVED
        : input.status === UploadedDocumentStatus.REJECTED
          ? NotificationType.DOCUMENT_REJECTED
          : NotificationType.REUPLOAD_REQUESTED;

    const customerUser = await prisma.user.findUnique({
      where: { id: upload.visaCase.customerProfile.userId },
    });

    if (customerUser) {
      await notificationsService.sendEmailReadyNotification({
        recipientUserId: customerUser.id,
        caseId: upload.visaCaseId,
        type: notificationType,
        title: `Document ${input.status.replace("_", " ")}`,
        message: `${upload.documentType.name} review result: ${input.status}.`,
      });
    }

    await writeAuditLog({
      actorUserId: authUser.id,
      visaCaseId: upload.visaCaseId,
      action: "document.review",
      entityType: "UploadedDocument",
      entityId: uploadId,
      metadata: input,
    });

    return review;
  },
};
