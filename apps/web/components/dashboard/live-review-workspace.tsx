"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { apiFetchWithToken, getApiUrl } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { LoadingSpinner } from "../ui/loading-spinner";

type UploadRecord = {
  id: string;
  originalFileName: string;
  status: string;
  versionNumber: number;
  reviewNotes?: string | null;
  uploadedAt: string;
  documentType: { id: string; name: string };
};

type VisaCaseRecord = {
  id: string;
  caseNumber: string;
  status: string;
  visaType: { name: string };
  customerProfile: { firstName: string; lastName: string };
};

type ChecklistRecord = {
  completenessPercent: number;
};

type UploadHistoryGroup = {
  documentTypeId: string;
  documentTypeName: string;
  uploads: UploadRecord[];
};

function formatStatusLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function toneForStatus(status: string) {
  if (status === "approved" || status === "completed") return "success" as const;
  if (status === "reupload_requested" || status === "waiting_documents" || status === "documents_uploaded") return "warning" as const;
  if (status === "rejected") return "danger" as const;
  return "neutral" as const;
}

export function LiveReviewWorkspace({ caseId }: { caseId: string }) {
  const [caseRecord, setCaseRecord] = useState<VisaCaseRecord | null>(null);
  const [completenessPercent, setCompletenessPercent] = useState(0);
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [selectedUploadId, setSelectedUploadId] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const actionableUploads = useMemo(() => {
    const latestByDocumentType = new Map<string, UploadRecord>();

    for (const upload of uploads) {
      const current = latestByDocumentType.get(upload.documentType.id);
      if (!current || upload.versionNumber > current.versionNumber) {
        latestByDocumentType.set(upload.documentType.id, upload);
      }
    }

    return Array.from(latestByDocumentType.values())
      .filter((upload) => upload.status === "pending")
      .sort((left, right) => new Date(right.uploadedAt).getTime() - new Date(left.uploadedAt).getTime());
  }, [uploads]);

  const uploadHistoryGroups = useMemo<UploadHistoryGroup[]>(() => {
    const groups = new Map<string, UploadHistoryGroup>();

    for (const upload of uploads) {
      const existingGroup = groups.get(upload.documentType.id);

      if (existingGroup) {
        existingGroup.uploads.push(upload);
        continue;
      }

      groups.set(upload.documentType.id, {
        documentTypeId: upload.documentType.id,
        documentTypeName: upload.documentType.name,
        uploads: [upload],
      });
    }

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        uploads: [...group.uploads].sort((left, right) => {
          if (left.status === "approved" && right.status !== "approved") return -1;
          if (left.status !== "approved" && right.status === "approved") return 1;

          return new Date(right.uploadedAt).getTime() - new Date(left.uploadedAt).getTime();
        }),
      }))
      .sort((left, right) => left.documentTypeName.localeCompare(right.documentTypeName));
  }, [uploads]);

  async function load() {
    const token = getAccessToken();
    if (!token) return;
    const accessToken = token;

    const [visaCase, checklist, uploadData] = await Promise.all([
      apiFetchWithToken<VisaCaseRecord>(`/api/visa-cases/${caseId}`, accessToken),
      apiFetchWithToken<ChecklistRecord>(`/api/visa-cases/${caseId}/checklist`, accessToken),
      apiFetchWithToken<UploadRecord[]>(`/api/visa-cases/${caseId}/uploads`, accessToken),
    ]);

    setCaseRecord(visaCase);
    setCompletenessPercent(checklist.completenessPercent);
    setUploads(uploadData);
  }

  useEffect(() => {
    void load().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Unable to load review workspace.");
    });
  }, [caseId]);

  useEffect(() => {
    const firstUpload = actionableUploads[0] ?? null;

    if (!firstUpload) {
      setSelectedUploadId("");
      setReviewNotes("");
      return;
    }

    const stillExists = actionableUploads.some((item) => item.id === selectedUploadId);
    const nextSelected = stillExists ? actionableUploads.find((item) => item.id === selectedUploadId) ?? firstUpload : firstUpload;

    setSelectedUploadId(nextSelected.id);
    setReviewNotes(nextSelected.reviewNotes ?? "");
  }, [actionableUploads, selectedUploadId]);

  const selectedUpload = useMemo(
    () => actionableUploads.find((item) => item.id === selectedUploadId) ?? actionableUploads[0] ?? null,
    [actionableUploads, selectedUploadId],
  );

  async function submitReview(status: string) {
    const token = getAccessToken();
    if (!token || !selectedUpload) return;
    const accessToken = token;

    setError(null);
    setMessage(null);

    startTransition(() => {
      void apiFetchWithToken(`/api/uploads/${selectedUpload.id}/review`, accessToken, {
        method: "POST",
        body: JSON.stringify({ status, reviewNotes }),
      })
        .then(async () => {
          setMessage(`Document marked as ${formatStatusLabel(status)}.`);
          await load();
        })
        .catch((reviewError) => {
          setError(reviewError instanceof Error ? reviewError.message : "Review failed.");
        });
    });
  }

  async function handleDownload(uploadId: string) {
    const token = getAccessToken();
    if (!token) return;
    const accessToken = token;

    try {
      const data = await apiFetchWithToken<{ token: string }>(`/api/uploads/${uploadId}/download-token`, accessToken);
      window.location.href = getApiUrl(`/api/uploads/download/${data.token}`);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Download failed.");
    }
  }

  if (error && !caseRecord) {
    return (
      <Card>
        <p className="text-sm text-rose-600">{error}</p>
      </Card>
    );
  }

  if (!caseRecord) {
    return (
      <Card>
        <p className="text-sm text-slate-500">Loading review workspace...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{caseRecord.caseNumber}</p>
            <h2 className="mt-3 text-2xl font-semibold">
              {caseRecord.customerProfile.firstName} {caseRecord.customerProfile.lastName}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{caseRecord.visaType.name}</p>
          </div>
          <Badge tone={toneForStatus(caseRecord.status)}>{formatStatusLabel(caseRecord.status)}</Badge>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Visa Case Status</p>
            <p className="mt-2 font-semibold text-slate-800">{formatStatusLabel(caseRecord.status)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Completeness</p>
              <p className="font-semibold text-slate-800">{completenessPercent}%</p>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-accent" style={{ width: `${completenessPercent}%` }} />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Documents Needing Review</p>
            <p className="mt-2 font-semibold text-slate-800">{actionableUploads.length}</p>
          </div>
        </div>
      </Card>

      {actionableUploads.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">No documents currently need review for this visa case.</p>
        </Card>
      ) : (
        <>
          <Card>
            <h2 className="text-xl font-semibold">Documents to review</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {actionableUploads.map((upload) => (
                <button
                  key={upload.id}
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                    selectedUpload?.id === upload.id ? "border-accent bg-accent/10 text-accent" : "border-slate-200 bg-slate-50"
                  }`}
                  onClick={() => {
                    setSelectedUploadId(upload.id);
                    setReviewNotes(upload.reviewNotes ?? "");
                  }}
                  type="button"
                >
                  {upload.documentType.name} v{upload.versionNumber}
                </button>
              ))}
            </div>
          </Card>

          {selectedUpload ? (
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{selectedUpload.documentType.name}</h2>
                  <p className="mt-2 text-sm text-slate-600">{selectedUpload.originalFileName}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Uploaded {new Date(selectedUpload.uploadedAt).toLocaleString()} · Version {selectedUpload.versionNumber}
                  </p>
                </div>
                <Badge tone="warning">{formatStatusLabel(selectedUpload.status)}</Badge>
              </div>

              <textarea
                className="mt-6 min-h-32 w-full rounded-3xl border border-slate-200 px-4 py-3"
                onChange={(event) => setReviewNotes(event.target.value)}
                placeholder="Add review notes for the customer and audit trail."
                value={reviewNotes}
              />

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white"
                  disabled={isPending}
                  onClick={() => void submitReview("approved")}
                  type="button"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    {isPending ? <LoadingSpinner label="Saving review" /> : null}
                    <span>Approve</span>
                  </span>
                </button>
                <button
                  className="rounded-2xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white"
                  disabled={isPending}
                  onClick={() => void submitReview("reupload_requested")}
                  type="button"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    {isPending ? <LoadingSpinner label="Requesting re-upload" /> : null}
                    <span>Request re-upload</span>
                  </span>
                </button>
              </div>

              {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
              {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
            </Card>
          ) : null}
        </>
      )}

      <Card>
        <h2 className="text-xl font-semibold">Upload history</h2>
        <p className="mt-2 text-sm text-slate-500">
          Review the full document history for this visa case and download any uploaded version when needed.
        </p>
        <div className="mt-6 space-y-4">
          {uploads.length === 0 ? <p className="text-sm text-slate-500">No uploads are available for this visa case yet.</p> : null}
          {uploadHistoryGroups.map((group) => (
            <div key={group.documentTypeId} className="rounded-3xl border border-slate-200 px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">{group.documentTypeName}</h3>
                <p className="text-sm text-slate-500">
                  {group.uploads.length} attachment{group.uploads.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="mt-4 space-y-3">
                {group.uploads.map((upload) => (
                  <div key={upload.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          Attachment {upload.versionNumber}: {upload.originalFileName}
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                          Uploaded {new Date(upload.uploadedAt).toLocaleString()} · Version {upload.versionNumber}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={toneForStatus(upload.status)}>{formatStatusLabel(upload.status)}</Badge>
                        <button
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold"
                          onClick={() => void handleDownload(upload.id)}
                          type="button"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                    {upload.reviewNotes ? <p className="mt-3 text-sm text-slate-600">Reviewer notes: {upload.reviewNotes}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
