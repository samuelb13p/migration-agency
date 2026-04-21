import { DashboardShell } from "../../components/dashboard/shell";
import { LiveAdminDashboard } from "../../components/dashboard/live-admin-dashboard";
import { adminLinks } from "../../lib/admin-nav";

export default function AdminDashboardPage() {
  return (
    <DashboardShell
      title="Admin dashboard"
      description="System configuration, access control, visa rule management, visa case oversight, and operational administration."
      links={adminLinks}
    >
      <LiveAdminDashboard />
    </DashboardShell>
  );
}
