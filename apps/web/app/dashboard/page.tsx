import { DashboardShell } from "../../components/dashboard/shell";
import { LiveDashboard } from "../../components/dashboard/live-dashboard";

export default function CustomerDashboardPage() {
  return (
    <DashboardShell
      title="Customer workspace"
      description="Track visa case readiness, missing files, review results, and contract availability from a single secure dashboard."
      links={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/profile", label: "My profile" },
        { href: "/notifications", label: "Notifications" },
        { href: "/contracts", label: "Contracts" },
      ]}
    >
      <LiveDashboard />
    </DashboardShell>
  );
}
