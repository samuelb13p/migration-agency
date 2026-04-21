import { LiveAdminAssignedPermissions } from "../../../components/admin/live-admin-assigned-permissions";
import { DashboardShell } from "../../../components/dashboard/shell";
import { adminLinks } from "../../../lib/admin-nav";

export default function AdminAssignedPermissionsPage() {
  return (
    <DashboardShell
      title="Assigned permissions"
      description="Select a role, then assign or remove permissions for that role."
      links={adminLinks}
    >
      <LiveAdminAssignedPermissions />
    </DashboardShell>
  );
}
