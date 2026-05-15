import { DashboardShell } from "../../../../../components/dashboard/shell";
import { LiveReviewWorkspace } from "../../../../../components/dashboard/live-review-workspace";
import { agentLinks } from "../../../../../lib/agent-nav";

export default async function AgentReviewPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;

  return (
    <DashboardShell
      title="Document review"
      description="Review the latest actionable uploads, approve them, or send them back for re-upload while keeping the visa case workflow clear."
      links={[...agentLinks, { href: `/agent/cases/${caseId}/review`, label: "Review" }]}
    >
      <LiveReviewWorkspace caseId={caseId} />
    </DashboardShell>
  );
}
