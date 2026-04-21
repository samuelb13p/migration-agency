import { DashboardShell } from "../../components/dashboard/shell";
import { LiveAgentDashboard } from "../../components/dashboard/live-agent-dashboard";

export default function AgentDashboardPage() {
  return (
    <DashboardShell
      title="Agent dashboard"
      description="Assigned visa case triage, missing-document visibility, and review queues for migration case workers."
      links={[
        { href: "/agent", label: "Dashboard" },
        { href: "/agent/notifications", label: "Notifications" },
      ]}
    >
      <LiveAgentDashboard />
    </DashboardShell>
  );
}
