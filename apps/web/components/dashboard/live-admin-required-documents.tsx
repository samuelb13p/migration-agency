"use client";

import { useEffect, useState, useTransition } from "react";
import { apiFetchWithToken } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";
import { Card } from "../ui/card";

type VisaTypeRecord = {
  id: string;
  name: string;
};

type DocumentTypeRecord = {
  id: string;
  name: string;
  code: string;
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

export function LiveAdminRequiredDocuments() {
  const [visaTypes, setVisaTypes] = useState<VisaTypeRecord[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeRecord[]>([]);
  const [selectedVisaTypeId, setSelectedVisaTypeId] = useState("");
  const [rules, setRules] = useState<RuleRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function loadVisaTypes() {
    const token = getAccessToken();
    if (!token) return;
    const data = await apiFetchWithToken<VisaTypeRecord[]>("/api/visa-types", token);
    setVisaTypes(data);
    if (!selectedVisaTypeId && data[0]) {
      setSelectedVisaTypeId(data[0].id);
    }
  }

  async function loadDocumentTypes() {
    const token = getAccessToken();
    if (!token) return;
    const data = await apiFetchWithToken<DocumentTypeRecord[]>("/api/visa-types/document-types/all", token);
    setDocumentTypes(data);
  }

  async function loadRules(visaTypeId: string) {
    const token = getAccessToken();
    if (!token || !visaTypeId) return;
    const data = await apiFetchWithToken<RuleRecord[]>(`/api/visa-types/${visaTypeId}/required-documents`, token);
    setRules(data);
  }

  async function reloadAll(visaTypeId = selectedVisaTypeId) {
    await Promise.all([loadVisaTypes(), loadDocumentTypes()]);
    if (visaTypeId) {
      await loadRules(visaTypeId);
    }
  }

  useEffect(() => {
    void Promise.all([loadVisaTypes(), loadDocumentTypes()]).catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Unable to load configuration.");
    });
  }, []);

  useEffect(() => {
    if (!selectedVisaTypeId) return;

    void loadRules(selectedVisaTypeId).catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Unable to load required document rules.");
    });
  }, [selectedVisaTypeId]);

  function clearFeedback() {
    setError(null);
    setMessage(null);
  }

  function handleCreateDocumentType(formData: FormData) {
    const token = getAccessToken();
    if (!token) return;
    clearFeedback();

    startTransition(() => {
      void apiFetchWithToken("/api/visa-types/document-types/all", token, {
        method: "POST",
        body: JSON.stringify({
          code: String(formData.get("code") ?? ""),
          name: String(formData.get("name") ?? ""),
          description: String(formData.get("description") ?? ""),
          allowedExtensions: String(formData.get("allowedExtensions") ?? "")
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
          maxFileSizeMb: Number(formData.get("maxFileSizeMb") ?? 10),
        }),
      })
        .then(async () => {
          setMessage("Document type created.");
          await reloadAll();
        })
        .catch((createError) => {
          setError(createError instanceof Error ? createError.message : "Unable to create document type.");
        });
    });
  }

  function handleCreateRule(formData: FormData) {
    const token = getAccessToken();
    if (!token || !selectedVisaTypeId) return;
    clearFeedback();

    startTransition(() => {
      void apiFetchWithToken(`/api/visa-types/${selectedVisaTypeId}/required-documents`, token, {
        method: "POST",
        body: JSON.stringify({
          documentTypeId: String(formData.get("documentTypeId") ?? ""),
          isRequired: formData.get("isRequired") === "on",
          sortOrder: Number(formData.get("sortOrder") ?? 0),
        }),
      })
        .then(async () => {
          setMessage("Rule added to visa type.");
          await loadRules(selectedVisaTypeId);
        })
        .catch((createError) => {
          setError(createError instanceof Error ? createError.message : "Unable to create required document rule.");
        });
    });
  }

  function handleUpdateRule(ruleId: string, formData: FormData) {
    const token = getAccessToken();
    if (!token) return;
    clearFeedback();

    startTransition(() => {
      void apiFetchWithToken(`/api/required-documents/${ruleId}`, token, {
        method: "PUT",
        body: JSON.stringify({
          documentTypeId: String(formData.get("documentTypeId") ?? ""),
          isRequired: formData.get("isRequired") === "on",
          sortOrder: Number(formData.get("sortOrder") ?? 0),
        }),
      })
        .then(async () => {
          setMessage("Rule updated.");
          await loadRules(selectedVisaTypeId);
        })
        .catch((updateError) => {
          setError(updateError instanceof Error ? updateError.message : "Unable to update rule.");
        });
    });
  }

  function handleDeleteRule(ruleId: string) {
    const token = getAccessToken();
    if (!token) return;
    clearFeedback();

    startTransition(() => {
      void apiFetchWithToken(`/api/required-documents/${ruleId}`, token, { method: "DELETE" })
        .then(async () => {
          setMessage("Rule deleted.");
          await loadRules(selectedVisaTypeId);
        })
        .catch((deleteError) => {
          setError(deleteError instanceof Error ? deleteError.message : "Unable to delete rule.");
        });
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-semibold">Create document type</h2>
        <form action={handleCreateDocumentType} className="mt-6 grid gap-4 md:grid-cols-2">
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Required document rules</h2>
          <select
            className="rounded-2xl border border-slate-200 px-4 py-3"
            onChange={(event) => setSelectedVisaTypeId(event.target.value)}
            value={selectedVisaTypeId}
          >
            {visaTypes.map((visaType) => (
              <option key={visaType.id} value={visaType.id}>
                {visaType.name}
              </option>
            ))}
          </select>
        </div>
        {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}

        <form action={handleCreateRule} className="mt-6 grid gap-4 rounded-3xl border border-slate-200 p-5 md:grid-cols-3">
          <select className="rounded-2xl border border-slate-200 px-4 py-3" name="documentTypeId">
            {documentTypes.map((documentType) => (
              <option key={documentType.id} value={documentType.id}>
                {documentType.name}
              </option>
            ))}
          </select>
          <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue="0" min="0" name="sortOrder" type="number" />
          <label className="flex items-center gap-3 text-sm text-slate-600">
            <input className="h-4 w-4" defaultChecked name="isRequired" type="checkbox" />
            Required
          </label>
          <button className="rounded-2xl bg-accent px-4 py-3 font-semibold text-white md:col-span-3 md:justify-self-start" disabled={isPending}>
            {isPending ? "Saving..." : "Add rule"}
          </button>
        </form>

        <div className="mt-6 space-y-4">
          {rules.map((rule) => (
            <form key={rule.id} action={(formData) => handleUpdateRule(rule.id, formData)} className="rounded-3xl border border-slate-200 px-5 py-4 text-sm">
              <div className="grid gap-4 md:grid-cols-3">
                <select className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={rule.documentTypeId} name="documentTypeId">
                  {documentTypes.map((documentType) => (
                    <option key={documentType.id} value={documentType.id}>
                      {documentType.name}
                    </option>
                  ))}
                </select>
                <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={rule.sortOrder} min="0" name="sortOrder" type="number" />
                <label className="flex items-center gap-3 text-slate-600">
                  <input className="h-4 w-4" defaultChecked={rule.isRequired} name="isRequired" type="checkbox" />
                  Required
                </label>
              </div>
              <p className="mt-3 text-slate-500">
                {rule.documentType.code} · {rule.documentType.allowedExtensions.join(", ")} · Max {rule.documentType.maxFileSizeMb} MB
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button className="rounded-2xl bg-accent px-4 py-3 font-semibold text-white" disabled={isPending}>
                  Save changes
                </button>
                <button
                  className="rounded-2xl border border-rose-200 px-4 py-3 font-semibold text-rose-700"
                  disabled={isPending}
                  onClick={() => handleDeleteRule(rule.id)}
                  type="button"
                >
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
