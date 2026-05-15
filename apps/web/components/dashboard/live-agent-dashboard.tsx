"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetchWithToken } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";
import { OverviewCards } from "./overview-cards";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";

type VisaCaseRecord = {
  id: string;
  caseNumber: string;
  status: string;
  visaType: { name: string };
  customerProfile: { firstName: string; lastName: string };
};

type UploadRecord = { status: string };

type ChecklistRecord = {
  completenessPercent: number;
};

type DecoratedVisaCaseRecord = VisaCaseRecord & {
  completenessPercent: number;
  docsNeedingReview: number;
};

function formatStatusLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function toneForCaseStatus(status: string) {
  if (status === "approved" || status === "completed") return "success" as const;
  if (status === "waiting_documents" || status === "draft") return "warning" as const;
  if (status === "rejected") return "danger" as const;
  return "neutral" as const;
}

export function LiveAgentDashboard() {
  const [cases, setCases] = useState<DecoratedVisaCaseRecord[]>([]);
  const [queueFilter, setQueueFilter] = useState<"all" | "need_review" | "action_required">("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    const accessToken = token;

    async function load() {
      try {
        const visaCases = await apiFetchWithToken<VisaCaseRecord[]>("/api/visa-cases", accessToken);

        const decoratedCases = await Promise.all(
          visaCases.map(async (visaCase) => {
            const [checklist, uploads] = await Promise.all([
              apiFetchWithToken<ChecklistRecord>(`/api/visa-cases/${visaCase.id}/checklist`, accessToken),
              apiFetchWithToken<UploadRecord[]>(`/api/visa-cases/${visaCase.id}/uploads`, accessToken),
            ]);

            return {
              ...visaCase,
              completenessPercent: checklist.completenessPercent,
              docsNeedingReview: uploads.filter((upload) => upload.status === "pending").length,
            };
          }),
        );

        setCases(decoratedCases);
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load agent dashboard.");
      }
    }

    void load();
  }, []);

  const pendingUploads = useMemo(
    () => cases.reduce((total, item) => total + item.docsNeedingReview, 0),
    [cases],
  );

  const actionRequiredCases = useMemo(
    () => cases.filter((item) => item.status === "waiting_documents").length,
    [cases],
  );

  const availableStatuses = useMemo(
    () => Array.from(new Set(cases.map((item) => item.status))).sort(),
    [cases],
  );

  const filteredCases = useMemo(() => {
    const queueFilteredCases =
      queueFilter === "need_review"
        ? cases.filter((item) => item.docsNeedingReview > 0)
        : queueFilter === "action_required"
          ? cases.filter((item) => item.status === "waiting_documents")
          : cases;

    return statusFilter === "all"
      ? queueFilteredCases
      : queueFilteredCases.filter((item) => item.status === statusFilter);
  }, [cases, queueFilter, statusFilter]);

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
          {
            label: "Assigned visa cases",
            value: String(cases.length),
            helper: "Visa cases currently assigned to you.",
            onClick: () => setQueueFilter("all"),
            active: queueFilter === "all",
          },
          {
            label: "Need review",
            value: String(pendingUploads),
            helper: "Documents currently waiting for an agent decision.",
            onClick: () => setQueueFilter("need_review"),
            active: queueFilter === "need_review",
          },
          {
            label: "Action required",
            value: String(actionRequiredCases),
            helper: "Visa cases currently back with the customer for more documents.",
            onClick: () => setQueueFilter("action_required"),
            active: queueFilter === "action_required",
          },
        ]}
      />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Review queue</h2>
          <Link href="/agent/visa-cases/create" className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white">
            Create visa case
          </Link>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-slate-600" htmlFor="agent-status-filter">
            Filter by status
          </label>
          <select
            id="agent-status-filter"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
            onChange={(event) => setStatusFilter(event.target.value)}
            value={statusFilter}
          >
            <option value="all">All statuses</option>
            {availableStatuses.map((status) => (
              <option key={status} value={status}>
                {formatStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-6 space-y-4">
          {cases.length === 0 ? <p className="text-sm text-slate-500">No visa cases are currently assigned to this agent.</p> : null}
          {cases.length > 0 && filteredCases.length === 0 ? (
            <p className="text-sm text-slate-500">No visa cases match the selected status.</p>
          ) : null}
          {filteredCases.map((item) => (
            <Link
              key={item.id}
              href={`/agent/cases/${item.id}/review`}
              className="block rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5 transition hover:border-accent hover:bg-slate-100"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xl font-semibold text-ink">
                    {item.customerProfile.firstName} {item.customerProfile.lastName}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {item.caseNumber} · {item.visaType.name}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={toneForCaseStatus(item.status)}>{formatStatusLabel(item.status)}</Badge>
                  {item.docsNeedingReview > 0 ? (
                    <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-white">
                      {item.docsNeedingReview} Review
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Visa Case Status</p>
                  <p className="mt-2 font-semibold text-slate-800">{formatStatusLabel(item.status)}</p>
                </div>
                <div className="rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Completeness</p>
                    <p className="font-semibold text-slate-800">{item.completenessPercent}%</p>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-accent" style={{ width: `${item.completenessPercent}%` }} />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Documents Needing Review</p>
                  <p className="mt-2 font-semibold text-slate-800">{item.docsNeedingReview}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
