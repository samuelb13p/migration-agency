import { DashboardShell } from "../../components/dashboard/shell";
import { LiveAgentDashboard } from "../../components/dashboard/live-agent-dashboard";
import { agentLinks } from "../../lib/agent-nav";

export default function AgentDashboardPage() {
  return (
    <DashboardShell
      title="Agent dashboard"
      description="Assigned visa case triage, missing-document visibility, and review queues for migration case workers."
      links={agentLinks}
    >
      <LiveAgentDashboard />
    </DashboardShell>
  );
}
