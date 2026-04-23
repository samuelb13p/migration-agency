"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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

export function ContractTemplateForm({ mode, templateId }: { mode: "create" | "edit"; templateId?: string }) {
  const router = useRouter();
  const [template, setTemplate] = useState<ContractTemplateRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (mode !== "edit" || !templateId) return;
    const token = getAccessToken();
    if (!token) return;

    void apiFetchWithToken<ContractTemplateRecord>(`/api/admin/contract-templates/${templateId}`, token)
      .then(setTemplate)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load contract template.");
      });
  }, [mode, templateId]);

  function handleSubmit(formData: FormData) {
    const token = getAccessToken();
    if (!token) return;

    setError(null);
    setMessage(null);

    const payload = {
      name: String(formData.get("name") ?? ""),
      version: String(formData.get("version") ?? ""),
      body: String(formData.get("body") ?? ""),
      isActive: formData.get("isActive") === "on",
    };

    startTransition(() => {
      void apiFetchWithToken(
        mode === "create" ? "/api/admin/contract-templates" : `/api/admin/contract-templates/${templateId}`,
        token,
        {
          method: mode === "create" ? "POST" : "PUT",
          body: JSON.stringify(payload),
        },
      )
        .then(() => {
          setMessage(mode === "create" ? "Contract template created." : "Contract template updated.");
          router.push("/admin/contract-templates");
          router.refresh();
        })
        .catch((submitError) => {
          setError(submitError instanceof Error ? submitError.message : "Unable to save contract template.");
        });
    });
  }

  if (mode === "edit" && !template && !error) {
    return (
      <Card>
        <p className="text-sm text-slate-500">Loading contract template...</p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-xl font-semibold">{mode === "create" ? "Create contract template" : "Edit contract template"}</h2>
      <p className="mt-2 text-sm text-slate-500">
        {mode === "create"
          ? "Create a reusable contract template with a version and placeholder-ready body."
          : "Update the template details, body, or active state, then save the changes."}
      </p>

      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}

      <form action={handleSubmit} className="mt-6 grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={template?.name ?? ""} name="name" placeholder="Template name" />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={template?.version ?? ""} name="version" placeholder="Version" />
        </div>
        <textarea
          className="min-h-72 rounded-2xl border border-slate-200 px-4 py-3"
          defaultValue={template?.body ?? ""}
          name="body"
          placeholder="Template body with placeholders"
        />
        <label className="flex items-center gap-3 text-sm text-slate-600">
          <input className="h-4 w-4" defaultChecked={template?.isActive ?? true} name="isActive" type="checkbox" />
          Active template
        </label>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-2xl bg-accent px-4 py-3 font-semibold text-white" disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </button>
          <button className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold" onClick={() => router.push("/admin/contract-templates")} type="button">
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}
