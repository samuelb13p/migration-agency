"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetchWithToken } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";
import { OverviewCards } from "./overview-cards";
import { Card } from "../ui/card";

type VisaCaseRecord = {
  id: string;
  caseNumber: string;
  status: string;
  completenessPercent: number;
  visaType: { name: string };
  customerProfile: { firstName: string; lastName: string };
};

type UploadRecord = { status: string };

export function LiveAgentDashboard() {
  const [cases, setCases] = useState<VisaCaseRecord[]>([]);
  const [pendingUploads, setPendingUploads] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    const accessToken = token;

    async function load() {
      try {
        const visaCases = await apiFetchWithToken<VisaCaseRecord[]>("/api/visa-cases", accessToken);
        setCases(visaCases);

        const uploadsPerCase = await Promise.all(
          visaCases.map((visaCase) => apiFetchWithToken<UploadRecord[]>(`/api/visa-cases/${visaCase.id}/uploads`, accessToken)),
        );

        setPendingUploads(
          uploadsPerCase.flat().filter((upload) => upload.status === "pending" || upload.status === "reupload_requested").length,
        );
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load agent dashboard.");
      }
    }

    void load();
  }, []);

  if (error) {
    return (
      <Card>
        <p className="text-sm text-rose-600">{error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <OverviewCards
        items={[
          { label: "Assigned visa cases", value: String(cases.length), helper: "Visa cases currently assigned to you." },
          { label: "Need review", value: String(pendingUploads), helper: "Uploads currently waiting for an agent decision." },
          {
            label: "Action required",
            value: String(cases.filter((item) => item.status === "rejected").length),
            helper: "Visa cases blocked by rejected or re-upload work.",
          },
        ]}
      />
      <Card>
        <h2 className="text-xl font-semibold">Review queue</h2>
        <div className="mt-6 space-y-3">
          {cases.length === 0 ? <p className="text-sm text-slate-500">No visa cases are currently assigned to this agent.</p> : null}
          {cases.map((item) => (
            <Link
              key={item.id}
              href={`/agent/cases/${item.id}`}
              className="block rounded-3xl border border-slate-200 px-5 py-4 text-sm transition hover:border-accent hover:bg-slate-50"
            >
              <p className="font-medium">
                {item.caseNumber} · {item.visaType.name}
              </p>
              <p className="mt-2 text-slate-600">
                {item.customerProfile.firstName} {item.customerProfile.lastName}
              </p>
              <p className="mt-1 text-slate-500">
                Status: {item.status.replaceAll("_", " ")} · Completeness: {item.completenessPercent}%
              </p>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
