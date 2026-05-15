import { DashboardShell } from "../../components/dashboard/shell";
import { CustomerProfileGate } from "../../components/customer/customer-profile-gate";
import { LiveNotifications } from "../../components/dashboard/live-notifications";
import { customerLinks } from "../../lib/customer-nav";

export default function CustomerNotificationsPage() {
  return (
    <DashboardShell
      title="Notifications"
      description="In-app messages are ready to pair with email delivery templates from the backend notification service."
      links={customerLinks}
    >
      <CustomerProfileGate>
        <LiveNotifications />
      </CustomerProfileGate>
    </DashboardShell>
  );
}
