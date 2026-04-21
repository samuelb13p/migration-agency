import type { RoleName } from "@migration-agency/shared";

export type AuthenticatedUser = {
  id: string;
  email: string;
  roleId: string;
  roleName: RoleName;
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthenticatedUser;
    }
  }
}
