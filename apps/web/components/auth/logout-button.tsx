"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";
import { clearTokens, getRefreshToken, getSessionUser, type SessionUser } from "../../lib/auth";
import { LoadingSpinner } from "../ui/loading-spinner";

export function LogoutButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setUser(getSessionUser());
  }, []);

  async function handleLogout() {
    setError(null);
    const refreshToken = getRefreshToken();

    try {
      if (refreshToken) {
        await apiFetch<null>("/api/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch {
      // Clear the local session even if the backend session is already gone.
    } finally {
      clearTokens();
      setUser(null);
      startTransition(() => {
        router.push("/login");
        router.refresh();
      });
    }
  }

  return (
    <div className="mt-8 rounded-3xl border border-white/15 bg-white/5 p-4">
      <p className="text-sm font-medium text-white">{user?.email ?? "Signed-in user"}</p>
      <p className="mt-1 text-xs font-semibold uppercase text-white/60">{user?.roleName ?? "session"}</p>
      <button
        className="mt-4 w-full rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
        disabled={isPending}
        onClick={handleLogout}
        type="button"
      >
        <span className="inline-flex items-center justify-center gap-2">
          {isPending ? <LoadingSpinner label="Signing out" /> : null}
          <span>{isPending ? "Signing out..." : "Logout"}</span>
        </span>
      </button>
      {error ? <p className="mt-3 text-xs text-rose-200">{error}</p> : null}
    </div>
  );
}
