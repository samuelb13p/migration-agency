"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { apiFetchWithToken } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";
import { Card } from "../ui/card";
import { LoadingSpinner } from "../ui/loading-spinner";

type AdminUserRecord = {
  id: string;
  email: string;
  isActive: boolean;
  role: { name: string };
  customerProfile?: { firstName: string; lastName: string; phone?: string | null } | null;
  agentProfile?: { firstName: string; lastName: string; phone?: string | null } | null;
  adminProfile?: { firstName: string; lastName: string } | null;
};

function getProfile(user: AdminUserRecord | null) {
  if (!user) return null;
  return user.customerProfile ?? user.agentProfile ?? user.adminProfile ?? null;
}

function getPhone(user: AdminUserRecord | null) {
  if (!user) return "";
  if (user.customerProfile?.phone) return user.customerProfile.phone;
  if (user.agentProfile?.phone) return user.agentProfile.phone;
  return "";
}

export function AdminUserForm({ mode, userId }: { mode: "create" | "edit"; userId?: string }) {
  const router = useRouter();
  const [user, setUser] = useState<AdminUserRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (mode !== "edit" || !userId) return;
    const token = getAccessToken();
    if (!token) return;

    void apiFetchWithToken<AdminUserRecord>(`/api/admin/users/${userId}`, token)
      .then(setUser)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load user.");
      });
  }, [mode, userId]);

  const profile = getProfile(user);
  const phone = getPhone(user);

  function handleSubmit(formData: FormData) {
    const token = getAccessToken();
    if (!token) return;

    setError(null);
    setMessage(null);

    const payload = {
      email: String(formData.get("email") ?? ""),
      roleName: String(formData.get("roleName") ?? ""),
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      phone: String(formData.get("phone") ?? "") || undefined,
      isActive: formData.get("isActive") === "on",
      password: String(formData.get("password") ?? "") || undefined,
    };

    startTransition(() => {
      void apiFetchWithToken(
        mode === "create" ? "/api/admin/users" : `/api/admin/users/${userId}`,
        token,
        {
          method: mode === "create" ? "POST" : "PUT",
          body: JSON.stringify(payload),
        },
      )
        .then(() => {
          setMessage(mode === "create" ? "User created." : "User updated.");
          router.push("/admin/users");
          router.refresh();
        })
        .catch((submitError) => {
          setError(submitError instanceof Error ? submitError.message : "Unable to save user.");
        });
    });
  }

  if (mode === "edit" && !user && !error) {
    return (
      <Card>
        <p className="text-sm text-slate-500">Loading user...</p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-xl font-semibold">{mode === "create" ? "Create user" : "Edit user"}</h2>
      <p className="mt-2 text-sm text-slate-500">
        {mode === "create"
          ? "Choose the role at creation time and fill in the profile details."
          : "Update the user info, role, password, or activation state, then save."}
      </p>

      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}

      <form action={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
        <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={user?.email ?? ""} name="email" placeholder="Email" type="email" />
        <select className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={user?.role.name ?? "customer"} name="roleName">
          <option value="customer">customer</option>
          <option value="agent">agent</option>
          <option value="admin">admin</option>
        </select>
        <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={profile?.firstName ?? ""} name="firstName" placeholder="First name" />
        <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={profile?.lastName ?? ""} name="lastName" placeholder="Last name" />
        <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={phone} name="phone" placeholder="Phone" />
        <input
          className="rounded-2xl border border-slate-200 px-4 py-3"
          name="password"
          placeholder={mode === "create" ? "Password" : "New password (optional)"}
          type="password"
        />
        <label className="flex items-center gap-3 text-sm text-slate-600 md:col-span-2">
          <input className="h-4 w-4" defaultChecked={user?.isActive ?? true} name="isActive" type="checkbox" />
          Active user
        </label>
        <div className="flex flex-wrap gap-3 md:col-span-2">
          <button className="rounded-2xl bg-accent px-4 py-3 font-semibold text-white" disabled={isPending}>
            <span className="inline-flex items-center justify-center gap-2">
              {isPending ? <LoadingSpinner label="Saving user" /> : null}
              <span>{isPending ? "Saving..." : "Save"}</span>
            </span>
          </button>
          <button
            className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold"
            onClick={() => router.push("/admin/users")}
            type="button"
          >
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}
