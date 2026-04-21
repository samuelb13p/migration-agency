import { redirect } from "next/navigation";

export default async function LegacyCaseChecklistPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  redirect(`/visa-cases/${caseId}/checklist`);
}
