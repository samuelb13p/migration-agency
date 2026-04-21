import { Card } from "../ui/card";

export function OverviewCards({
  items,
}: {
  items: Array<{ label: string; value: string; helper: string }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label}>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{item.label}</p>
          <p className="mt-4 text-3xl font-semibold">{item.value}</p>
          <p className="mt-2 text-sm text-slate-500">{item.helper}</p>
        </Card>
      ))}
    </div>
  );
}
