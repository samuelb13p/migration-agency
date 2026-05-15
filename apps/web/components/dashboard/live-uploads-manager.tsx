"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { apiFetchWithToken, getApiUrl } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { LoadingSpinner } from "../ui/loading-spinner";

type VisaCaseRecord = {
  id: string;
  visaType: { id: string; name: string };
};

type RequiredDocumentRule = {
  id: string;
  isRequired: boolean;
  sortOrder: number;
  documentType: {
    id: string;
    code: string;
    name: string;
    allowedExtensions: string[];
    maxFileSizeMb: number;
  };
};

type UploadRecord = {
  id: string;
  originalFileName: string;
  fileSizeBytes: number;
  versionNumber: number;
  status: string;
  reviewNotes?: string | null;
  uploadedAt: string;
  documentType: { id: string; name: string; code: string };
};

type UploadStatusSummary = {
  label: string;
  tone: "success" | "warning" | "danger" | "neutral";
  canUpload: boolean;
  actionLabel: string;
};

type DocumentRuleWithStatus = RequiredDocumentRule & {
  uploadStatus: UploadStatusSummary;
};

type UploadHistoryGroup = {
  documentTypeId: string;
  documentTypeName: string;
  uploads: UploadRecord[];
};

function toneForReview(status: string) {
  if (status === "approved") return "success" as const;
  if (status === "rejected") return "danger" as const;
  if (status === "reupload_requested") return "warning" as const;
  return "neutral" as const;
}

function formatStatusLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getLatestUploadStatus(uploads: UploadRecord[], documentTypeId: string): UploadStatusSummary {
  const latest = uploads
    .filter((upload) => upload.documentType.id === documentTypeId)
    .sort((left, right) => right.versionNumber - left.versionNumber)[0];

  if (!latest) {
    return { label: "missing", tone: "warning", canUpload: true, actionLabel: "Upload" };
  }

  if (latest.status === "approved") {
    return { label: "approved", tone: "success", canUpload: false, actionLabel: "Approved" };
  }

  if (latest.status === "rejected") {
    return { label: "rejected", tone: "danger", canUpload: true, actionLabel: "Upload again" };
  }

  if (latest.status === "reupload_requested") {
    return { label: "reupload requested", tone: "warning", canUpload: true, actionLabel: "Upload again" };
  }

  return { label: "waiting review", tone: "neutral", canUpload: false, actionLabel: "Waiting review" };
}

