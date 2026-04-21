"use client";

import { useEffect, useState, useTransition } from "react";
import { apiFetchWithToken } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";
import { Card } from "../ui/card";

type ContractTemplateRecord = {
  id: string;
  name: string;
  version: string;
  body: string;
  isActive: boolean;
};

export function LiveAdminContractTemplates() {
  const [templates, setTemplates] = useState<ContractTemplateRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function load() {
    const token = getAccessToken();
    if (!token) return;
    const data = await apiFetchWithToken<ContractTemplateRecord[]>("/api/admin/contract-templates", token);
    setTemplates(data);
  }

  useEffect(() => {
    void load().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Unable to load contract templates.");
    });
  }, []);

  function clearFeedback() {
    setError(null);
    setMessage(null);
  }

  function handleCreate(formData: FormData) {
    const token = getAccessToken();
    if (!token) return;
    clearFeedback();

    startTransition(() => {
      void apiFetchWithToken("/api/admin/contract-templates", token, {
        method: "POST",
        body: JSON.stringify({
          name: String(formData.get("name") ?? ""),
          version: String(formData.get("version") ?? ""),
          body: String(formData.get("body") ?? ""),
          isActive: formData.get("isActive") === "on",
        }),
      })
        .then(async () => {
          setMessage("Contract template created.");
          await load();
        })
        .catch((createError) => {
          setError(createError instanceof Error ? createError.message : "Unable to create contract template.");
        });
    });
  }

  function handleUpdate(templateId: string, formData: FormData) {
    const token = getAccessToken();
    if (!token) return;
    clearFeedback();

    startTransition(() => {
      void apiFetchWithToken(`/api/admin/contract-templates/${templateId}`, token, {
        method: "PUT",
        body: JSON.stringify({
          name: String(formData.get("name") ?? ""),
          version: String(formData.get("version") ?? ""),
          body: String(formData.get("body") ?? ""),
          isActive: formData.get("isActive") === "on",
        }),
      })
        .then(async () => {
          setMessage("Contract template updated.");
          await load();
        })
        .catch((updateError) => {
          setError(updateError instanceof Error ? updateError.message : "Unable to update contract template.");
        });
    });
  }

  function handleDelete(templateId: string) {
    const token = getAccessToken();
    if (!token) return;
    clearFeedback();

    startTransition(() => {
      void apiFetchWithToken(`/api/admin/contract-templates/${templateId}`, token, { method: "DELETE" })
        .then(async () => {
          setMessage("Contract template deleted.");
          await load();
        })
        .catch((deleteError) => {
          setError(deleteError instanceof Error ? deleteError.message : "Unable to delete contract template.");
        });
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-semibold">Create contract template</h2>
        <form action={handleCreate} className="mt-6 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <input className="rounded-2xl border border-slate-200 px-4 py-3" name="name" placeholder="Template name" />
            <input className="rounded-2xl border border-slate-200 px-4 py-3" name="version" placeholder="Version" />
          </div>
          <textarea className="min-h-40 rounded-2xl border border-slate-200 px-4 py-3" name="body" placeholder="Template body with placeholders" />
          <label className="flex items-center gap-3 text-sm text-slate-600">
            <input className="h-4 w-4" defaultChecked name="isActive" type="checkbox" />
            Active
          </label>
          <button className="rounded-2xl bg-accent px-4 py-3 font-semibold text-white" disabled={isPending}>
            {isPending ? "Saving..." : "Create contract template"}
          </button>
        </form>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold">Contract templates</h2>
        {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
        <div className="mt-6 space-y-4">
          {templates.map((template) => (
            <form key={template.id} action={(formData) => handleUpdate(template.id, formData)} className="rounded-3xl border border-slate-200 px-5 py-4 text-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={template.name} name="name" />
                <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={template.version} name="version" />
              </div>
              <textarea className="mt-4 min-h-40 w-full rounded-2xl border border-slate-200 px-4 py-3" defaultValue={template.body} name="body" />
              <label className="mt-4 flex items-center gap-3 text-slate-600">
                <input className="h-4 w-4" defaultChecked={template.isActive} name="isActive" type="checkbox" />
                Active
              </label>
              <div className="mt-4 flex flex-wrap gap-3">
                <button className="rounded-2xl bg-accent px-4 py-3 font-semibold text-white" disabled={isPending}>
                  Save changes
                </button>
                <button className="rounded-2xl border border-rose-200 px-4 py-3 font-semibold text-rose-700" disabled={isPending} onClick={() => handleDelete(template.id)} type="button">
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
