"use client";

import { useEffect, useState } from "react";
import { apiFetchWithToken } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";
import { sampleUser } from "../../lib/sample-data";
import { Card } from "../ui/card";

type ProfileRecord = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  nationality?: string;
  passportNumber?: string;
};

export function LiveProfile() {
  const [profile, setProfile] = useState<ProfileRecord | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    const accessToken = token;

    async function load() {
      try {
        const data = await apiFetchWithToken<ProfileRecord>("/api/profile", accessToken);
        setProfile(data);
      } catch {
        setProfile(null);
      }
    }

    void load();
  }, []);

  const sampleNameParts = sampleUser.profile.fullName.split(" ");

  const activeProfile = profile ?? {
    firstName: sampleNameParts[0] ?? "",
    lastName: sampleNameParts.slice(1).join(" "),
    phone: sampleUser.profile.phone,
    nationality: sampleUser.profile.nationality,
    passportNumber: sampleUser.profile.passportNumber,
  };

  return (
    <Card>
      <h2 className="text-xl font-semibold">Personal details</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Full name" value={`${activeProfile.firstName ?? ""} ${activeProfile.lastName ?? ""}`.trim()} />
        <Field label="Email" value={sampleUser.email} />
        <Field label="Phone" value={activeProfile.phone} />
        <Field label="Nationality" value={activeProfile.nationality} />
        <Field label="Passport number" value={activeProfile.passportNumber} />
      </div>
    </Card>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 px-5 py-4">
      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{label}</p>
      <p className="mt-3 font-medium">{value ?? "Not provided"}</p>
    </div>
  );
}
