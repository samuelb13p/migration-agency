import { AgentCreateVisaCaseForm } from "../../../../components/agent/agent-create-visa-case-form";
import { DashboardShell } from "../../../../components/dashboard/shell";
import { agentLinks } from "../../../../lib/agent-nav";

export default function AgentCreateVisaCasePage() {
  return (
    <DashboardShell
      title="Create visa case"
      description="Create the customer account and visa case together, assign the current agent automatically, and send access details by email."
      links={agentLinks}
    >
      <AgentCreateVisaCaseForm />
    </DashboardShell>
  );
}
