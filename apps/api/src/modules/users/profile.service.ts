import { RoleName } from "@migration-agency/shared";
import { HttpError } from "../../common/http-error";
import { prisma } from "../../lib/prisma";

export const profileService = {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        customerProfile: true,
        agentProfile: true,
        adminProfile: true,
      },
    });

    if (!user) {
      throw new HttpError(404, "Profile not found.");
    }

    if (user.role.name === RoleName.CUSTOMER) return user.customerProfile;
    if (user.role.name === RoleName.AGENT) return user.agentProfile;
    return user.adminProfile;
  },

  async updateProfile(userId: string, input: Record<string, unknown>) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new HttpError(404, "Profile not found.");
    }

    if (user.role.name === RoleName.CUSTOMER) {
      return prisma.customerProfile.update({
        where: { userId },
        data: input,
      });
    }

    if (user.role.name === RoleName.AGENT) {
      return prisma.agentProfile.update({
        where: { userId },
        data: input,
      });
    }

    return prisma.adminProfile.update({
      where: { userId },
      data: input,
    });
  },
};
