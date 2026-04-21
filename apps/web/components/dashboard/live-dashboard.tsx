"use client";

import { useEffect, useState } from "react";
import { OverviewCards } from "./overview-cards";
import { ChecklistTable } from "./checklist-table";
import { Card } from "../ui/card";
import { apiFetchWithToken } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";
import { sampleCase, sampleChecklist } from "../../lib/sample-data";

type CaseRecord = {
  id: string;
  status: string;
  completenessPercent: number;
  visaType: { name: string };
  assignedAgent?: { profile?: { fullName?: string } | null } | null;
};

type ChecklistRecord = {
  requiredDocumentId: string;
  name: string;
  status: string;
};

export function LiveDashboard() {
  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [checklist, setChecklist] = useState<Array<{ id: string; name: string; status: string; reviewStatus: string }>>([]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    const accessToken = token;

    async function load() {
      try {
        const cases = await apiFetchWithToken<CaseRecord[]>("/api/visa-cases", accessToken);
        const firstCase = cases[0];
        if (!firstCase) return;

        setCaseRecord(firstCase);
        const checklistData = await apiFetchWithToken<{
          items: ChecklistRecord[];
        }>(`/api/visa-cases/${firstCase.id}/checklist`, accessToken);

        setChecklist(
          checklistData.items.map((item) => ({
            id: item.requiredDocumentId,
            name: item.name,
            status: item.status,
            reviewStatus: item.status === "uploaded" ? "pending" : "pending",
          })),
        );
      } catch {
        setCaseRecord(null);
        setChecklist([]);
      }
    }

    void load();
  }, []);

  const activeCase = caseRecord ?? sampleCase;
  const activeChecklist = checklist.length > 0 ? checklist : sampleChecklist;

  return (
    <div className="space-y-6">
      <OverviewCards
        items={[
          { label: "Visa case status", value: activeCase.status.replaceAll("_", " "), helper: "Automatically updated from checklist and reviews." },
          { label: "Completeness", value: `${activeCase.completenessPercent}%`, helper: "Required-document progress against visa rules." },
          {
            label: "Assigned agent",
            value: activeCase.assignedAgent?.profile?.fullName ?? sampleCase.assignedAgent.profile.fullName,
            helper: "Primary contact for document review.",
          },
        ]}
      />
      <Card>
        <h2 className="text-xl font-semibold">Current visa case</h2>
        <p className="mt-3 text-sm text-slate-600">
          Visa type: <span className="font-medium">{activeCase.visaType.name}</span>
        </p>
        <div className="mt-5 h-3 rounded-full bg-slate-100">
          <div className="h-3 rounded-full bg-accent" style={{ width: `${activeCase.completenessPercent}%` }} />
        </div>
      </Card>
      <ChecklistTable items={activeChecklist} />
    </div>
  );
}
