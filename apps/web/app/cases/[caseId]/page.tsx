import { redirect } from "next/navigation";

export default async function LegacyCaseDetailsPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  redirect(`/visa-cases/${caseId}`);
}
