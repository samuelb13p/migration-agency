import { redirect } from "next/navigation";

export default async function AgentCaseDetailsPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  redirect(`/agent/cases/${caseId}/review`);
}
