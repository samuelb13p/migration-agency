"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { apiFetchWithToken } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";
import { Card } from "../ui/card";

type DocumentTypeRecord = {
  id: string;
  code: string;
  name: string;
  allowedExtensions: string[];
  maxFileSizeMb: number;
};

type RuleRecord = {
  id: string;
  isRequired: boolean;
  sortOrder: number;
  documentTypeId: string;
  documentType: DocumentTypeRecord;
};

type VisaTypeRecord = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  requiredDocumentMappings: RuleRecord[];
};

export function VisaTypeForm({ mode, visaTypeId }: { mode: "create" | "edit"; visaTypeId?: string }) {
  const router = useRouter();
  const [visaType, setVisaType] = useState<VisaTypeRecord | null>(null);
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeRecord[]>([]);
  const [selectedDocumentTypeIds, setSelectedDocumentTypeIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const assignedDocumentTypeIds = new Set(visaType?.requiredDocumentMappings.map((rule) => rule.documentTypeId) ?? []);
  const availableDocumentTypes = documentTypes.filter((documentType) => !assignedDocumentTypeIds.has(documentType.id));

  async function loadDocumentTypes() {
    const token = getAccessToken();
    if (!token) return;
    const data = await apiFetchWithToken<DocumentTypeRecord[]>("/api/visa-types/document-types/all", token);
    setDocumentTypes(data);
  }

  async function loadVisaType() {
    if (!visaTypeId) return;
    const token = getAccessToken();
    if (!token) return;
    const data = await apiFetchWithToken<VisaTypeRecord>(`/api/visa-types/${visaTypeId}`, token);
    setVisaType(data);
    setSelectedDocumentTypeIds([]);
  }

  useEffect(() => {
    void loadDocumentTypes().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Unable to load document types.");
    });
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !visaTypeId) return;
    void loadVisaType().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Unable to load visa type.");
    });
  }, [mode, visaTypeId]);

  function handleSubmit(formData: FormData) {
    const token = getAccessToken();
    if (!token) return;

    setError(null);
    setMessage(null);

    const payload = {
      code: String(formData.get("code") ?? ""),
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      isActive: formData.get("isActive") === "on",
    };

    startTransition(() => {
      void apiFetchWithToken(mode === "create" ? "/api/visa-types" : `/api/visa-types/${visaTypeId}`, token, {
        method: mode === "create" ? "POST" : "PUT",
        body: JSON.stringify(payload),
      })
        .then(() => {
          setMessage(mode === "create" ? "Visa type created." : "Visa type updated.");
          router.push("/admin/visa-types");
          router.refresh();
        })
        .catch((submitError) => {
          setError(submitError instanceof Error ? submitError.message : "Unable to save visa type.");
        });
    });
  }

  function handleCreateRule(formData: FormData) {
    const token = getAccessToken();
    if (!token || !visaTypeId) return;

    setError(null);
    setMessage(null);

    const documentTypeIds = selectedDocumentTypeIds.filter((documentTypeId) => !assignedDocumentTypeIds.has(documentTypeId));

    if (!documentTypeIds.length) {
      setError("Select at least one unassigned document type.");
      return;
    }

    const nextSortOrder =
      visaType?.requiredDocumentMappings.length
        ? Math.max(...visaType.requiredDocumentMappings.map((rule) => rule.sortOrder)) + 1
        : 0;

    startTransition(() => {
      void Promise.all(
        documentTypeIds.map((documentTypeId, index) =>
          apiFetchWithToken(`/api/visa-types/${visaTypeId}/required-documents`, token, {
            method: "POST",
            body: JSON.stringify({
              documentTypeId,
              isRequired: true,
              sortOrder: nextSortOrder + index,
            }),
          }),
        ),
      )
        .then(async () => {
          setMessage(documentTypeIds.length === 1 ? "Required document added." : "Required documents added.");
          setSelectedDocumentTypeIds([]);
          await loadVisaType();
        })
        .catch((submitError) => {
          setError(submitError instanceof Error ? submitError.message : "Unable to add required documents.");
        });
    });
  }

  function handleToggleRequired(ruleId: string, isRequired: boolean) {
    const token = getAccessToken();
    if (!token || !visaTypeId) return;

    setError(null);
    setMessage(null);

    startTransition(() => {
      void apiFetchWithToken(`/api/required-documents/${ruleId}`, token, {
        method: "PUT",
        body: JSON.stringify({ isRequired }),
      })
        .then(async () => {
          setMessage("Required setting updated.");
          await loadVisaType();
        })
        .catch((submitError) => {
          setError(submitError instanceof Error ? submitError.message : "Unable to update required setting.");
        });
    });
  }

  function toggleDocumentType(documentTypeId: string) {
    setSelectedDocumentTypeIds((current) =>
      current.includes(documentTypeId) ? current.filter((id) => id !== documentTypeId) : [...current, documentTypeId],
    );
  }

  function handleDeleteRule(ruleId: string) {
    const token = getAccessToken();
    if (!token || !visaTypeId) return;

    setError(null);
    setMessage(null);

    startTransition(() => {
      void apiFetchWithToken(`/api/required-documents/${ruleId}`, token, { method: "DELETE" })
        .then(async () => {
          setMessage("Required document removed.");
          await loadVisaType();
        })
        .catch((submitError) => {
          setError(submitError instanceof Error ? submitError.message : "Unable to remove required document.");
        });
    });
  }

  if (mode === "edit" && !visaType && !error) {
    return (
      <Card>
        <p className="text-sm text-slate-500">Loading visa type...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-semibold">{mode === "create" ? "Create visa type" : "Edit visa type"}</h2>
        <p className="mt-2 text-sm text-slate-500">
          {mode === "create"
            ? "Create a visa type first, then manage its required documents from the edit screen."
            : "Update the visa type details, then manage its required document list below."}
        </p>

        {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}

        <form action={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={visaType?.code ?? ""} name="code" placeholder="Code" />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={visaType?.name ?? ""} name="name" placeholder="Name" />
          <textarea
            className="min-h-32 rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2"
            defaultValue={visaType?.description ?? ""}
            name="description"
            placeholder="Description"
          />
          <label className="flex items-center gap-3 text-sm text-slate-600 md:col-span-2">
            <input className="h-4 w-4" defaultChecked={visaType?.isActive ?? true} name="isActive" type="checkbox" />
            Active visa type
          </label>
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button className="rounded-2xl bg-accent px-4 py-3 font-semibold text-white" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </button>
            <button className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold" onClick={() => router.push("/admin/visa-types")} type="button">
              Cancel
            </button>
          </div>
        </form>
      </Card>

      {mode === "edit" && visaType ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">Required documents</h3>
              <p className="mt-1 text-sm text-slate-500">Assign the required document types for this visa type, then update or remove them below.</p>
            </div>
            <p className="text-sm text-slate-500">{visaType.requiredDocumentMappings.length} assigned</p>
          </div>

          <form action={handleCreateRule} className="mt-6 grid gap-4 rounded-3xl md:grid-cols-2">
            <div className="space-y-3 md:col-span-2">
              <div className="rounded-3xl border border-slate-200 p-4">
                <p className="text-sm font-medium text-slate-700">Choose required document types</p>
                <p className="mt-1 text-xs text-slate-500">Tick all the document types this visa needs. New selections are added as required by default. Already assigned items are hidden.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {availableDocumentTypes.length ? (
                    availableDocumentTypes.map((documentType) => {
                      const checked = selectedDocumentTypeIds.includes(documentType.id);

                      return (
                        <label
                          key={documentType.id}
                          className={`rounded-2xl border px-4 py-3 text-sm transition ${
                            checked ? "border-accent bg-accent/5" : "border-slate-200 bg-white"
                          }`}
                        >
                          <span className="flex items-start gap-3">
                            <input
                              checked={checked}
                              className="mt-1 h-4 w-4"
                              onChange={() => toggleDocumentType(documentType.id)}
                              type="checkbox"
                            />
                            <span>
                              <span className="block font-medium text-slate-900">{documentType.name}</span>
                              <span className="mt-1 block text-xs text-slate-500">
                                {documentType.code} · {documentType.allowedExtensions.join(", ")} · Max {documentType.maxFileSizeMb} MB
                              </span>
                            </span>
                          </span>
                        </label>
                      );
                    })
                  ) : (
                    <p className="text-sm text-slate-500">All available document types are already assigned to this visa type.</p>
                  )}
                </div>
              </div>
            </div>
            <button className="rounded-2xl bg-accent px-4 py-3 font-semibold text-white md:col-span-3 md:justify-self-start" disabled={isPending}>
              {isPending ? "Saving..." : "Add selected documents"}
            </button>
          </form>

          <div className="mt-6 space-y-4">
            {visaType.requiredDocumentMappings.map((rule) => (
              <div key={rule.id} className="rounded-3xl border border-slate-200 px-5 py-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">{rule.documentType.name}</p>
                    <p className="mt-2 text-slate-500">{rule.documentType.code} · {rule.documentType.allowedExtensions.join(", ")} · Max {rule.documentType.maxFileSizeMb} MB</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-2xl border border-slate-200 px-3 py-2 text-slate-600">Sort order: {rule.sortOrder}</span>
                    <label className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-slate-600">
                      <input
                        checked={rule.isRequired}
                        className="h-4 w-4"
                        disabled={isPending}
                        onChange={(event) => handleToggleRequired(rule.id, event.target.checked)}
                        type="checkbox"
                      />
                      Required
                    </label>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    className="rounded-2xl border border-rose-200 px-4 py-3 font-semibold text-rose-700"
                    disabled={isPending}
                    onClick={() => handleDeleteRule(rule.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
