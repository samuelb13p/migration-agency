import { DocumentTypeForm } from "../../../../components/admin/document-type-form";
import { DashboardShell } from "../../../../components/dashboard/shell";
import { adminLinks } from "../../../../lib/admin-nav";

export default function AdminCreateDocumentTypePage() {
  return (
    <DashboardShell
      title="Create document type"
      description="Create a new document type with extension and file-size rules for uploads."
      links={adminLinks}
    >
      <DocumentTypeForm mode="create" />
    </DashboardShell>
  );
}
