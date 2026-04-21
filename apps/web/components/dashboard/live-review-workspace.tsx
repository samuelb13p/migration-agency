"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { apiFetchWithToken } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";

type UploadRecord = {
  id: string;
  originalFileName: string;
  status: string;
  versionNumber: number;
  reviewNotes?: string | null;
  documentType: { name: string };
};

export function LiveReviewWorkspace({ caseId }: { caseId: string }) {
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [selectedUploadId, setSelectedUploadId] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function load() {
    const token = getAccessToken();
    if (!token) return;
    const accessToken = token;
    const data = await apiFetchWithToken<UploadRecord[]>(`/api/visa-cases/${caseId}/uploads`, accessToken);
    setUploads(data);
    if (!selectedUploadId && data[0]) {
      setSelectedUploadId(data[0].id);
      setReviewNotes(data[0].reviewNotes ?? "");
    }
  }

  useEffect(() => {
    void load().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Unable to load review workspace.");
    });
  }, [caseId]);

  const selectedUpload = useMemo(
    () => uploads.find((item) => item.id === selectedUploadId) ?? uploads[0] ?? null,
    [selectedUploadId, uploads],
  );

  useEffect(() => {
    if (selectedUpload) {
      setReviewNotes(selectedUpload.reviewNotes ?? "");
    }
  }, [selectedUpload]);

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
          setMessage(`Document marked as ${status.replaceAll("_", " ")}.`);
          await load();
        })
        .catch((reviewError) => {
          setError(reviewError instanceof Error ? reviewError.message : "Review failed.");
        });
    });
  }

  if (error && uploads.length === 0) {
    return (
      <Card>
        <p className="text-sm text-rose-600">{error}</p>
      </Card>
    );
  }

  if (!selectedUpload) {
    return (
      <Card>
        <p className="text-sm text-slate-500">No uploads are available for review yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-semibold">Select an upload</h2>
        <div className="mt-6 flex flex-wrap gap-3">
          {uploads.map((upload) => (
            <button
              key={upload.id}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${selectedUpload.id === upload.id ? "border-accent bg-accent/10 text-accent" : "border-slate-200"}`}
              onClick={() => setSelectedUploadId(upload.id)}
              type="button"
            >
              {upload.documentType.name} v{upload.versionNumber}
            </button>
          ))}
        </div>
      </Card>
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{selectedUpload.documentType.name}</h2>
            <p className="mt-2 text-sm text-slate-600">{selectedUpload.originalFileName}</p>
          </div>
          <Badge tone={selectedUpload.status === "approved" ? "success" : selectedUpload.status === "pending" ? "warning" : "neutral"}>
            {selectedUpload.status.replaceAll("_", " ")}
          </Badge>
        </div>
        <textarea
          className="mt-6 min-h-32 w-full rounded-3xl border border-slate-200 px-4 py-3"
          onChange={(event) => setReviewNotes(event.target.value)}
          placeholder="Add review notes for the customer and audit trail."
          value={reviewNotes}
        />
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white" disabled={isPending} onClick={() => void submitReview("approved")} type="button">
            Approve
          </button>
          <button className="rounded-2xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white" disabled={isPending} onClick={() => void submitReview("reupload_requested")} type="button">
            Request re-upload
          </button>
          <button className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white" disabled={isPending} onClick={() => void submitReview("rejected")} type="button">
            Reject
          </button>
        </div>
        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      </Card>
    </div>
  );
}
