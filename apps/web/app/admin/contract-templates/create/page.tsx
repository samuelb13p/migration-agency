import { ContractTemplateForm } from "../../../../components/admin/contract-template-form";
import { DashboardShell } from "../../../../components/dashboard/shell";
import { adminLinks } from "../../../../lib/admin-nav";

export default function AdminCreateContractTemplatePage() {
  return (
    <DashboardShell
      title="Create contract template"
      description="Create a reusable contract template and keep versioned template records easy to maintain."
      links={adminLinks}
    >
      <ContractTemplateForm mode="create" />
    </DashboardShell>
  );
}
