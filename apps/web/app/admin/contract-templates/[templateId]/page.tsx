import { ContractTemplateForm } from "../../../../components/admin/contract-template-form";
import { DashboardShell } from "../../../../components/dashboard/shell";
import { adminLinks } from "../../../../lib/admin-nav";

export default async function AdminEditContractTemplatePage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;

  return (
    <DashboardShell
      title="Edit contract template"
      description="Update the template body, version, and active state, then save the record."
      links={adminLinks}
    >
      <ContractTemplateForm mode="edit" templateId={templateId} />
    </DashboardShell>
  );
}
