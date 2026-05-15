import { apiFetchWithToken } from "./api";

export type CustomerContractRecord = {
  id: string;
  status: string;
  createdAt: string;
  acceptedAt?: string | null;
  renderedBody?: string;
  generatedFileUrl?: string;
  contractTemplate?: {
    id: string;
    name: string;
    version: string;
    body: string;
  } | null;
};

type CustomerCaseRecord = {
  id: string;
};

export async function getPendingCustomerContract(accessToken: string) {
  const cases = await apiFetchWithToken<CustomerCaseRecord[]>("/api/visa-cases", accessToken);
  for (const visaCase of cases) {
    const contracts = await apiFetchWithToken<CustomerContractRecord[]>(`/api/visa-cases/${visaCase.id}/contracts`, accessToken);
    const pending = contracts.find((contract) => contract.status !== "accepted");
    if (pending) {
      return pending;
    }
  }

  return null;
}
