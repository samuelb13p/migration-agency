"use client";

import { useEffect, useState } from "react";
import { apiFetchWithToken } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";
import { sampleContracts } from "../../lib/sample-data";
import { ContractsList } from "./contracts-list";

type CaseRecord = { id: string };
type ContractRecord = {
  id: string;
  contractTemplate?: { name?: string } | null;
  createdAt?: string;
  templateName?: string;
  generatedAt?: string;
};

export function LiveContracts() {
  const [contracts, setContracts] = useState<Array<{ id: string; templateName: string; generatedAt: string }>>([]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    const accessToken = token;

    async function load() {
      try {
        const cases = await apiFetchWithToken<CaseRecord[]>("/api/visa-cases", accessToken);
        const firstCase = cases[0];
        if (!firstCase) return;

        const data = await apiFetchWithToken<ContractRecord[]>(`/api/visa-cases/${firstCase.id}/contracts`, accessToken);
        setContracts(
          data.map((item) => ({
            id: item.id,
            templateName: item.contractTemplate?.name ?? item.templateName ?? "Contract",
            generatedAt: item.createdAt ?? item.generatedAt ?? new Date().toISOString(),
          })),
        );
      } catch {
        setContracts([]);
      }
    }

    void load();
  }, []);

  return <ContractsList contracts={contracts.length > 0 ? contracts : sampleContracts} />;
}
