import { cn } from "../../lib/utils";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-panel backdrop-blur", className)}>{children}</div>;
}
