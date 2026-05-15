import { DashboardShell } from "../../../../components/dashboard/shell";
import { CustomerProfileGate } from "../../../../components/customer/customer-profile-gate";
import { LiveUploadsManager } from "../../../../components/dashboard/live-uploads-manager";
import { customerLinks } from "../../../../lib/customer-nav";

export default async function VisaCaseUploadsPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;

  return (
    <DashboardShell
      title="Upload documents"
      description="Private visa case uploads use version history so new files never overwrite older submissions silently."
      links={[...customerLinks, { href: `/visa-cases/${caseId}`, label: "Visa case details" }, { href: `/visa-cases/${caseId}/checklist`, label: "Checklist" }]}
    >
      <CustomerProfileGate>
        <LiveUploadsManager caseId={caseId} />
      </CustomerProfileGate>
    </DashboardShell>
  );
}
