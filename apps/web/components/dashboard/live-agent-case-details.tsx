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
  visaType: { name: string };
  customerProfile: { firstName: string; lastName: string };
};

type ChecklistResponse = {
  missingRequiredDocumentIds: string[];
  items: Array<{ requiredDocumentId: string; name: string; status: string }>;
};

type UploadRecord = {
  id: string;
  status: string;
  versionNumber: number;
  documentType: { name: string };
};

export function LiveAgentCaseDetails({ caseId }: { caseId: string }) {
  const [record, setRecord] = useState<VisaCaseRecord | null>(null);
  const [checklist, setChecklist] = useState<ChecklistResponse | null>(null);
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    const accessToken = token;

    async function load() {
      try {
        const [visaCase, checklistData, uploadRecords] = await Promise.all([
          apiFetchWithToken<VisaCaseRecord>(`/api/visa-cases/${caseId}`, accessToken),
          apiFetchWithToken<ChecklistResponse>(`/api/visa-cases/${caseId}/checklist`, accessToken),
          apiFetchWithToken<UploadRecord[]>(`/api/visa-cases/${caseId}/uploads`, accessToken),
        ]);

        setRecord(visaCase);
        setChecklist(checklistData);
        setUploads(uploadRecords);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load assigned visa case.");
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

  if (!record || !checklist) {
    return (
      <Card>
        <p className="text-sm text-slate-500">Loading assigned visa case...</p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-xl font-semibold">{record.visaType.name}</h2>
      <p className="mt-3 text-sm text-slate-600">
        Customer: {record.customerProfile.firstName} {record.customerProfile.lastName}
      </p>
      <p className="mt-1 text-sm text-slate-600">Case number: {record.caseNumber}</p>
      <p className="mt-1 text-sm text-slate-600">Completeness: {record.completenessPercent}%</p>
      <p className="mt-1 text-sm text-slate-600">
        Missing items:{" "}
        {checklist.missingRequiredDocumentIds.length === 0
          ? "None"
          : checklist.items.filter((item) => item.status === "missing").map((item) => item.name).join(", ")}
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {uploads.map((upload) => (
          <Badge key={upload.id} tone={upload.status === "approved" ? "success" : upload.status === "pending" ? "warning" : "neutral"}>
            {upload.documentType.name} v{upload.versionNumber} · {upload.status.replaceAll("_", " ")}
          </Badge>
        ))}
      </div>
      <div className="mt-6">
        <Link href={`/agent/cases/${caseId}/review`} className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white">
          Open review workspace
        </Link>
      </div>
    </Card>
  );
}
