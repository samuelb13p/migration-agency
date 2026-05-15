import { DashboardShell } from "../../../components/dashboard/shell";
import { LiveNotifications } from "../../../components/dashboard/live-notifications";
import { agentLinks } from "../../../lib/agent-nav";

export default function AgentNotificationsPage() {
  return (
    <DashboardShell
      title="Agent notifications"
      description="Operational events for uploads, checklist completion, and review outcomes."
      links={agentLinks}
    >
      <LiveNotifications />
    </DashboardShell>
  );
}
