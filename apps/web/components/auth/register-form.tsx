"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";
import { saveSession } from "../../lib/auth";

type RegisterResponse = {
  user: { id: string; email: string; roleId: string; roleName: string };
  tokens: { accessToken: string; refreshToken: string };
};

function getPostLoginPath(roleName: string) {
  if (roleName === "admin") return "/admin";
  if (roleName === "agent") return "/agent";
  return "/dashboard";
}

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);
    const fullName = String(formData.get("fullName") ?? "").trim();
    const [firstName = "", ...lastNameParts] = fullName.split(/\s+/);
    const lastName = lastNameParts.join(" ");

    if (firstName.length < 2 || lastName.length < 2) {
      setError("Enter both first and last name.");
      return;
    }

    try {
      const data = await apiFetch<RegisterResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          firstName,
          lastName,
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
          roleName: "customer",
        }),
      });

      saveSession({ ...data.tokens, user: data.user });
      startTransition(() => {
        router.push(getPostLoginPath(data.user.roleName));
      });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Registration failed");
    }
  }

  return (
    <form action={handleSubmit} className="mt-6 space-y-4">
      <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Full name" name="fullName" />
      <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Email" type="email" name="email" />
      <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Password" type="password" name="password" />
      <button className="w-full rounded-2xl bg-accent px-4 py-3 font-semibold text-white" disabled={isPending}>
        {isPending ? "Creating account..." : "Register"}
      </button>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </form>
  );
}
