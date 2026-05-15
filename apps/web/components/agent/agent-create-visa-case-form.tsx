"use client";

import { useEffect, useState, useTransition } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { apiFetchWithToken } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";
import { Card } from "../ui/card";
import { LoadingSpinner } from "../ui/loading-spinner";

type VisaTypeRecord = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
};

type ContractTemplateRecord = {
  id: string;
  name: string;
  version: string;
  isActive: boolean;
};

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "waiting_documents", label: "Waiting documents" },
  { value: "documents_uploaded", label: "Documents uploaded" },
  { value: "under_review", label: "Under review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "contract_sent", label: "Contract sent" },
  { value: "completed", label: "Completed" },
];

export function AgentCreateVisaCaseForm() {
  const router = useRouter();
  const [visaTypes, setVisaTypes] = useState<VisaTypeRecord[]>([]);
  const [contractTemplates, setContractTemplates] = useState<ContractTemplateRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    void Promise.all([
      apiFetchWithToken<VisaTypeRecord[]>("/api/visa-types", token),
      apiFetchWithToken<ContractTemplateRecord[]>("/api/contract-templates/active", token),
    ])
      .then(([visaTypeData, contractTemplateData]) => {
        setVisaTypes(visaTypeData.filter((item) => item.isActive));
        setContractTemplates(contractTemplateData.filter((item) => item.isActive));
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load form options.");
      });
  }, []);

  async function handleSubmit(formData: FormData) {
    if (isSubmitting) return;

    const token = getAccessToken();
    if (!token) return;

    setError(null);
    setMessage(null);
    flushSync(() => {
      setIsSubmitting(true);
    });

    const payload = {
      caseNumber: String(formData.get("caseNumber") ?? "").trim(),
      visaTypeId: String(formData.get("visaTypeId") ?? ""),
      contractTemplateId: String(formData.get("contractTemplateId") ?? ""),
      status: String(formData.get("status") ?? "waiting_documents"),
      customer: {
        firstName: String(formData.get("firstName") ?? "").trim(),
        lastName: String(formData.get("lastName") ?? "").trim(),
        email: String(formData.get("email") ?? "").trim(),
        passportNumber: String(formData.get("passportNumber") ?? "").trim(),
      },
    };

    try {
      const createdCase = await apiFetchWithToken<{ id: string; emailSent: boolean; customerEmail: string }>("/api/agent/visa-cases", token, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setMessage(
        createdCase.emailSent
          ? `Visa case created and access email sent to ${createdCase.customerEmail}.`
          : `Visa case created for ${createdCase.customerEmail}, but the email could not be sent.`,
      );
      startTransition(() => {
          router.push(`/agent/cases/${createdCase.id}`);
          router.refresh();
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create visa case.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <h2 className="text-xl font-semibold">Create visa case</h2>
      <p className="mt-2 text-sm text-slate-500">
        Create the customer account and visa case in one step. The customer will use their passport number as the initial password.
      </p>

      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}

      <form action={handleSubmit} className="mt-6 grid gap-6">
        <div className="grid gap-4 md:grid-cols-2">
          <input className="rounded-2xl border border-slate-200 px-4 py-3" name="caseNumber" placeholder="Case number" />
          <select className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue="" name="visaTypeId">
            <option disabled value="">
              Select visa type
            </option>
            {visaTypes.map((visaType) => (
              <option key={visaType.id} value={visaType.id}>
                {visaType.name} ({visaType.code})
              </option>
            ))}
          </select>
          <select className="rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" defaultValue="" name="contractTemplateId">
            <option disabled value="">
              Select contract template
            </option>
            {contractTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} ({template.version})
              </option>
            ))}
          </select>
          <select className="rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" defaultValue="waiting_documents" name="status">
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-3xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-900">Customer details</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input className="rounded-2xl border border-slate-200 px-4 py-3" name="firstName" placeholder="First name" />
            <input className="rounded-2xl border border-slate-200 px-4 py-3" name="lastName" placeholder="Last name" />
            <input className="rounded-2xl border border-slate-200 px-4 py-3" name="email" placeholder="Email" type="email" />
            <input className="rounded-2xl border border-slate-200 px-4 py-3" name="passportNumber" placeholder="Passport number" />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="rounded-2xl bg-accent px-4 py-3 font-semibold text-white" disabled={isSubmitting || isPending}>
            <span className="inline-flex items-center justify-center gap-2">
              {isSubmitting || isPending ? <LoadingSpinner label="Creating visa case" /> : null}
              <span>{isSubmitting || isPending ? "Saving..." : "Create visa case"}</span>
            </span>
          </button>
          <button className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold" disabled={isSubmitting || isPending} onClick={() => router.push("/agent")} type="button">
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}
