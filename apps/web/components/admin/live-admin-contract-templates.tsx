"use client";

import Link from "next/link";
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

  function handleDelete(templateId: string) {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    setMessage(null);

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
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Contract templates</h2>
          <p className="mt-1 text-sm text-slate-500">See the full list of templates, then edit or delete each one.</p>
        </div>
        <Link href="/admin/contract-templates/create" className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white">
          Create template
        </Link>
      </div>
      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-3 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-4 py-2 font-medium">Template</th>
              <th className="px-4 py-2 font-medium">Version</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((template) => (
              <tr key={template.id}>
                <td className="rounded-l-3xl border-y border-l border-slate-200 px-4 py-4">
                  <p className="font-medium">{template.name}</p>
                  <p className="mt-1 text-slate-500">
                    {template.body.slice(0, 80)}
                    {template.body.length > 80 ? "..." : ""}
                  </p>
                </td>
                <td className="border-y border-slate-200 px-4 py-4">{template.version}</td>
                <td className="border-y border-slate-200 px-4 py-4">{template.isActive ? "Active" : "Inactive"}</td>
                <td className="rounded-r-3xl border-y border-r border-slate-200 px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/contract-templates/${template.id}`} className="rounded-2xl border border-slate-200 px-3 py-2 font-semibold">
                      Edit
                    </Link>
                    <button className="rounded-2xl border border-rose-200 px-3 py-2 font-semibold text-rose-700" disabled={isPending} onClick={() => handleDelete(template.id)} type="button">
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
