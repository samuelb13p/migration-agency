import { DashboardShell } from "../../../components/dashboard/shell";
import { LiveAdminVisaTypes } from "../../../components/dashboard/live-admin-visa-types";
import { adminLinks } from "../../../lib/admin-nav";

export default function AdminVisaTypesPage() {
  return (
    <DashboardShell
      title="Visa type management"
      description="Configure visa programs and evolve checklist logic without changing case records."
      links={adminLinks}
    >
      <LiveAdminVisaTypes />
    </DashboardShell>
  );
}
