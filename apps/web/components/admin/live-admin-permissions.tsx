"use client";

import { useEffect, useState } from "react";
import { apiFetchWithToken } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";
import { Card } from "../ui/card";

type PermissionRecord = {
  id: string;
  name: string;
  description?: string | null;
};

export function LiveAdminPermissions() {
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    void apiFetchWithToken<PermissionRecord[]>("/api/admin/permissions", token)
      .then(setPermissions)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load permissions.");
      });
  }, []);

  return (
    <Card>
      <h2 className="text-xl font-semibold">Permissions</h2>
      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      <div className="mt-6 space-y-3">
        {permissions.map((permission) => (
          <div key={permission.id} className="rounded-3xl border border-slate-200 px-5 py-4 text-sm">
            <p className="font-medium">{permission.name}</p>
            <p className="mt-2 text-slate-600">{permission.description ?? "No description provided."}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
