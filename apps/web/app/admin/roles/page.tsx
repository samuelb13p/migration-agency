import { LiveAdminRoles } from "../../../components/admin/live-admin-roles";
import { DashboardShell } from "../../../components/dashboard/shell";
import { adminLinks } from "../../../lib/admin-nav";

export default function AdminRolesPage() {
  return (
    <DashboardShell title="Roles" description="View the list of system roles and how many permissions each role currently has." links={adminLinks}>
      <LiveAdminRoles />
    </DashboardShell>
  );
}
