import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { AuthenticatedUser } from "../common/types/auth";

type TokenPayload = AuthenticatedUser;

export function signAccessToken(user: AuthenticatedUser) {
  return jwt.sign(user, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function signRefreshToken(user: AuthenticatedUser, sessionId: string) {
  return jwt.sign({ ...user, sessionId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload & { sessionId: string };
}
