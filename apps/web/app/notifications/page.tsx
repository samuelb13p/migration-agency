import { DashboardShell } from "../../components/dashboard/shell";
import { LiveNotifications } from "../../components/dashboard/live-notifications";

export default function CustomerNotificationsPage() {
  return (
    <DashboardShell
      title="Notifications"
      description="In-app messages are ready to pair with email delivery templates from the backend notification service."
      links={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/profile", label: "My profile" },
        { href: "/notifications", label: "Notifications" },
      ]}
    >
      <LiveNotifications />
    </DashboardShell>
  );
}
