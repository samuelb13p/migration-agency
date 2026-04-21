import { DashboardShell } from "../../../../../components/dashboard/shell";
import { LiveReviewWorkspace } from "../../../../../components/dashboard/live-review-workspace";

export default async function AgentReviewPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;

  return (
    <DashboardShell
      title="Document review"
      description="Approve, reject, or request re-upload while preserving document version history and visa case auditability."
      links={[
        { href: "/agent", label: "Dashboard" },
        { href: `/agent/cases/${caseId}`, label: "Visa case details" },
        { href: `/agent/cases/${caseId}/review`, label: "Review" },
      ]}
    >
      <LiveReviewWorkspace caseId={caseId} />
    </DashboardShell>
  );
}
