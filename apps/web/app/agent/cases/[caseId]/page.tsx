import { DashboardShell } from "../../../../components/dashboard/shell";
import { LiveAgentCaseDetails } from "../../../../components/dashboard/live-agent-case-details";

export default async function AgentCaseDetailsPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;

  return (
    <DashboardShell
      title="Assigned visa case"
      description="Agent visa case detail view with access to missing documents, uploads, and review actions."
      links={[
        { href: "/agent", label: "Dashboard" },
        { href: `/agent/cases/${caseId}`, label: "Visa case details" },
        { href: `/agent/cases/${caseId}/review`, label: "Review screen" },
      ]}
    >
      <LiveAgentCaseDetails caseId={caseId} />
    </DashboardShell>
  );
}
