import { VisaTypeForm } from "../../../../components/admin/visa-type-form";
import { DashboardShell } from "../../../../components/dashboard/shell";
import { adminLinks } from "../../../../lib/admin-nav";

export default async function AdminEditVisaTypePage({ params }: { params: Promise<{ visaTypeId: string }> }) {
  const { visaTypeId } = await params;

  return (
    <DashboardShell
      title="Edit visa type"
      description="Update the visa type details and manage the required document assignments in one place."
      links={adminLinks}
    >
      <VisaTypeForm mode="edit" visaTypeId={visaTypeId} />
    </DashboardShell>
  );
}
