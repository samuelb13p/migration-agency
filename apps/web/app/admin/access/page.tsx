import { DashboardShell } from "../../../components/dashboard/shell";
import { LiveAdminAccess } from "../../../components/dashboard/live-admin-access";
import { adminLinks } from "../../../lib/admin-nav";

export default function AdminAccessPage() {
  return (
    <DashboardShell
      title="Access and roles"
      description="Role and permission administration for customers, agents, and admins."
      links={adminLinks}
    >
      <LiveAdminAccess />
    </DashboardShell>
  );
}
