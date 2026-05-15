import { Card } from "../ui/card";

export function OverviewCards({
  items,
}: {
  items: Array<{
    label: string;
    value: string;
    helper: string;
    onClick?: () => void;
    active?: boolean;
  }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <Card
          key={item.label}
          className={item.onClick ? `cursor-pointer transition ${item.active ? "ring-2 ring-accent ring-offset-2" : "hover:border-accent hover:bg-slate-50"}` : undefined}
          onClick={item.onClick}
        >
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{item.label}</p>
          <p className="mt-4 text-3xl font-semibold">{item.value}</p>
          <p className="mt-2 text-sm text-slate-500">{item.helper}</p>
        </Card>
      ))}
    </div>
  );
}
