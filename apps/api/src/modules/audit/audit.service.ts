import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export async function writeAuditLog(input: {
  actorUserId?: string;
  visaCaseId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId,
      visaCaseId: input.visaCaseId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
