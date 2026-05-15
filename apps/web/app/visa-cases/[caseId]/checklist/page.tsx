import { DashboardShell } from "../../../../components/dashboard/shell";
import { CustomerProfileGate } from "../../../../components/customer/customer-profile-gate";
import { LiveVisaCaseChecklist } from "../../../../components/dashboard/live-visa-case-checklist";
import { customerLinks } from "../../../../lib/customer-nav";

export default async function VisaCaseChecklistPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;

  return (
    <DashboardShell
      title="Checklist"
      description="Rule-based required document tracking for the visa case, including completeness status and missing-item visibility."
      links={[...customerLinks, { href: `/visa-cases/${caseId}`, label: "Visa case details" }, { href: `/visa-cases/${caseId}/uploads`, label: "Uploads" }]}
    >
      <CustomerProfileGate>
        <LiveVisaCaseChecklist caseId={caseId} />
      </CustomerProfileGate>
    </DashboardShell>
  );
}
