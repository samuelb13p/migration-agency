"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetchWithToken, getApiUrl } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";
import type { CustomerContractRecord } from "../../lib/customer-contract";
import { Card } from "../ui/card";
import { LoadingSpinner } from "../ui/loading-spinner";

type CaseRecord = { id: string };
type DownloadTokenResponse = { token: string };

function formatStatusLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function LiveContracts() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [contracts, setContracts] = useState<CustomerContractRecord[]>([]);
  const [pendingContract, setPendingContract] = useState<CustomerContractRecord | null>(null);
  const [selectedContract, setSelectedContract] = useState<CustomerContractRecord | null>(null);
  const [acceptChecked, setAcceptChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function load() {
    const token = getAccessToken();
    if (!token) return;

    const cases = await apiFetchWithToken<CaseRecord[]>("/api/visa-cases", token);
    if (!cases.length) {
      setContracts([]);
      setPendingContract(null);
      return;
    }

    const contractGroups = await Promise.all(
      cases.map((visaCase) => apiFetchWithToken<CustomerContractRecord[]>(`/api/visa-cases/${visaCase.id}/contracts`, token)),
    );

    const allContracts = contractGroups.flat().sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
    setContracts(allContracts);
    const nextPendingContract = allContracts.find((contract) => contract.status !== "accepted") ?? null;
    setPendingContract(nextPendingContract);
    setSelectedContract((current) => {
      if (current) {
        return allContracts.find((contract) => contract.id === current.id) ?? nextPendingContract ?? allContracts[0] ?? null;
      }

      return nextPendingContract ?? allContracts[0] ?? null;
    });
  }

  useEffect(() => {
    void load().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Unable to load contracts.");
    });
  }, []);

  function handleAccept(contractId: string) {
    const token = getAccessToken();
    if (!token) return;

    setError(null);
    setMessage(null);

    if (!acceptChecked) {
      setError("You need to confirm the contract before signing.");
      return;
    }

    startTransition(() => {
      void apiFetchWithToken(`/api/contracts/${contractId}/accept`, token, {
        method: "POST",
        body: JSON.stringify({ accepted: true }),
      })
        .then(async () => {
          setMessage("Contract signed successfully. Redirecting to your dashboard...");
          setAcceptChecked(false);
          await load();
          startTransition(() => {
            router.push("/dashboard");
          });
        })
        .catch((submitError) => {
          setError(submitError instanceof Error ? submitError.message : "Unable to sign contract.");
        });
    });
  }

  async function handleDownload(contractId: string) {
    const token = getAccessToken();
    if (!token) return;

    setError(null);

    try {
      const response = await apiFetchWithToken<DownloadTokenResponse>(`/api/contracts/${contractId}/download-token`, token);
      window.open(getApiUrl(`/api/contracts/download/${response.token}`), "_blank", "noopener,noreferrer");
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Unable to download contract.");
    }
  }

  const forceSignature = searchParams.get("sign") === "1";

  return (
    <div className="space-y-6">
      {pendingContract ? (
        <Card>
          <h2 className="text-xl font-semibold">Sign your contract</h2>
          <p className="mt-2 text-sm text-slate-500">
            {forceSignature
              ? "Before continuing to the portal, you need to review and sign this contract."
              : "You have a pending contract ready for signature."}
          </p>

          {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
          {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}

          <div className="mt-6 rounded-3xl border border-slate-200 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Template</p>
            <h3 className="mt-3 text-lg font-semibold">
              {pendingContract.contractTemplate?.name ?? "Contract"} {pendingContract.contractTemplate?.version ? `(${pendingContract.contractTemplate.version})` : ""}
            </h3>
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">
              {pendingContract.renderedBody ?? pendingContract.contractTemplate?.body ?? "Contract content is available in the generated PDF."}
            </p>
          </div>

          <label className="mt-6 flex items-start gap-3 rounded-3xl border border-slate-200 px-5 py-4 text-sm text-slate-700">
            <input checked={acceptChecked} className="mt-1 h-4 w-4" onChange={(event) => setAcceptChecked(event.target.checked)} type="checkbox" />
            <span>I have reviewed this contract and I agree to sign and accept it.</span>
          </label>

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700" onClick={() => void handleDownload(pendingContract.id)} type="button">
              Download PDF
            </button>
            <button className="rounded-2xl bg-accent px-4 py-3 font-semibold text-white" disabled={isPending} onClick={() => handleAccept(pendingContract.id)} type="button">
              <span className="inline-flex items-center justify-center gap-2">
                {isPending ? <LoadingSpinner label="Signing contract" /> : null}
                <span>{isPending ? "Signing..." : "Sign contract"}</span>
              </span>
            </button>
          </div>
        </Card>
      ) : null}

      {forceSignature ? null : (
        <Card>
          <h2 className="text-xl font-semibold">Contracts</h2>
          <div className="mt-6 space-y-3">
            {contracts.length === 0 ? <p className="text-sm text-slate-500">No contracts are available yet.</p> : null}
            {contracts.map((contract) => (
              <div key={contract.id} className="rounded-3xl border border-slate-200 px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      {contract.contractTemplate?.name ?? "Contract"} {contract.contractTemplate?.version ? `(${contract.contractTemplate.version})` : ""}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">Created {new Date(contract.createdAt).toLocaleString()}</p>
                    <p className="mt-1 text-sm text-slate-500">Status: {formatStatusLabel(contract.status)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                      onClick={() => setSelectedContract(contract)}
                      type="button"
                    >
                      Read
                    </button>
                    <button
                      className="rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-white"
                      onClick={() => void handleDownload(contract.id)}
                      type="button"
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!forceSignature && selectedContract ? (
        <Card>
          <h2 className="text-xl font-semibold">Read contract</h2>
          <p className="mt-2 text-sm text-slate-500">
            {selectedContract.contractTemplate?.name ?? "Contract"} {selectedContract.contractTemplate?.version ? `(${selectedContract.contractTemplate.version})` : ""} · {formatStatusLabel(selectedContract.status)}
          </p>
          <div className="mt-6 rounded-3xl border border-slate-200 p-5">
            <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
              {selectedContract.renderedBody ?? selectedContract.contractTemplate?.body ?? "Contract content is available in the generated PDF."}
            </p>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