export function LiveUploadsManager({ caseId, allowUpload = true }: { caseId: string; allowUpload?: boolean }) {
  const [caseRecord, setCaseRecord] = useState<VisaCaseRecord | null>(null);
  const [documentRules, setDocumentRules] = useState<RequiredDocumentRule[]>([]);
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function load() {
    const token = getAccessToken();
    if (!token) return;
    const accessToken = token;

    const visaCase = await apiFetchWithToken<VisaCaseRecord>(`/api/visa-cases/${caseId}`, accessToken);
    const rules = await apiFetchWithToken<RequiredDocumentRule[]>(
      `/api/visa-types/${visaCase.visaType.id}/required-documents`,
      accessToken,
    );
    const uploadRecords = await apiFetchWithToken<UploadRecord[]>(`/api/visa-cases/${caseId}/uploads`, accessToken);

    setCaseRecord(visaCase);
    setDocumentRules(rules);
    setUploads(uploadRecords);
  }

  useEffect(() => {
    void load().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Unable to load uploads.");
    });
  }, [caseId]);

  const groupedDocumentRules = useMemo(() => {
    const decoratedRules: DocumentRuleWithStatus[] = documentRules.map((rule) => ({
      ...rule,
      uploadStatus: getLatestUploadStatus(uploads, rule.documentType.id),
    }));

    return {
      actionNeeded: decoratedRules.filter((rule) =>
        ["missing", "rejected", "reupload requested"].includes(rule.uploadStatus.label),
      ),
      waitingReview: decoratedRules.filter((rule) => rule.uploadStatus.label === "waiting review"),
      approved: decoratedRules.filter((rule) => rule.uploadStatus.label === "approved"),
    };
  }, [documentRules, uploads]);

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

  async function handleUploadForDocument(documentTypeId: string, formData: FormData) {
    const token = getAccessToken();
    if (!token) return;
    const accessToken = token;
    const file = formData.get("file");

    setError(null);
    setMessage(null);

    if (!(file instanceof File) || file.size === 0) {
      setError("Choose a file before uploading.");
      return;
    }

    const payload = new FormData();
    payload.append("documentTypeId", documentTypeId);
    payload.append("file", file);

    startTransition(() => {
      void apiFetchWithToken(`/api/visa-cases/${caseId}/uploads`, accessToken, {
        method: "POST",
        body: payload,
      })
        .then(async () => {
          setMessage("Document uploaded successfully.");
          await load();
        })
        .catch((uploadError) => {
          setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
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

  function renderRuleGroup(title: string, description: string, rules: DocumentRuleWithStatus[]) {
    if (!rules.length) return null;

    return (
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <div className="space-y-3">
          {rules.map((rule) => (
            <form
              key={rule.id}
              action={(formData) => handleUploadForDocument(rule.documentType.id, formData)}
              className="grid gap-4 rounded-3xl border border-slate-200 px-5 py-4 md:grid-cols-[minmax(0,1.7fr)_auto_minmax(220px,1fr)_auto] md:items-center"
            >
              <div className="min-w-0">
                <p className="font-medium">{rule.documentType.name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {rule.documentType.allowedExtensions.join(", ")} · Max {rule.documentType.maxFileSizeMb} MB
                </p>
              </div>
              <div>
                <Badge tone={rule.uploadStatus.tone}>{rule.uploadStatus.label}</Badge>
              </div>
              <div>
                {rule.uploadStatus.canUpload ? (
                  <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" name="file" type="file" />
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-400">Locked</div>
                )}
              </div>
              <div className="md:justify-self-end">
                <button
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                    rule.uploadStatus.canUpload
                      ? "bg-accent text-white"
                      : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                  }`}
                  disabled={!rule.uploadStatus.canUpload || isPending}
                  type="submit"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    {isPending && rule.uploadStatus.canUpload ? <LoadingSpinner label="Uploading document" /> : null}
                    <span>{isPending && rule.uploadStatus.canUpload ? "Uploading..." : rule.uploadStatus.actionLabel}</span>
                  </span>
                </button>
              </div>
            </form>
          ))}
        </div>
      </div>
    );
  }

  if (error && !caseRecord) {
    return (
      <Card>
        <p className="text-sm text-rose-600">{error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {allowUpload ? (
        <Card>
          <h2 className="text-xl font-semibold">Upload documents</h2>
          <p className="mt-3 text-sm text-slate-600">
            {caseRecord
              ? `Upload private files for ${caseRecord.visaType.name}.`
              : "Required documents are based on the selected visa type."}
          </p>
          <div className="mt-6 space-y-6">
            {renderRuleGroup(
              "Action Needed",
              "Documents that are missing, rejected, or need to be uploaded again.",
              groupedDocumentRules.actionNeeded,
            )}
            {renderRuleGroup(
              "Waiting Review",
              "Documents already uploaded and currently waiting for the agent review.",
              groupedDocumentRules.waitingReview,
            )}
            {renderRuleGroup(
              "Approved",
              "Documents that have already been accepted by the assigned agent.",
              groupedDocumentRules.approved,
            )}
          </div>
          {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
        </Card>
      ) : null}
      <Card>
        <h2 className="text-xl font-semibold">Upload history</h2>
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
                          {Math.ceil(upload.fileSizeBytes / 1024)} KB · {new Date(upload.uploadedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={toneForReview(upload.status)}>{formatStatusLabel(upload.status)}</Badge>
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
