"use client";

import { useEffect, useState } from "react";
import { apiFetchWithToken } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";
import { ChecklistTable } from "./checklist-table";
import { Card } from "../ui/card";

type ChecklistItemRecord = {
  requiredDocumentId: string;
  name: string;
  status: string;
};

type ChecklistResponse = {
  completenessPercent: number;
  missingRequiredDocumentIds: string[];
  items: ChecklistItemRecord[];
};

export function LiveVisaCaseChecklist({ caseId }: { caseId: string }) {
  const [record, setRecord] = useState<ChecklistResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    const accessToken = token;

    async function load() {
      try {
        const data = await apiFetchWithToken<ChecklistResponse>(`/api/visa-cases/${caseId}/checklist`, accessToken);
        setRecord(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load checklist.");
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
        <p className="text-sm text-slate-500">Loading checklist...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-semibold">Completeness overview</h2>
        <p className="mt-3 text-sm text-slate-600">
          {record.completenessPercent}% complete with {record.missingRequiredDocumentIds.length} missing required item(s).
        </p>
      </Card>
      <ChecklistTable
        items={record.items.map((item) => ({
          id: item.requiredDocumentId,
          name: item.name,
          status: item.status,
          reviewStatus: item.status === "present" ? "pending" : item.status,
        }))}
      />
    </div>
  );
}
