import { LiveAdminContractTemplates } from "../../../components/admin/live-admin-contract-templates";
import { DashboardShell } from "../../../components/dashboard/shell";
import { adminLinks } from "../../../lib/admin-nav";

export default function AdminContractTemplatesPage() {
  return (
    <DashboardShell
      title="Contract templates"
      description="Manage contract templates with full create, update, and delete controls."
      links={adminLinks}
    >
      <LiveAdminContractTemplates />
    </DashboardShell>
  );
}
