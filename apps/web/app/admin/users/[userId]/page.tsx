import { AdminUserForm } from "../../../../components/admin/admin-user-form";
import { DashboardShell } from "../../../../components/dashboard/shell";
import { adminLinks } from "../../../../lib/admin-nav";

export default async function AdminEditUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;

  return (
    <DashboardShell
      title="Edit user"
      description="Update user details, role, password, and activation state, then save the record."
      links={adminLinks}
    >
      <AdminUserForm mode="edit" userId={userId} />
    </DashboardShell>
  );
}
