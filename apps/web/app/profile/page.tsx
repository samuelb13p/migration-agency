import { DashboardShell } from "../../components/dashboard/shell";
import { LiveProfile } from "../../components/dashboard/live-profile";
import { customerLinks } from "../../lib/customer-nav";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ complete?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const forceCompletion = resolvedSearchParams.complete === "1";

  return (
    <DashboardShell
      title="Profile"
      description="Structured customer information used in case processing, checklist logic, and contract generation."
      links={customerLinks}
      hideNavigation={forceCompletion}
    >
      <LiveProfile />
    </DashboardShell>
  );
}
