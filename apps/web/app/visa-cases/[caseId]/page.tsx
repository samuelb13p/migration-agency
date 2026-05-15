import { DashboardShell } from "../../../components/dashboard/shell";
import { CustomerProfileGate } from "../../../components/customer/customer-profile-gate";
import { LiveVisaCaseDetails } from "../../../components/dashboard/live-visa-case-details";
import { customerLinks } from "../../../lib/customer-nav";

export default async function VisaCaseDetailsPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;

  return (
    <DashboardShell
      title="Visa case details"
      description="A role-aware visa case view with progress, assignment, and quick access to uploads and checklist validation."
      links={[...customerLinks, { href: `/visa-cases/${caseId}/checklist`, label: "Checklist" }, { href: `/visa-cases/${caseId}/uploads`, label: "Uploads" }]}
    >
      <CustomerProfileGate>
        <LiveVisaCaseDetails caseId={caseId} basePath="/visa-cases" />
      </CustomerProfileGate>
    </DashboardShell>
  );
}
