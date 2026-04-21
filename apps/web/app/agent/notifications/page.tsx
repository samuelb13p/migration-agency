import { DashboardShell } from "../../../components/dashboard/shell";
import { LiveNotifications } from "../../../components/dashboard/live-notifications";

export default function AgentNotificationsPage() {
  return (
    <DashboardShell
      title="Agent notifications"
      description="Operational events for uploads, checklist completion, and review outcomes."
      links={[
        { href: "/agent", label: "Dashboard" },
        { href: "/agent/notifications", label: "Notifications" },
      ]}
    >
      <LiveNotifications />
    </DashboardShell>
  );
}
