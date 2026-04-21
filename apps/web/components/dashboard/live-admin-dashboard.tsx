"use client";

import { useEffect, useState } from "react";
import { apiFetchWithToken } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";
import { OverviewCards } from "./overview-cards";
import { Card } from "../ui/card";

type AdminUserRecord = { id: string };
type VisaTypeRecord = { id: string };
type VisaCaseRecord = { id: string };
type UploadRecord = { status: string };

export function LiveAdminDashboard() {
  const [summary, setSummary] = useState({ users: 0, visaTypes: 0, pendingReviews: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    const accessToken = token;

    async function load() {
      try {
        const [users, visaTypes, visaCases] = await Promise.all([
          apiFetchWithToken<AdminUserRecord[]>("/api/admin/users", accessToken),
          apiFetchWithToken<VisaTypeRecord[]>("/api/visa-types", accessToken),
          apiFetchWithToken<VisaCaseRecord[]>("/api/visa-cases", accessToken),
        ]);

        const uploadsPerCase = await Promise.all(
          visaCases.map((visaCase) => apiFetchWithToken<UploadRecord[]>(`/api/visa-cases/${visaCase.id}/uploads`, accessToken)),
        );

        setSummary({
          users: users.length,
          visaTypes: visaTypes.length,
          pendingReviews: uploadsPerCase.flat().filter((upload) => upload.status === "pending").length,
        });
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load admin dashboard.");
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
    <OverviewCards
      items={[
        { label: "Users", value: String(summary.users), helper: "Customers, agents, and admins across the system." },
        { label: "Visa types", value: String(summary.visaTypes), helper: "Active visa configurations available for case creation." },
        { label: "Pending reviews", value: String(summary.pendingReviews), helper: "Uploads still waiting for agent action." },
      ]}
    />
  );
}
