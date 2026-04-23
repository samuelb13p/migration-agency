"use client";

import Link from "next/link";
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

  function handleDelete(visaTypeId: string) {
    const token = getAccessToken();
    if (!token) return;
    setError(null);
    setMessage(null);

    startTransition(() => {
      void apiFetchWithToken(`/api/visa-types/${visaTypeId}`, token, { method: "DELETE" })
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
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Visa types</h2>
          <p className="mt-1 text-sm text-slate-500">See every visa type, then open a dedicated edit view or delete the record.</p>
        </div>
        <Link href="/admin/visa-types/create" className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white">
          Create visa type
        </Link>
      </div>
      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-3 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-4 py-2 font-medium">Visa type</th>
              <th className="px-4 py-2 font-medium">Code</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Required docs</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visaTypes.map((visaType) => (
              <tr key={visaType.id}>
                <td className="rounded-l-3xl border-y border-l border-slate-200 px-4 py-4">
                  <p className="font-medium">{visaType.name}</p>
                  <p className="mt-1 text-slate-500">{visaType.description ?? "No description provided."}</p>
                </td>
                <td className="border-y border-slate-200 px-4 py-4">{visaType.code}</td>
                <td className="border-y border-slate-200 px-4 py-4">{visaType.isActive ? "Active" : "Inactive"}</td>
                <td className="border-y border-slate-200 px-4 py-4">{visaType.requiredDocumentMappings.length}</td>
                <td className="rounded-r-3xl border-y border-r border-slate-200 px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/visa-types/${visaType.id}`} className="rounded-2xl border border-slate-200 px-3 py-2 font-semibold">
                      Edit
                    </Link>
                    <button className="rounded-2xl border border-rose-200 px-3 py-2 font-semibold text-rose-700" disabled={isPending} onClick={() => handleDelete(visaType.id)} type="button">
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
