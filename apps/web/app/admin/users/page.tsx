import { DashboardShell } from "../../../components/dashboard/shell";
import { LiveAdminUsers } from "../../../components/dashboard/live-admin-users";
import { adminLinks } from "../../../lib/admin-nav";

export default function AdminUsersPage() {
  return (
    <DashboardShell
      title="User management"
      description="Manage customer, agent, and admin accounts with role-aware administration."
      links={adminLinks}
    >
      <LiveAdminUsers />
    </DashboardShell>
  );
}
