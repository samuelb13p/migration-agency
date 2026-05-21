import { RoleName } from "@migration-agency/shared";
import { HttpError } from "../../common/http-error";
import { hashPassword } from "../../lib/password";
import { prisma } from "../../lib/prisma";

type ManagedUserInput = {
  email?: string;
  password?: string;
  roleName?: RoleName;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive?: boolean;
};

const adminUserInclude = {
  role: true,
  customerProfile: true,
  agentProfile: true,
  adminProfile: true,
} as const;

async function getRoleByName(roleName: RoleName, tx: any) {
  const role = await tx.role.findUnique({ where: { name: roleName } });
  if (!role) {
    throw new HttpError(422, "Role does not exist.");
  }

  return role;
}

async function getManagedUserOrThrow(userId: string, tx: any = prisma) {
  const user = await tx.user.findUnique({
    where: { id: userId },
    include: {
      customerProfile: {
        include: {
          visaCases: true,
        },
      },
      agentProfile: {
        include: {
          assignedVisaCases: true,
          reviewedDocuments: true,
        },
      },
      adminProfile: true,
      uploadedDocuments: true,
      generatedContracts: true,
      role: true,
    },
  });

  if (!user) {
    throw new HttpError(404, "User not found.");
  }

  return user;
}

function getCurrentRoleName(user: Awaited<ReturnType<typeof getManagedUserOrThrow>>) {
  if (user.customerProfile) return RoleName.CUSTOMER;
  if (user.agentProfile) return RoleName.AGENT;
  if (user.adminProfile) return RoleName.ADMIN;
  return user.role.name as RoleName;
}

function assertRoleTransitionAllowed(
  user: Awaited<ReturnType<typeof getManagedUserOrThrow>>,
  nextRoleName: RoleName,
) {
  const currentRoleName = getCurrentRoleName(user);
  if (currentRoleName === nextRoleName) return;

  if (user.customerProfile?.visaCases.length) {
    throw new HttpError(409, "Cannot change role for a customer with existing visa cases.");
  }

  if (user.agentProfile?.assignedVisaCases.length || user.agentProfile?.reviewedDocuments.length) {
    throw new HttpError(409, "Cannot change role for an agent with assigned cases or document reviews.");
  }
}

async function syncProfiles(
  tx: any,
  user: Awaited<ReturnType<typeof getManagedUserOrThrow>>,
  input: ManagedUserInput,
  roleName: RoleName,
) {
  const firstName = input.firstName ?? user.customerProfile?.firstName ?? user.agentProfile?.firstName ?? user.adminProfile?.firstName ?? "";
  const lastName = input.lastName ?? user.customerProfile?.lastName ?? user.agentProfile?.lastName ?? user.adminProfile?.lastName ?? "";
  const phone = input.phone ?? user.agentProfile?.phone ?? user.customerProfile?.phone ?? undefined;

  if (roleName === RoleName.CUSTOMER) {
    await tx.agentProfile.deleteMany({ where: { userId: user.id } });
    await tx.adminProfile.deleteMany({ where: { userId: user.id } });
    if (user.customerProfile) {
      await tx.customerProfile.update({
        where: { userId: user.id },
        data: {
          firstName,
          lastName,
          phone,
        },
      });
    } else {
      await tx.customerProfile.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          phone,
        },
      });
    }
    return;
  }

  if (roleName === RoleName.AGENT) {
    await tx.customerProfile.deleteMany({ where: { userId: user.id } });
    await tx.adminProfile.deleteMany({ where: { userId: user.id } });
    if (user.agentProfile) {
      await tx.agentProfile.update({
        where: { userId: user.id },
        data: {
          firstName,
          lastName,
          phone,
        },
      });
    } else {
      await tx.agentProfile.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          phone,
        },
      });
    }
    return;
  }

  await tx.customerProfile.deleteMany({ where: { userId: user.id } });
  await tx.agentProfile.deleteMany({ where: { userId: user.id } });
  if (user.adminProfile) {
    await tx.adminProfile.update({
      where: { userId: user.id },
      data: {
        firstName,
        lastName,
      },
    });
  } else {
    await tx.adminProfile.create({
      data: {
        userId: user.id,
        firstName,
        lastName,
      },
    });
  }
}

