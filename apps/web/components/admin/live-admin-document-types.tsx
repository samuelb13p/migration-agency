"use client";

import Link from "next/link";
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

  function handleDelete(documentTypeId: string) {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    setMessage(null);

    startTransition(() => {
      void apiFetchWithToken(`/api/admin/document-types/${documentTypeId}`, token, { method: "DELETE" })
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
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Document types</h2>
          <p className="mt-1 text-sm text-slate-500">See all document types, then open a dedicated edit view or delete them.</p>
        </div>
        <Link href="/admin/document-types/create" className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white">
          Create document type
        </Link>
      </div>
      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-3 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-4 py-2 font-medium">Document type</th>
              <th className="px-4 py-2 font-medium">Extensions</th>
              <th className="px-4 py-2 font-medium">Max size</th>
              <th className="px-4 py-2 font-medium">Assignments</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documentTypes.map((documentType) => (
              <tr key={documentType.id}>
                <td className="rounded-l-3xl border-y border-l border-slate-200 px-4 py-4">
                  <p className="font-medium">{documentType.name}</p>
                  <p className="mt-1 text-slate-500">{documentType.code}</p>
                </td>
                <td className="border-y border-slate-200 px-4 py-4">{documentType.allowedExtensions.join(", ")}</td>
                <td className="border-y border-slate-200 px-4 py-4">{documentType.maxFileSizeMb} MB</td>
                <td className="border-y border-slate-200 px-4 py-4">{documentType.visaTypeMappings.length}</td>
                <td className="rounded-r-3xl border-y border-r border-slate-200 px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/document-types/${documentType.id}`} className="rounded-2xl border border-slate-200 px-3 py-2 font-semibold">
                      Edit
                    </Link>
                    <button className="rounded-2xl border border-rose-200 px-3 py-2 font-semibold text-rose-700" disabled={isPending} onClick={() => handleDelete(documentType.id)} type="button">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
