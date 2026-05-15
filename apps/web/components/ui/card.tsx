import { cn } from "../../lib/utils";

export function Card({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn("rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-panel backdrop-blur", className)}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
