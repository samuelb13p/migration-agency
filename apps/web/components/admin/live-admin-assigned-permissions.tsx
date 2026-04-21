"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { apiFetchWithToken } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";
import { Card } from "../ui/card";

type RoleRecord = {
  id: string;
  name: string;
  description?: string | null;
  rolePermissions: Array<{ permissionId?: string; permission: { id: string; name: string } }>;
};

type PermissionRecord = {
  id: string;
  name: string;
  description?: string | null;
};

export function LiveAdminAssignedPermissions() {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function load() {
    const token = getAccessToken();
    if (!token) return;

    const [roleData, permissionData] = await Promise.all([
      apiFetchWithToken<RoleRecord[]>("/api/admin/roles", token),
      apiFetchWithToken<PermissionRecord[]>("/api/admin/permissions", token),
    ]);

    setRoles(roleData);
    setPermissions(permissionData);
    if (!selectedRoleId && roleData[0]) {
      setSelectedRoleId(roleData[0].id);
      setSelectedPermissionIds(roleData[0].rolePermissions.map((item) => item.permission.id));
    }
  }

  useEffect(() => {
    void load().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Unable to load roles and permissions.");
    });
  }, []);

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );

  useEffect(() => {
    if (selectedRole) {
      setSelectedPermissionIds(selectedRole.rolePermissions.map((item) => item.permission.id));
    }
  }, [selectedRole]);

  function togglePermission(permissionId: string) {
    setSelectedPermissionIds((current) =>
      current.includes(permissionId) ? current.filter((item) => item !== permissionId) : [...current, permissionId],
    );
  }

  function handleSave() {
    const token = getAccessToken();
    if (!token || !selectedRoleId) return;

    setError(null);
    setMessage(null);

    startTransition(() => {
      void apiFetchWithToken(`/api/admin/roles/${selectedRoleId}/permissions`, token, {
        method: "PUT",
        body: JSON.stringify({ permissionIds: selectedPermissionIds }),
      })
        .then(async () => {
          setMessage("Assigned permissions updated.");
          await load();
        })
        .catch((saveError) => {
          setError(saveError instanceof Error ? saveError.message : "Unable to update assigned permissions.");
        });
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Assigned permissions</h2>
            <p className="mt-1 text-sm text-slate-500">Select a role, then assign or remove permissions for that role.</p>
          </div>
          <select
            className="rounded-2xl border border-slate-200 px-4 py-3 capitalize"
            onChange={(event) => setSelectedRoleId(event.target.value)}
            value={selectedRoleId}
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
        {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {permissions.map((permission) => (
            <label key={permission.id} className="flex items-start gap-3 rounded-3xl border border-slate-200 px-5 py-4 text-sm">
              <input
                checked={selectedPermissionIds.includes(permission.id)}
                className="mt-1 h-4 w-4"
                onChange={() => togglePermission(permission.id)}
                type="checkbox"
              />
              <div>
                <p className="font-medium">{permission.name}</p>
                <p className="mt-1 text-slate-500">{permission.description ?? "No description provided."}</p>
              </div>
            </label>
          ))}
        </div>
        <div className="mt-6">
          <button className="rounded-2xl bg-accent px-4 py-3 font-semibold text-white" disabled={isPending || !selectedRoleId} onClick={handleSave} type="button">
            {isPending ? "Saving..." : "Save assigned permissions"}
          </button>
        </div>
      </Card>
    </div>
  );
}
