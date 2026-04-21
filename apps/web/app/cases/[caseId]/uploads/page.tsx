import { redirect } from "next/navigation";

export default async function LegacyCaseUploadsPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  redirect(`/visa-cases/${caseId}/uploads`);
}
