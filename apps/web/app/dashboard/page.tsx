import { DashboardShell } from "../../components/dashboard/shell";
import { CustomerProfileGate } from "../../components/customer/customer-profile-gate";
import { LiveDashboard } from "../../components/dashboard/live-dashboard";
import { customerLinks } from "../../lib/customer-nav";

export default function CustomerDashboardPage() {
  return (
    <DashboardShell
      title="Customer workspace"
      description="Track visa case readiness, missing files, review results, and contract availability from a single secure dashboard."
      links={customerLinks}
    >
      <CustomerProfileGate>
        <LiveDashboard />
      </CustomerProfileGate>
    </DashboardShell>
  );
}
