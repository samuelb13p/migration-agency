import { DashboardShell } from "../../../components/dashboard/shell";
import { LiveVisaCaseDetails } from "../../../components/dashboard/live-visa-case-details";

export default async function VisaCaseDetailsPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;

  return (
    <DashboardShell
      title="Visa case details"
      description="A role-aware visa case view with progress, assignment, and quick access to uploads and checklist validation."
      links={[
        { href: "/dashboard", label: "Dashboard" },
        { href: `/visa-cases/${caseId}/checklist`, label: "Checklist" },
        { href: `/visa-cases/${caseId}/uploads`, label: "Uploads" },
      ]}
    >
      <LiveVisaCaseDetails caseId={caseId} basePath="/visa-cases" />
    </DashboardShell>
  );
}
