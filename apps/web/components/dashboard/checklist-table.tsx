import { Badge } from "../ui/badge";
import { Card } from "../ui/card";

export function ChecklistTable({
  items,
}: {
  items: Array<{ id: string; name: string; status: string; reviewStatus: string }>;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Required documents</h2>
          <p className="mt-1 text-sm text-slate-500">Checklist status with review visibility and upload guidance.</p>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col gap-3 rounded-3xl border border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-slate-500">Code: {item.id}</p>
            </div>
            <div className="flex gap-2">
              <Badge tone={item.status === "missing" ? "warning" : "success"}>{item.status}</Badge>
              <Badge tone={item.reviewStatus === "approved" ? "success" : "neutral"}>{item.reviewStatus}</Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
