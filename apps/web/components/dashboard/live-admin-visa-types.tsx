"use client";

import { useEffect, useState, useTransition } from "react";
import { apiFetchWithToken } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";
import { Card } from "../ui/card";

type VisaTypeRecord = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  requiredDocumentMappings: Array<{ id: string }>;
};

export function LiveAdminVisaTypes() {
  const [visaTypes, setVisaTypes] = useState<VisaTypeRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function load() {
    const token = getAccessToken();
    if (!token) return;

    const data = await apiFetchWithToken<VisaTypeRecord[]>("/api/visa-types", token);
    setVisaTypes(data);
  }

  useEffect(() => {
    void load().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Unable to load visa types.");
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
      void apiFetchWithToken("/api/visa-types", token, {
        method: "POST",
        body: JSON.stringify({
          code: String(formData.get("code") ?? ""),
          name: String(formData.get("name") ?? ""),
          description: String(formData.get("description") ?? ""),
          isActive: formData.get("isActive") === "on",
        }),
      })
        .then(async () => {
          setMessage("Visa type created.");
          await load();
        })
        .catch((createError) => {
          setError(createError instanceof Error ? createError.message : "Unable to create visa type.");
        });
    });
  }

  function handleUpdate(visaTypeId: string, formData: FormData) {
    const token = getAccessToken();
    if (!token) return;
    clearFeedback();

    startTransition(() => {
      void apiFetchWithToken(`/api/visa-types/${visaTypeId}`, token, {
        method: "PUT",
        body: JSON.stringify({
          code: String(formData.get("code") ?? ""),
          name: String(formData.get("name") ?? ""),
          description: String(formData.get("description") ?? ""),
          isActive: formData.get("isActive") === "on",
        }),
      })
        .then(async () => {
          setMessage("Visa type updated.");
          await load();
        })
        .catch((updateError) => {
          setError(updateError instanceof Error ? updateError.message : "Unable to update visa type.");
        });
    });
  }

  function handleDelete(visaTypeId: string) {
    const token = getAccessToken();
    if (!token) return;
    clearFeedback();

    startTransition(() => {
      void apiFetchWithToken(`/api/visa-types/${visaTypeId}`, token, {
        method: "DELETE",
      })
        .then(async () => {
          setMessage("Visa type deleted.");
          await load();
        })
        .catch((deleteError) => {
          setError(deleteError instanceof Error ? deleteError.message : "Unable to delete visa type.");
        });
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-semibold">Create visa type</h2>
        <form action={handleCreate} className="mt-6 grid gap-4 md:grid-cols-2">
          <input className="rounded-2xl border border-slate-200 px-4 py-3" name="code" placeholder="Code" />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" name="name" placeholder="Name" />
          <textarea className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" name="description" placeholder="Description" />
          <label className="flex items-center gap-3 text-sm text-slate-600">
            <input defaultChecked className="h-4 w-4" name="isActive" type="checkbox" />
            Active
          </label>
          <button className="rounded-2xl bg-accent px-4 py-3 font-semibold text-white md:justify-self-end" disabled={isPending}>
            {isPending ? "Saving..." : "Create visa type"}
          </button>
        </form>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold">Configured visa types</h2>
        {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
        <div className="mt-6 space-y-4">
          {visaTypes.map((item) => (
            <form key={item.id} action={(formData) => handleUpdate(item.id, formData)} className="rounded-3xl border border-slate-200 px-5 py-4 text-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={item.code} name="code" />
                <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={item.name} name="name" />
                <textarea
                  className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2"
                  defaultValue={item.description ?? ""}
                  name="description"
                />
                <label className="flex items-center gap-3 text-slate-600">
                  <input className="h-4 w-4" defaultChecked={item.isActive} name="isActive" type="checkbox" />
                  Active
                </label>
                <p className="text-slate-500 md:text-right">{item.requiredDocumentMappings.length} checklist rule(s)</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button className="rounded-2xl bg-accent px-4 py-3 font-semibold text-white" disabled={isPending}>
                  Save changes
                </button>
                <button
                  className="rounded-2xl border border-rose-200 px-4 py-3 font-semibold text-rose-700"
                  disabled={isPending}
                  onClick={() => handleDelete(item.id)}
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
