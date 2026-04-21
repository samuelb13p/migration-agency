import { LiveAdminDocumentTypes } from "../../../components/admin/live-admin-document-types";
import { DashboardShell } from "../../../components/dashboard/shell";
import { adminLinks } from "../../../lib/admin-nav";

export default function AdminDocumentTypesPage() {
  return (
    <DashboardShell
      title="Document types"
      description="Manage document types with full CRUD and keep track of where each one is assigned."
      links={adminLinks}
    >
      <LiveAdminDocumentTypes />
    </DashboardShell>
  );
}
