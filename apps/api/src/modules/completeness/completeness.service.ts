import { VisaCaseStatus } from "@migration-agency/shared";
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
  const latestUploads = new Map<string, number>();

  for (const upload of record.uploadedDocuments) {
    const current = latestUploads.get(upload.documentTypeId) ?? 0;
    if (upload.versionNumber > current) {
      latestUploads.set(upload.documentTypeId, upload.versionNumber);
    }
  }

  const uploadedIds = new Set(latestUploads.keys());
  const missingRequiredDocumentIds = required
    .filter((item) => !uploadedIds.has(item.documentTypeId))
    .map((item) => item.documentTypeId);

  const completenessPercent =
    required.length === 0
      ? 100
      : Math.round(((required.length - missingRequiredDocumentIds.length) / required.length) * 100);

  const nextStatus =
    missingRequiredDocumentIds.length === 0
      ? VisaCaseStatus.DOCUMENTS_UPLOADED
      : record.status === VisaCaseStatus.DRAFT
        ? VisaCaseStatus.WAITING_DOCUMENTS
        : record.status;

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
      status: uploadedIds.has(item.documentTypeId) ? "uploaded" : "missing",
    })),
  };
}
