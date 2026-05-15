"use client";

import { useEffect, useMemo, useState } from "react";
import { OverviewCards } from "./overview-cards";
import { ChecklistTable } from "./checklist-table";
import { Card } from "../ui/card";
import { apiFetchWithToken } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";

type CaseRecord = {
  id: string;
  status: string;
  caseNumber: string;
  visaType: { name: string };
  agentProfile?: { firstName: string; lastName: string } | null;
};

type ChecklistRecord = {
  requiredDocumentId: string;
  name: string;
  status: string;
};

type ChecklistResponse = {
  completenessPercent: number;
  items: ChecklistRecord[];
};

function formatStatusLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function LiveDashboard() {
  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [completenessPercent, setCompletenessPercent] = useState(0);
  const [checklist, setChecklist] = useState<Array<{ id: string; name: string; status: string; reviewStatus: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    const accessToken = token;

    async function load() {
      try {
        const cases = await apiFetchWithToken<CaseRecord[]>("/api/visa-cases", accessToken);
        const firstCase = cases[0];
        if (!firstCase) {
          setCaseRecord(null);
          setChecklist([]);
          setCompletenessPercent(0);
          return;
        }

        setCaseRecord(firstCase);
        const checklistData = await apiFetchWithToken<ChecklistResponse>(`/api/visa-cases/${firstCase.id}/checklist`, accessToken);
        setCompletenessPercent(checklistData.completenessPercent);

        setChecklist(
          checklistData.items.map((item) => ({
            id: item.requiredDocumentId,
            name: item.name,
            status: item.status,
            reviewStatus: item.status,
          })),
        );
        setError(null);
      } catch (loadError) {
        setCaseRecord(null);
        setChecklist([]);
        setCompletenessPercent(0);
        setError(loadError instanceof Error ? loadError.message : "Unable to load the customer dashboard.");
      }
    }

    void load();
    const intervalId = window.setInterval(() => {
      void load();
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, []);

  const assignedAgentName = useMemo(() => {
    if (!caseRecord?.agentProfile) return "Unassigned";
    return `${caseRecord.agentProfile.firstName} ${caseRecord.agentProfile.lastName}`;
  }, [caseRecord]);

  if (error && !caseRecord) {
    return (
      <Card>
        <p className="text-sm text-rose-600">{error}</p>
      </Card>
    );
  }

  if (!caseRecord) {
    return (
      <Card>
        <p className="text-sm text-slate-500">No visa case is available yet for this customer.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <OverviewCards
        items={[
          { label: "Visa case status", value: formatStatusLabel(caseRecord.status), helper: "Automatically updated from uploads and agent reviews." },
          { label: "Completeness", value: `${completenessPercent}%`, helper: "Real-time required-document progress against the visa rules." },
          {
            label: "Assigned agent",
            value: assignedAgentName,
            helper: "Primary contact responsible for document review.",
          },
        ]}
      />
      <Card>
        <h2 className="text-xl font-semibold">Current visa case</h2>
        <p className="mt-3 text-sm text-slate-600">
          Case number: <span className="font-medium">{caseRecord.caseNumber}</span>
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Visa type: <span className="font-medium">{caseRecord.visaType.name}</span>
        </p>
        <div className="mt-5 h-3 rounded-full bg-slate-100">
          <div className="h-3 rounded-full bg-accent" style={{ width: `${completenessPercent}%` }} />
        </div>
      </Card>
      <ChecklistTable caseId={caseRecord.id} items={checklist} />
    </div>
  );
}
