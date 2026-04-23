import { DocumentTypeForm } from "../../../../components/admin/document-type-form";
import { DashboardShell } from "../../../../components/dashboard/shell";
import { adminLinks } from "../../../../lib/admin-nav";

export default async function AdminEditDocumentTypePage({ params }: { params: Promise<{ documentTypeId: string }> }) {
  const { documentTypeId } = await params;

  return (
    <DashboardShell
      title="Edit document type"
      description="Update the document type details and upload restrictions, then save."
      links={adminLinks}
    >
      <DocumentTypeForm mode="edit" documentTypeId={documentTypeId} />
    </DashboardShell>
  );
}
