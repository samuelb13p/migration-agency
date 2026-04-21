import { DashboardShell } from "../../components/dashboard/shell";
import { LiveProfile } from "../../components/dashboard/live-profile";

export default function ProfilePage() {
  return (
    <DashboardShell
      title="Profile"
      description="Structured customer information used in case processing, checklist logic, and contract generation."
      links={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/profile", label: "My profile" },
        { href: "/notifications", label: "Notifications" },
      ]}
    >
      <LiveProfile />
    </DashboardShell>
  );
}
