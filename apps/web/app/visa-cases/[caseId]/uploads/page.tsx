import { DashboardShell } from "../../../../components/dashboard/shell";
import { LiveUploadsManager } from "../../../../components/dashboard/live-uploads-manager";

export default async function VisaCaseUploadsPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;

  return (
    <DashboardShell
      title="Upload documents"
      description="Private visa case uploads use version history so new files never overwrite older submissions silently."
      links={[
        { href: "/dashboard", label: "Dashboard" },
        { href: `/visa-cases/${caseId}`, label: "Visa case details" },
        { href: `/visa-cases/${caseId}/checklist`, label: "Checklist" },
      ]}
    >
      <LiveUploadsManager caseId={caseId} />
    </DashboardShell>
  );
}