async function createProfilesForNewUser(
  tx: any,
  userId: string,
  input: Required<Pick<ManagedUserInput, "firstName" | "lastName">> & ManagedUserInput,
  roleName: RoleName,
) {
  if (roleName === RoleName.CUSTOMER) {
    await tx.customerProfile.create({
      data: {
        userId,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
      },
    });
    return;
  }

  if (roleName === RoleName.AGENT) {
    await tx.agentProfile.create({
      data: {
        userId,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
      },
    });
    return;
  }

  await tx.adminProfile.create({
    data: {
      userId,
      firstName: input.firstName,
      lastName: input.lastName,
    },
  });
}

export const adminUsersService = {
  list() {
    return prisma.user.findMany({
      include: adminUserInclude,
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: adminUserInclude,
    });

    if (!user) {
      throw new HttpError(404, "User not found.");
    }

    return user;
  },

  async create(input: Required<Pick<ManagedUserInput, "email" | "password" | "roleName" | "firstName" | "lastName">> & ManagedUserInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new HttpError(409, "A user with this email already exists.");
    }

    return prisma.$transaction(async (tx: any) => {
      const role = await getRoleByName(input.roleName, tx);
      const user = await tx.user.create({
        data: {
          email: input.email,
          passwordHash: await hashPassword(input.password),
          roleId: role.id,
          isActive: input.isActive ?? true,
        },
      });

      await createProfilesForNewUser(tx, user.id, input, input.roleName);

      return tx.user.findUniqueOrThrow({
        where: { id: user.id },
        include: adminUserInclude,
      });
    });
  },

  async update(userId: string, input: ManagedUserInput) {
    return prisma.$transaction(async (tx: any) => {
      const user = await getManagedUserOrThrow(userId, tx);
      const nextRoleName = input.roleName ?? getCurrentRoleName(user);

      assertRoleTransitionAllowed(user, nextRoleName);

      if (input.email && input.email !== user.email) {
        const existing = await tx.user.findUnique({ where: { email: input.email } });
        if (existing && existing.id !== userId) {
          throw new HttpError(409, "A user with this email already exists.");
        }
      }

      const role = await getRoleByName(nextRoleName, tx);

      await tx.user.update({
        where: { id: userId },
        data: {
          email: input.email,
          roleId: role.id,
          isActive: input.isActive,
          passwordHash: input.password ? await hashPassword(input.password) : undefined,
        },
      });

      if (input.firstName || input.lastName || input.phone || input.roleName) {
        await syncProfiles(tx, user, input, nextRoleName);
      }

      return tx.user.findUniqueOrThrow({
        where: { id: userId },
        include: adminUserInclude,
      });
    });
  },

  async updateStatus(userId: string, isActive: boolean) {
    await getManagedUserOrThrow(userId);
    return prisma.user.update({
      where: { id: userId },
      data: { isActive },
      include: adminUserInclude,
    });
  },

  async delete(userId: string) {
    const user = await getManagedUserOrThrow(userId);

    if (user.customerProfile?.visaCases.length) {
      throw new HttpError(409, "Cannot delete a user with existing visa cases.");
    }

    if (user.agentProfile?.assignedVisaCases.length || user.agentProfile?.reviewedDocuments.length) {
      throw new HttpError(409, "Cannot delete a user with assigned cases or document reviews.");
    }

    if (user.uploadedDocuments.length || user.generatedContracts.length) {
      throw new HttpError(409, "Cannot delete a user with uploaded documents or generated contracts.");
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.refreshSession.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });
  },
};
