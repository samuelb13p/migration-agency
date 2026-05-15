import { cn } from "../../lib/utils";

export function LoadingSpinner({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)} role="status" aria-label={label}>
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
    </span>
  );
}
