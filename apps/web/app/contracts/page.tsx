import { DashboardShell } from "../../components/dashboard/shell";
import { LiveContracts } from "../../components/dashboard/live-contracts";

export default function ContractsPage() {
  return (
    <DashboardShell
      title="Contracts"
      description="Server-generated PDF contracts remain private and are available only to authorized visa case participants."
      links={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/profile", label: "My profile" },
        { href: "/contracts", label: "Contracts" },
      ]}
    >
      <LiveContracts />
    </DashboardShell>
  );
}
