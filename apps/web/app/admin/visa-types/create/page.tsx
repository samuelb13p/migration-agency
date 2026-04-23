import { VisaTypeForm } from "../../../../components/admin/visa-type-form";
import { DashboardShell } from "../../../../components/dashboard/shell";
import { adminLinks } from "../../../../lib/admin-nav";

export default function AdminCreateVisaTypePage() {
  return (
    <DashboardShell
      title="Create visa type"
      description="Create a visa type first, then assign its required document types from the edit view."
      links={adminLinks}
    >
      <VisaTypeForm mode="create" />
    </DashboardShell>
  );
}
