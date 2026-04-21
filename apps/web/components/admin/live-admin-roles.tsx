"use client";

import { useEffect, useState } from "react";
import { apiFetchWithToken } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";
import { Card } from "../ui/card";

type RoleRecord = {
  id: string;
  name: string;
  description?: string | null;
  rolePermissions: Array<{ permission: { id: string; name: string } }>;
};

export function LiveAdminRoles() {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    void apiFetchWithToken<RoleRecord[]>("/api/admin/roles", token)
      .then(setRoles)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load roles.");
      });
  }, []);

  return (
    <Card>
      <h2 className="text-xl font-semibold">Roles</h2>
      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      <div className="mt-6 space-y-3">
        {roles.map((role) => (
          <div key={role.id} className="rounded-3xl border border-slate-200 px-5 py-4 text-sm">
            <p className="font-medium capitalize">{role.name}</p>
            <p className="mt-2 text-slate-600">{role.description ?? "No description provided."}</p>
            <p className="mt-2 text-slate-500">{role.rolePermissions.length} permission(s) assigned</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
