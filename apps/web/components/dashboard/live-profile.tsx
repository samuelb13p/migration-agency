"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { apiFetchWithToken } from "../../lib/api";
import { getAccessToken, getSessionUser } from "../../lib/auth";
import { getPendingCustomerContract } from "../../lib/customer-contract";
import { CustomerProfileRecord, isCustomerProfileComplete } from "../../lib/customer-profile";
import { Card } from "../ui/card";
import { LoadingSpinner } from "../ui/loading-spinner";

type EditableProfileRecord = CustomerProfileRecord & {
  firstName?: string | null;
  lastName?: string | null;
};

function toDateInput(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

function toIsoDate(value: FormDataEntryValue | null) {
  const stringValue = String(value ?? "").trim();
  if (!stringValue) return undefined;
  return new Date(`${stringValue}T00:00:00.000Z`).toISOString();
}

export function LiveProfile() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionUser = getSessionUser();
  const [profile, setProfile] = useState<EditableProfileRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    void apiFetchWithToken<EditableProfileRecord>("/api/profile", token)
      .then(setProfile)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load profile.");
      });
  }, []);

  function handleSubmit(formData: FormData) {
    const token = getAccessToken();
    if (!token) return;

    setError(null);
    setMessage(null);

    const payload = {
      firstName: String(formData.get("firstName") ?? "").trim(),
      lastName: String(formData.get("lastName") ?? "").trim(),
      dateOfBirth: toIsoDate(formData.get("dateOfBirth")),
      nationality: String(formData.get("nationality") ?? "").trim() || undefined,
      passportNumber: String(formData.get("passportNumber") ?? "").trim() || undefined,
      passportExpiryDate: toIsoDate(formData.get("passportExpiryDate")),
      phone: String(formData.get("phone") ?? "").trim() || undefined,
      addressLine1: String(formData.get("addressLine1") ?? "").trim() || undefined,
      addressLine2: String(formData.get("addressLine2") ?? "").trim() || undefined,
      city: String(formData.get("city") ?? "").trim() || undefined,
      state: String(formData.get("state") ?? "").trim() || undefined,
      postcode: String(formData.get("postcode") ?? "").trim() || undefined,
      country: String(formData.get("country") ?? "").trim() || undefined,
      acceptPolicy: formData.get("acceptPolicy") === "on",
      acceptedPolicyAt: formData.get("acceptPolicy") === "on" ? new Date().toISOString() : undefined,
    };

    startTransition(() => {
      void apiFetchWithToken<EditableProfileRecord>("/api/profile", token, {
        method: "PUT",
        body: JSON.stringify(payload),
      })
        .then(async (savedProfile) => {
          setProfile(savedProfile);
          if (isCustomerProfileComplete(savedProfile)) {
            const pendingContract = await getPendingCustomerContract(token);
            if (pendingContract) {
              setMessage("Profile completed successfully. Redirecting you to sign your contract...");
              startTransition(() => {
                router.push("/contracts?sign=1");
              });
              return;
            }

            setMessage("Profile completed successfully. Redirecting to your dashboard...");
            startTransition(() => {
              router.push("/dashboard");
            });
            return;
          }

          setMessage("Profile saved. Please complete the remaining required information.");
        })
        .catch((submitError) => {
          setError(submitError instanceof Error ? submitError.message : "Unable to save profile.");
        });
    });
  }

  const mustCompleteProfile = searchParams.get("complete") === "1" || !isCustomerProfileComplete(profile);

  if (!profile && !error) {
    return (
      <Card>
        <p className="text-sm text-slate-500">Loading profile...</p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-xl font-semibold">Complete your profile</h2>
      <p className="mt-2 text-sm text-slate-500">
        We use this information for case processing, checklist logic, and contract generation.
      </p>

      {mustCompleteProfile ? (
        <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Complete all required customer information before continuing to the rest of the portal.
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}

      <form action={handleSubmit} className="mt-6 grid gap-6">
        <div className="grid gap-4 md:grid-cols-2">
          <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={profile?.firstName ?? ""} name="firstName" placeholder="First name" />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={profile?.lastName ?? ""} name="lastName" placeholder="Last name" />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={sessionUser?.email ?? ""} disabled placeholder="Email" type="email" />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={profile?.phone ?? ""} name="phone" placeholder="Phone" />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={toDateInput(profile?.dateOfBirth)} name="dateOfBirth" type="date" />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={profile?.nationality ?? ""} name="nationality" placeholder="Nationality" />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={profile?.passportNumber ?? ""} name="passportNumber" placeholder="Passport number" />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={toDateInput(profile?.passportExpiryDate)} name="passportExpiryDate" type="date" />
        </div>

        <div className="rounded-3xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-900">Address</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input className="rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" defaultValue={profile?.addressLine1 ?? ""} name="addressLine1" placeholder="Address line 1" />
            <input className="rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" defaultValue={profile?.addressLine2 ?? ""} name="addressLine2" placeholder="Address line 2" />
            <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={profile?.city ?? ""} name="city" placeholder="City" />
            <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={profile?.state ?? ""} name="state" placeholder="State" />
            <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={profile?.postcode ?? ""} name="postcode" placeholder="Postcode" />
            <input className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={profile?.country ?? ""} name="country" placeholder="Country" />
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-3xl border border-slate-200 px-5 py-4 text-sm text-slate-700">
          <input className="mt-1 h-4 w-4" defaultChecked={profile?.acceptPolicy ?? false} name="acceptPolicy" type="checkbox" />
          <span>I confirm that the information provided is accurate and I accept the platform privacy and data handling policy.</span>
        </label>

        <button className="w-full rounded-2xl bg-accent px-4 py-3 font-semibold text-white md:w-auto" disabled={isPending}>
          <span className="inline-flex items-center justify-center gap-2">
            {isPending ? <LoadingSpinner label="Saving profile" /> : null}
            <span>{isPending ? "Saving..." : "Save profile"}</span>
          </span>
        </button>
      </form>
    </Card>
  );
}
