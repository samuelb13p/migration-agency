"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetchWithToken } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";

type VisaCaseRecord = {
  id: string;
  caseNumber: string;
  status: string;
  completenessPercent: number;
  visaType: { id: string; name: string; code: string };
  customerProfile: { firstName: string; lastName: string };
  agentProfile?: { firstName: string; lastName: string } | null;
};

function toneForStatus(status: string) {
  if (status === "completed" || status === "approved") return "success" as const;
  if (status === "rejected") return "danger" as const;
  if (status === "under_review" || status === "documents_uploaded") return "warning" as const;
  return "neutral" as const;
}

export function LiveVisaCaseDetails({ caseId, basePath }: { caseId: string; basePath: string }) {
  const [record, setRecord] = useState<VisaCaseRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    const accessToken = token;

    async function load() {
      try {
        const data = await apiFetchWithToken<VisaCaseRecord>(`/api/visa-cases/${caseId}`, accessToken);
        setRecord(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load visa case.");
      }
    }

    void load();
  }, [caseId]);

  if (error) {
    return (
      <Card>
        <p className="text-sm text-rose-600">{error}</p>
      </Card>
    );
  }

  if (!record) {
    return (
      <Card>
        <p className="text-sm text-slate-500">Loading visa case details...</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{record.caseNumber}</p>
          <h2 className="mt-3 text-xl font-semibold">{record.visaType.name}</h2>
          <p className="mt-2 text-sm text-slate-600">Visa code: {record.visaType.code}</p>
        </div>
        <Badge tone={toneForStatus(record.status)}>{record.status.replaceAll("_", " ")}</Badge>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 px-5 py-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Customer</p>
          <p className="mt-3 font-medium">
            {record.customerProfile.firstName} {record.customerProfile.lastName}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 px-5 py-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Assigned agent</p>
          <p className="mt-3 font-medium">
            {record.agentProfile ? `${record.agentProfile.firstName} ${record.agentProfile.lastName}` : "Unassigned"}
          </p>
        </div>
      </div>
      <div className="mt-6">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Completeness</span>
          <span>{record.completenessPercent}%</span>
        </div>
        <div className="mt-3 h-3 rounded-full bg-slate-100">
          <div className="h-3 rounded-full bg-accent" style={{ width: `${record.completenessPercent}%` }} />
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`${basePath}/${caseId}/checklist`} className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white">
          View checklist
        </Link>
        <Link href={`${basePath}/${caseId}/uploads`} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold">
          View uploads
        </Link>
      </div>
    </Card>
  );
}
