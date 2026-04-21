import { RoleName } from "@migration-agency/shared";
import type { AuthenticatedUser } from "../../common/types/auth";
import { HttpError } from "../../common/http-error";
import { prisma } from "../../lib/prisma";

export async function ensureCaseAccess(caseId: string, user: AuthenticatedUser) {
  const record = await prisma.visaCase.findUnique({
    where: { id: caseId },
    include: {
      visaType: true,
      uploadedDocuments: true,
      customerProfile: true,
      agentProfile: true,
    },
  });

  if (!record) {
    throw new HttpError(404, "Visa case not found.");
  }

  if (user.roleName === RoleName.ADMIN) return record;

  if (user.roleName === RoleName.CUSTOMER) {
    const customerProfile = await prisma.customerProfile.findUnique({ where: { userId: user.id } });
    if (customerProfile && record.customerProfileId === customerProfile.id) return record;
  }

  if (user.roleName === RoleName.AGENT) {
    const agentProfile = await prisma.agentProfile.findUnique({ where: { userId: user.id } });
    if (agentProfile && record.agentProfileId === agentProfile.id) return record;
  }

  throw new HttpError(403, "You do not have access to this visa case.");
}
