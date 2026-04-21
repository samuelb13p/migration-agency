import { DashboardShell } from "../../../../components/dashboard/shell";
import { LiveVisaCaseChecklist } from "../../../../components/dashboard/live-visa-case-checklist";

export default async function VisaCaseChecklistPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;

  return (
    <DashboardShell
      title="Checklist"
      description="Rule-based required document tracking for the visa case, including completeness status and missing-item visibility."
      links={[
        { href: "/dashboard", label: "Dashboard" },
        { href: `/visa-cases/${caseId}`, label: "Visa case details" },
        { href: `/visa-cases/${caseId}/uploads`, label: "Uploads" },
      ]}
    >
      <LiveVisaCaseChecklist caseId={caseId} />
    </DashboardShell>
  );
}
