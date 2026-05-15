import { UploadedDocumentStatus, VisaCaseStatus } from "@migration-agency/shared";
import { prisma } from "../../lib/prisma";

export async function evaluateCaseCompleteness(caseId: string) {
  const record = await prisma.visaCase.findUniqueOrThrow({
    where: { id: caseId },
    include: {
      visaType: {
        include: {
          requiredDocumentMappings: {
            where: { isRequired: true },
            orderBy: { sortOrder: "asc" },
            include: { documentType: true },
          },
        },
      },
      uploadedDocuments: true,
    },
  });

  const required = record.visaType.requiredDocumentMappings;
  const latestUploads = new Map<string, { versionNumber: number; status: UploadedDocumentStatus }>();

  for (const upload of record.uploadedDocuments) {
    const current = latestUploads.get(upload.documentTypeId);
    if (!current || upload.versionNumber > current.versionNumber) {
      latestUploads.set(upload.documentTypeId, {
        versionNumber: upload.versionNumber,
        status: upload.status as UploadedDocumentStatus,
      });
    }
  }

  const uploadedIds = new Set(latestUploads.keys());
  const missingRequiredDocumentIds = required
    .filter((item) => !uploadedIds.has(item.documentTypeId))
    .map((item) => item.documentTypeId);

  const latestRequiredUploads = required
    .map((item) => latestUploads.get(item.documentTypeId))
    .filter((value): value is { versionNumber: number; status: UploadedDocumentStatus } => Boolean(value));

  const hasMissing = missingRequiredDocumentIds.length > 0;
  const hasRejected = latestRequiredUploads.some((upload) =>
    [UploadedDocumentStatus.REJECTED, UploadedDocumentStatus.REUPLOAD_REQUESTED].includes(upload.status),
  );
  const approvedRequiredCount = required.filter(
    (item) => latestUploads.get(item.documentTypeId)?.status === UploadedDocumentStatus.APPROVED,
  ).length;
  const completenessPercent =
    required.length === 0 ? 100 : Math.round((approvedRequiredCount / required.length) * 100);
  const allApproved = required.length > 0 && required.every((item) => latestUploads.get(item.documentTypeId)?.status === UploadedDocumentStatus.APPROVED);

  const nextStatus = hasMissing
    ? VisaCaseStatus.WAITING_DOCUMENTS
    : hasRejected
      ? VisaCaseStatus.WAITING_DOCUMENTS
      : allApproved
        ? VisaCaseStatus.APPROVED
        : VisaCaseStatus.DOCUMENTS_UPLOADED;

  await prisma.visaCase.update({
    where: { id: caseId },
    data: {
      status: nextStatus,
      submittedAt: missingRequiredDocumentIds.length === 0 ? new Date() : record.submittedAt,
    },
  });

  return {
    caseId,
    completenessPercent,
    missingRequiredDocumentIds,
    items: required.map((item) => ({
      requiredDocumentId: item.documentTypeId,
      name: item.documentType.name,
      isRequired: item.isRequired,
      status: !uploadedIds.has(item.documentTypeId)
        ? "missing"
        : latestUploads.get(item.documentTypeId)?.status === UploadedDocumentStatus.APPROVED
          ? "approved"
          : latestUploads.get(item.documentTypeId)?.status === UploadedDocumentStatus.REJECTED
            ? "rejected"
            : latestUploads.get(item.documentTypeId)?.status === UploadedDocumentStatus.REUPLOAD_REQUESTED
              ? "reupload_requested"
              : "waiting_review",
    })),
  };
}
