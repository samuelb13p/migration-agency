"use client";

import { useEffect, useState } from "react";
import { apiFetchWithToken } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";
import { Card } from "../ui/card";

type AdminUserRecord = {
  id: string;
  role: { name: string };
};

export function LiveAdminAccess() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    const accessToken = token;

    async function load() {
      try {
        const users = await apiFetchWithToken<AdminUserRecord[]>("/api/admin/users", accessToken);
        const nextCounts = users.reduce<Record<string, number>>((accumulator, user) => {
          accumulator[user.role.name] = (accumulator[user.role.name] ?? 0) + 1;
          return accumulator;
        }, {});
        setCounts(nextCounts);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load access overview.");
      }
    }

    void load();
  }, []);

  return (
    <Card>
      <h2 className="text-xl font-semibold">Role matrix</h2>
      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 px-5 py-4 text-sm">
          Customer: own visa case, own uploads, own notifications
          <p className="mt-2 text-slate-500">{counts.customer ?? 0} active user(s)</p>
        </div>
        <div className="rounded-3xl border border-slate-200 px-5 py-4 text-sm">
          Agent: assigned visa cases, reviews, notifications
          <p className="mt-2 text-slate-500">{counts.agent ?? 0} active user(s)</p>
        </div>
        <div className="rounded-3xl border border-slate-200 px-5 py-4 text-sm">
          Admin: users, roles, visa rules, platform oversight
          <p className="mt-2 text-slate-500">{counts.admin ?? 0} active user(s)</p>
        </div>
      </div>
    </Card>
  );
}
