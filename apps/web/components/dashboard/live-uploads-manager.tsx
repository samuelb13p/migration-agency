"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { apiFetchWithToken, getApiUrl } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";

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

function toneForReview(status: string) {
  if (status === "approved") return "success" as const;
  if (status === "rejected") return "danger" as const;
  if (status === "reupload_requested") return "warning" as const;
  return "neutral" as const;
}

export function LiveUploadsManager({ caseId, allowUpload = true }: { caseId: string; allowUpload?: boolean }) {
  const [caseRecord, setCaseRecord] = useState<VisaCaseRecord | null>(null);
  const [documentRules, setDocumentRules] = useState<RequiredDocumentRule[]>([]);
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [selectedDocumentTypeId, setSelectedDocumentTypeId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function load() {
    const token = getAccessToken();
    if (!token) return;
    const accessToken = token;

    const visaCase = await apiFetchWithToken<VisaCaseRecord>(`/api/visa-cases/${caseId}`, accessToken);
    const rules = await apiFetchWithToken<RequiredDocumentRule[]>(`/api/visa-types/${visaCase.visaType.id}/required-documents`, accessToken);
    const uploadRecords = await apiFetchWithToken<UploadRecord[]>(`/api/visa-cases/${caseId}/uploads`, accessToken);

    setCaseRecord(visaCase);
    setDocumentRules(rules);
    setUploads(uploadRecords);
    if (rules[0] && !selectedDocumentTypeId) {
      setSelectedDocumentTypeId(rules[0].documentType.id);
    }
  }

  useEffect(() => {
    void load().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Unable to load uploads.");
    });
  }, [caseId]);

  const selectedRule = useMemo(
    () => documentRules.find((rule) => rule.documentType.id === selectedDocumentTypeId) ?? documentRules[0] ?? null,
    [documentRules, selectedDocumentTypeId],
  );

  async function handleUpload(formData: FormData) {
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
    payload.append("documentTypeId", String(formData.get("documentTypeId") ?? ""));
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
          <h2 className="text-xl font-semibold">Upload a new file</h2>
          <p className="mt-3 text-sm text-slate-600">
            {caseRecord ? `Upload private files for ${caseRecord.visaType.name}.` : "Allowed file types depend on the selected document type."}
          </p>
          {selectedRule ? (
            <p className="mt-2 text-sm text-slate-500">
              Allowed extensions: {selectedRule.documentType.allowedExtensions.join(", ")}. Max size: {selectedRule.documentType.maxFileSizeMb} MB.
            </p>
          ) : null}
          <form action={handleUpload} className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <select
              className="rounded-2xl border border-slate-200 px-4 py-3"
              defaultValue={selectedRule?.documentType.id ?? ""}
              name="documentTypeId"
              onChange={(event) => setSelectedDocumentTypeId(event.target.value)}
            >
              {documentRules.map((rule) => (
                <option key={rule.id} value={rule.documentType.id}>
                  {rule.documentType.name}
                </option>
              ))}
            </select>
            <input className="rounded-2xl border border-slate-200 px-4 py-3" type="file" name="file" />
            <button className="rounded-2xl bg-accent px-5 py-3 font-semibold text-white" disabled={isPending}>
              {isPending ? "Uploading..." : "Upload"}
            </button>
          </form>
          {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
        </Card>
      ) : null}
      <Card>
        <h2 className="text-xl font-semibold">Upload history</h2>
        <div className="mt-6 space-y-3">
          {uploads.length === 0 ? <p className="text-sm text-slate-500">No uploads are available for this visa case yet.</p> : null}
          {uploads.map((upload) => (
            <div key={upload.id} className="rounded-3xl border border-slate-200 px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {upload.documentType.name} · v{upload.versionNumber}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">{upload.originalFileName}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {Math.ceil(upload.fileSizeBytes / 1024)} KB · {new Date(upload.uploadedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={toneForReview(upload.status)}>{upload.status.replaceAll("_", " ")}</Badge>
                  <button className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold" onClick={() => void handleDownload(upload.id)} type="button">
                    Download
                  </button>
                </div>
              </div>
              {upload.reviewNotes ? <p className="mt-3 text-sm text-slate-600">Reviewer notes: {upload.reviewNotes}</p> : null}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
