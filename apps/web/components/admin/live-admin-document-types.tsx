"use client";

import { useEffect, useState, useTransition } from "react";
import { apiFetchWithToken } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";
import { Card } from "../ui/card";

type DocumentTypeRecord = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  allowedExtensions: string[];
  maxFileSizeMb: number;
  visaTypeMappings: Array<{ id: string }>;
};

export function LiveAdminDocumentTypes() {
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function load() {
    const token = getAccessToken();
    if (!token) return;
    const data = await apiFetchWithToken<DocumentTypeRecord[]>("/api/admin/document-types", token);
    setDocumentTypes(data);
  }

  useEffect(() => {
    void load().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Unable to load document types.");
    });
  }, []);

  function clearFeedback() {
    setError(null);
    setMessage(null);
  }

  function toExtensions(value: FormDataEntryValue | null) {
    return String(value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function handleCreate(formData: FormData) {
    const token = getAccessToken();
    if (!token) return;
    clearFeedback();

    startTransition(() => {
      void apiFetchWithToken("/api/admin/document-types", token, {
        method: "POST",
        body: JSON.stringify({
          code: String(formData.get("code") ?? ""),
          name: String(formData.get("name") ?? ""),
          description: String(formData.get("description") ?? ""),
          allowedExtensions: toExtensions(formData.get("allowedExtensions")),
          maxFileSizeMb: Number(formData.get("maxFileSizeMb") ?? 10),
        }),
      })
        .then(async () => {
          setMessage("Document type created.");
          await load();
        })
        .catch((createError) => {
          setError(createError instanceof Error ? createError.message : "Unable to create document type.");
        });
    });
  }

  function handleUpdate(documentTypeId: string, formData: FormData) {
    const token = getAccessToken();
    if (!token) return;
    clearFeedback();

    startTransition(() => {
      void apiFetchWithToken(`/api/admin/document-types/${documentTypeId}`, token, {
        method: "PUT",
        body: JSON.stringify({
          code: String(formData.get("code") ?? ""),
          name: String(formData.get("name") ?? ""),
          description: String(formData.get("description") ?? ""),
          allowedExtensions: toExtensions(formData.get("allowedExtensions")),
          maxFileSizeMb: Number(formData.get("maxFileSizeMb") ?? 10),
        }),
      })
        .then(async () => {
          setMessage("Document type updated.");
          await load();
        })
        .catch((updateError) => {
          setError(updateError instanceof Error ? updateError.message : "Unable to update document type.");
        });
    });
  }

  function handleDelete(documentTypeId: string) {
    const token = getAccessToken();
    if (!token) return;
    clearFeedback();

    startTransition(() => {
      void apiFetchWithToken(`/api/admin/document-types/${documentTypeId}`, token, {
        method: "DELETE",
      })
        .then(async () => {
          setMessage("Document type deleted.");
          await load();
        })
        .catch((deleteError) => {
          setError(deleteError instanceof Error ? deleteError.message : "Unable to delete document type.");
        });
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-semibold">Create document type</h2>
        <form action={handleCreate} className="mt-6 grid gap-4 md:grid-cols-2">
          <input className="rounded-2xl border border-slate-200 px-4 py-3" name="code" placeholder="Code" />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" name="name" placeholder="Name" />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" name="allowedExtensions" placeholder="pdf,jpg,png" />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue="10" min="1" name="maxFileSizeMb" type="number" />
          <textarea className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" name="description" placeholder="Description" />
          <button className="rounded-2xl bg-accent px-4 py-3 font-semibold text-white md:justify-self-end" disabled={isPending}>
            {isPending ? "Saving..." : "Create document type"}
          </button>
        </form>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold">Document types</h2>
        {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
        <div className="mt-6 space-y-4">
          {documentTypes.map((documentType) => (
            <form key={documentType.id} action={(formData) => handleUpdate(documentType.id, formData)} className="rounded-3xl border border-slate-200 px-5 py-4 text-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={documentType.code} name="code" />
                <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={documentType.name} name="name" />
                <input
                  className="rounded-2xl border border-slate-200 px-4 py-3"
                  defaultValue={documentType.allowedExtensions.join(",")}
                  name="allowedExtensions"
                />
                <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={documentType.maxFileSizeMb} min="1" name="maxFileSizeMb" type="number" />
                <textarea className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" defaultValue={documentType.description ?? ""} name="description" />
              </div>
              <p className="mt-3 text-slate-500">{documentType.visaTypeMappings.length} visa-type assignment(s)</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button className="rounded-2xl bg-accent px-4 py-3 font-semibold text-white" disabled={isPending}>
                  Save changes
                </button>
                <button className="rounded-2xl border border-rose-200 px-4 py-3 font-semibold text-rose-700" disabled={isPending} onClick={() => handleDelete(documentType.id)} type="button">
                  Delete
                </button>
              </div>
            </form>
          ))}
        </div>
      </Card>
    </div>
  );
}
