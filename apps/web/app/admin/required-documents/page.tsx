import { DashboardShell } from "../../../components/dashboard/shell";
import { LiveAdminRequiredDocuments } from "../../../components/dashboard/live-admin-required-documents";
import { adminLinks } from "../../../lib/admin-nav";

export default function AdminRequiredDocumentsPage() {
  return (
    <DashboardShell
      title="Required document rules"
      description="Manage checklist templates by visa type with ordering, requirement flags, and descriptive guidance."
      links={adminLinks}
    >
      <LiveAdminRequiredDocuments />
    </DashboardShell>
  );
}
