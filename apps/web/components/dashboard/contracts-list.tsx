import { Card } from "../ui/card";

export function ContractsList({ contracts }: { contracts: Array<{ id: string; templateName: string; generatedAt: string }> }) {
  return (
    <Card>
      <h2 className="text-xl font-semibold">Contracts</h2>
      <div className="mt-6 space-y-3">
        {contracts.map((contract) => (
          <div key={contract.id} className="rounded-3xl border border-slate-200 px-5 py-4">
            <p className="font-medium">{contract.templateName}</p>
            <p className="mt-2 text-sm text-slate-500">Generated {new Date(contract.generatedAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
