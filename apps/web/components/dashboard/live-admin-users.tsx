"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { apiFetchWithToken } from "../../lib/api";
import { getAccessToken, getSessionUser } from "../../lib/auth";
import { Card } from "../ui/card";

type AdminUserRecord = {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  role: { name: string };
  customerProfile?: { firstName: string; lastName: string } | null;
  agentProfile?: { firstName: string; lastName: string } | null;
  adminProfile?: { firstName: string; lastName: string } | null;
};

function getDisplayName(user: AdminUserRecord) {
  const profile = user.customerProfile ?? user.agentProfile ?? user.adminProfile;
  return profile ? `${profile.firstName} ${profile.lastName}` : "No profile";
}

export function LiveAdminUsers() {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const currentUser = getSessionUser();

  async function load() {
    const token = getAccessToken();
    if (!token) return;

    const data = await apiFetchWithToken<AdminUserRecord[]>("/api/admin/users", token);
    setUsers(data);
  }

  useEffect(() => {
    void load().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Unable to load users.");
    });
  }, []);

  function clearFeedback() {
    setError(null);
    setMessage(null);
  }

  function handleStatusChange(userId: string, isActive: boolean) {
    const token = getAccessToken();
    if (!token) return;
    clearFeedback();

    startTransition(() => {
      void apiFetchWithToken(`/api/admin/users/${userId}/status`, token, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      })
        .then(async () => {
          setMessage(isActive ? "User activated." : "User deactivated.");
          await load();
        })
        .catch((updateError) => {
          setError(updateError instanceof Error ? updateError.message : "Unable to update user status.");
        });
    });
  }

  function handleDelete(userId: string) {
    const token = getAccessToken();
    if (!token) return;
    clearFeedback();

    startTransition(() => {
      void apiFetchWithToken(`/api/admin/users/${userId}`, token, {
        method: "DELETE",
      })
        .then(async () => {
          setMessage("User deleted.");
          await load();
        })
        .catch((deleteError) => {
          setError(deleteError instanceof Error ? deleteError.message : "Unable to delete user.");
        });
    });
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Users</h2>
          <p className="mt-1 text-sm text-slate-500">Create, edit, deactivate, and delete users from one admin list.</p>
        </div>
        <Link href="/admin/users/create" className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white">
          Create user
        </Link>
      </div>

      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-3 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-4 py-2 font-medium">User</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Created</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="rounded-3xl border border-slate-200 bg-white align-top">
                <td className="rounded-l-3xl border-y border-l border-slate-200 px-4 py-4">
                  <p className="font-medium">{getDisplayName(user)}</p>
                  <p className="mt-1 text-slate-500">{user.email}</p>
                </td>
                <td className="border-y border-slate-200 px-4 py-4 capitalize">{user.role.name}</td>
                <td className="border-y border-slate-200 px-4 py-4">{user.isActive ? "Active" : "Inactive"}</td>
                <td className="border-y border-slate-200 px-4 py-4 text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="rounded-r-3xl border-y border-r border-slate-200 px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/users/${user.id}`} className="rounded-2xl border border-slate-200 px-3 py-2 font-semibold">
                      Edit
                    </Link>
                    <button
                      className="rounded-2xl border border-amber-200 px-3 py-2 font-semibold text-amber-700"
                      disabled={isPending || currentUser?.id === user.id}
                      onClick={() => handleStatusChange(user.id, !user.isActive)}
                      type="button"
                    >
                      {user.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      className="rounded-2xl border border-rose-200 px-3 py-2 font-semibold text-rose-700"
                      disabled={isPending || currentUser?.id === user.id}
                      onClick={() => handleDelete(user.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
