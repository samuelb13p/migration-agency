import { RoleName } from "@migration-agency/shared";
import { HttpError } from "../../common/http-error";
import { comparePassword, hashPassword } from "../../lib/password";
import { prisma } from "../../lib/prisma";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/tokens";
import { writeAuditLog } from "../audit/audit.service";

function toAuthUser(user: { id: string; email: string; roleId: string; role: { name: string } }) {
  return {
    id: user.id,
    email: user.email,
    roleId: user.roleId,
    roleName: user.role.name as RoleName,
  };
}

export const authService = {
  async register(input: { email: string; password: string; firstName: string; lastName: string; roleName: RoleName }) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new HttpError(409, "An account with this email already exists.");
    }

    const role = await prisma.role.findUnique({ where: { name: input.roleName } });
    if (!role) {
      throw new HttpError(422, "The selected role does not exist.");
    }

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash: await hashPassword(input.password),
        roleId: role.id,
        customerProfile:
          input.roleName === RoleName.CUSTOMER
            ? {
                create: {
                  firstName: input.firstName,
                  lastName: input.lastName,
                },
              }
            : undefined,
        agentProfile:
          input.roleName === RoleName.AGENT
            ? {
                create: {
                  firstName: input.firstName,
                  lastName: input.lastName,
                },
              }
            : undefined,
        adminProfile:
          input.roleName === RoleName.ADMIN
            ? {
                create: {
                  firstName: input.firstName,
                  lastName: input.lastName,
                },
              }
            : undefined,
      },
      include: { role: true },
    });

    const session = await prisma.refreshSession.create({
      data: {
        userId: user.id,
        refreshTokenHash: "",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const authUser = toAuthUser(user);
    const refreshToken = signRefreshToken(authUser, session.id);

    await prisma.refreshSession.update({
      where: { id: session.id },
      data: { refreshTokenHash: await hashPassword(refreshToken) },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "auth.register",
      entityType: "User",
      entityId: user.id,
    });

    return {
      user: authUser,
      tokens: {
        accessToken: signAccessToken(authUser),
        refreshToken,
      },
    };
  },

  async login(input: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { role: true },
    });

    if (!user || !(await comparePassword(input.password, user.passwordHash))) {
      throw new HttpError(401, "Invalid credentials.");
    }

    const authUser = toAuthUser(user);
    const session = await prisma.refreshSession.create({
      data: {
        userId: user.id,
        refreshTokenHash: "",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const refreshToken = signRefreshToken(authUser, session.id);
    await prisma.refreshSession.update({
      where: { id: session.id },
      data: { refreshTokenHash: await hashPassword(refreshToken) },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await writeAuditLog({
      actorUserId: user.id,
      action: "auth.login",
      entityType: "RefreshSession",
      entityId: session.id,
    });

    return {
      user: authUser,
      tokens: {
        accessToken: signAccessToken(authUser),
        refreshToken,
      },
    };
  },

  async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    const session = await prisma.refreshSession.findUnique({
      where: { id: payload.sessionId },
      include: { user: { include: { role: true } } },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new HttpError(401, "Refresh session is invalid.");
    }

    if (!(await comparePassword(refreshToken, session.refreshTokenHash))) {
      throw new HttpError(401, "Refresh token is invalid.");
    }

    const authUser = toAuthUser(session.user);
    const nextRefreshToken = signRefreshToken(authUser, session.id);

    await prisma.refreshSession.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: await hashPassword(nextRefreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      user: authUser,
      tokens: {
        accessToken: signAccessToken(authUser),
        refreshToken: nextRefreshToken,
      },
    };
  },

  async logout(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    await prisma.refreshSession.update({
      where: { id: payload.sessionId },
      data: { revokedAt: new Date() },
    });
  },
};
