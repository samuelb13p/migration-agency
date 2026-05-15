"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { apiFetchWithToken } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";
import { Card } from "../ui/card";
import { LoadingSpinner } from "../ui/loading-spinner";

type DocumentTypeRecord = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  allowedExtensions: string[];
  maxFileSizeMb: number;
};

export function DocumentTypeForm({ mode, documentTypeId }: { mode: "create" | "edit"; documentTypeId?: string }) {
  const router = useRouter();
  const [documentType, setDocumentType] = useState<DocumentTypeRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (mode !== "edit" || !documentTypeId) return;
    const token = getAccessToken();
    if (!token) return;

    void apiFetchWithToken<DocumentTypeRecord>(`/api/admin/document-types/${documentTypeId}`, token)
      .then(setDocumentType)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load document type.");
      });
  }, [mode, documentTypeId]);

  function handleSubmit(formData: FormData) {
    const token = getAccessToken();
    if (!token) return;

    setError(null);
    setMessage(null);

    const payload = {
      code: String(formData.get("code") ?? ""),
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      allowedExtensions: String(formData.get("allowedExtensions") ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      maxFileSizeMb: Number(formData.get("maxFileSizeMb") ?? 10),
    };

    startTransition(() => {
      void apiFetchWithToken(
        mode === "create" ? "/api/admin/document-types" : `/api/admin/document-types/${documentTypeId}`,
        token,
        {
          method: mode === "create" ? "POST" : "PUT",
          body: JSON.stringify(payload),
        },
      )
        .then(() => {
          setMessage(mode === "create" ? "Document type created." : "Document type updated.");
          router.push("/admin/document-types");
          router.refresh();
        })
        .catch((submitError) => {
          setError(submitError instanceof Error ? submitError.message : "Unable to save document type.");
        });
    });
  }

  if (mode === "edit" && !documentType && !error) {
    return (
      <Card>
        <p className="text-sm text-slate-500">Loading document type...</p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-xl font-semibold">{mode === "create" ? "Create document type" : "Edit document type"}</h2>
      <p className="mt-2 text-sm text-slate-500">
        {mode === "create"
          ? "Define a document type, allowed extensions, and file-size limits for uploads."
          : "Update the document type settings, then save the record."}
      </p>

      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}

      <form action={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
        <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={documentType?.code ?? ""} name="code" placeholder="Code" />
        <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={documentType?.name ?? ""} name="name" placeholder="Name" />
        <input
          className="rounded-2xl border border-slate-200 px-4 py-3"
          defaultValue={documentType?.allowedExtensions.join(",") ?? ""}
          name="allowedExtensions"
          placeholder="pdf,jpg,png"
        />
        <input
          className="rounded-2xl border border-slate-200 px-4 py-3"
          defaultValue={documentType?.maxFileSizeMb ?? 10}
          min="1"
          name="maxFileSizeMb"
          type="number"
        />
        <textarea
          className="min-h-32 rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2"
          defaultValue={documentType?.description ?? ""}
          name="description"
          placeholder="Description"
        />
        <div className="flex flex-wrap gap-3 md:col-span-2">
          <button className="rounded-2xl bg-accent px-4 py-3 font-semibold text-white" disabled={isPending}>
            <span className="inline-flex items-center justify-center gap-2">
              {isPending ? <LoadingSpinner label="Saving document type" /> : null}
              <span>{isPending ? "Saving..." : "Save"}</span>
            </span>
          </button>
          <button className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold" onClick={() => router.push("/admin/document-types")} type="button">
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}
