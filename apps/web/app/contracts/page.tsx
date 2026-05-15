import { DashboardShell } from "../../components/dashboard/shell";
import { CustomerProfileGate } from "../../components/customer/customer-profile-gate";
import { LiveContracts } from "../../components/dashboard/live-contracts";
import { customerLinks } from "../../lib/customer-nav";

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ sign?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const forceSignature = resolvedSearchParams.sign === "1";

  return (
    <DashboardShell
      title="Contracts"
      description="Server-generated PDF contracts remain private and are available only to authorized visa case participants."
      links={customerLinks}
      hideNavigation={forceSignature}
    >
      <CustomerProfileGate>
        <LiveContracts />
      </CustomerProfileGate>
    </DashboardShell>
  );
}
