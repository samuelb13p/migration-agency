import { AdminUserForm } from "../../../../components/admin/admin-user-form";
import { DashboardShell } from "../../../../components/dashboard/shell";
import { adminLinks } from "../../../../lib/admin-nav";

export default function AdminCreateUserPage() {
  return (
    <DashboardShell
      title="Create user"
      description="Create customer, agent, or admin accounts with the correct role from the start."
      links={adminLinks}
    >
      <AdminUserForm mode="create" />
    </DashboardShell>
  );
}
