import type { NextFunction, Request, Response } from "express";
import { RoleName } from "@migration-agency/shared";
import { HttpError } from "../../common/http-error";
import { verifyAccessToken } from "../../lib/tokens";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    throw new HttpError(401, "Authentication is required.");
  }

  req.auth = verifyAccessToken(token);
  next();
}

export function requireRole(...roles: RoleName[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      throw new HttpError(401, "Authentication is required.");
    }

    if (!roles.includes(req.auth.roleName)) {
      throw new HttpError(403, "You do not have permission for this action.");
    }

    next();
  };
}
