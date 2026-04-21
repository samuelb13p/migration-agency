import { LiveAdminPermissions } from "../../../components/admin/live-admin-permissions";
import { DashboardShell } from "../../../components/dashboard/shell";
import { adminLinks } from "../../../lib/admin-nav";

export default function AdminPermissionsPage() {
  return (
    <DashboardShell title="Permissions" description="View the list of permissions available in the platform." links={adminLinks}>
      <LiveAdminPermissions />
    </DashboardShell>
  );
}
