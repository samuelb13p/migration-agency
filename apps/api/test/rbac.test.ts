import { describe, expect, it } from "vitest";
import { RoleName } from "@migration-agency/shared";
import { HttpError } from "../src/common/http-error";

function assertCaseAccess(
  authUser: { id: string; role: RoleName },
  record: { customerId: string; assignedAgentId?: string | null },
) {
  if (authUser.role === RoleName.ADMIN) return true;
  if (authUser.role === RoleName.CUSTOMER && record.customerId === authUser.id) return true;
  if (authUser.role === RoleName.AGENT && record.assignedAgentId === authUser.id) return true;
  throw new HttpError(403, "You do not have access to this case.");
}

describe("RBAC ownership rules", () => {
  it("allows customers to access their own case", () => {
    expect(assertCaseAccess({ id: "u1", role: RoleName.CUSTOMER }, { customerId: "u1" })).toBe(true);
  });

  it("blocks agents from unassigned cases", () => {
    expect(() =>
      assertCaseAccess(
        { id: "agent_1", role: RoleName.AGENT },
        { customerId: "customer_1", assignedAgentId: "agent_2" },
      ),
    ).toThrow(HttpError);
  });
});
