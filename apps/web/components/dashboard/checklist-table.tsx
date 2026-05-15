import Link from "next/link";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";

function toneForItemStatus(status: string) {
  if (status === "approved") return "success" as const;
  if (status === "rejected") return "danger" as const;
  if (status === "reupload_requested") return "warning" as const;
  if (status === "waiting_review") return "neutral" as const;
  if (status === "missing") return "warning" as const;
  return "neutral" as const;
}

function labelForStatus(status: string) {
  return status.replaceAll("_", " ");
}

function uploadLabelForStatus(status: string) {
  if (status === "missing") return "Upload";
  if (status === "rejected" || status === "reupload_requested") return "Upload again";
  if (status === "approved") return "Approved";
  return "Waiting review";
}

export function ChecklistTable({
  caseId,
  items,
}: {
  caseId: string;
  items: Array<{ id: string; name: string; status: string; reviewStatus: string }>;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Required documents</h2>
          <p className="mt-1 text-sm text-slate-500">Live document status with direct upload actions.</p>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="grid gap-4 rounded-3xl border border-slate-200 px-5 py-4 md:grid-cols-[minmax(0,1.7fr)_auto_auto] md:items-center">
            <div className="min-w-0">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-slate-500">Code: {item.id}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:justify-self-start">
              <Badge tone={toneForItemStatus(item.status)}>{labelForStatus(item.status)}</Badge>
            </div>
            <div className="md:justify-self-end">
              {item.status === "approved" ? (
                <button
                  className="cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-400"
                  disabled
                  type="button"
                >
                  {uploadLabelForStatus(item.status)}
                </button>
              ) : (
                <Link
                  href={`/visa-cases/${caseId}/uploads?documentTypeId=${item.id}`}
                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent"
                >
                  {uploadLabelForStatus(item.status)}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
