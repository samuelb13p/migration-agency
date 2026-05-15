"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, apiFetchWithToken } from "../../lib/api";
import { saveSession } from "../../lib/auth";
import { getPendingCustomerContract } from "../../lib/customer-contract";
import { isCustomerProfileComplete, type CustomerProfileRecord } from "../../lib/customer-profile";
import { LoadingSpinner } from "../ui/loading-spinner";

type LoginResponse = {
  user: { id: string; email: string; roleId: string; roleName: string };
  tokens: { accessToken: string; refreshToken: string };
};

function getPostLoginPath(roleName: string) {
  if (roleName === "admin") return "/admin";
  if (roleName === "agent") return "/agent";
  return "/dashboard";
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      const data = await apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      saveSession({ ...data.tokens, user: data.user });

      let nextPath = getPostLoginPath(data.user.roleName);
      if (data.user.roleName === "customer") {
        const profile = await apiFetchWithToken<CustomerProfileRecord>("/api/profile", data.tokens.accessToken);
        if (!isCustomerProfileComplete(profile)) {
          nextPath = "/profile?complete=1";
        } else {
          const pendingContract = await getPendingCustomerContract(data.tokens.accessToken);
          if (pendingContract) {
            nextPath = "/contracts?sign=1";
          }
        }
      }

      startTransition(() => {
        router.push(nextPath);
      });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Login failed");
    }
  }

  return (
    <form action={handleSubmit} className="mt-6 space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="login-email">
          Email
        </label>
        <input
          id="login-email"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-accent focus:bg-white"
          placeholder="you@example.com"
          type="email"
          name="email"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-accent focus:bg-white"
          placeholder="Enter your password"
          type="password"
          name="password"
        />
      </div>
      <button className="w-full rounded-2xl bg-accent px-4 py-3 font-semibold text-white transition hover:brightness-105 disabled:opacity-70" disabled={isPending}>
        <span className="inline-flex items-center justify-center gap-2">
          {isPending ? <LoadingSpinner label="Signing in" /> : null}
          <span>{isPending ? "Signing in..." : "Login"}</span>
        </span>
      </button>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </form>
  );
}
