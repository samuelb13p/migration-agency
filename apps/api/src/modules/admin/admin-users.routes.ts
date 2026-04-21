import { Router } from "express";
import { adminCreateUserSchema, adminUpdateUserSchema, adminUpdateUserStatusSchema, RoleName } from "@migration-agency/shared";
import { asyncHandler } from "../../common/middleware/async-handler";
import { validateBody } from "../../common/middleware/validate";
import { requireAuth, requireRole } from "../auth/auth.middleware";
import { adminUsersService } from "./admin-users.service";

export const adminUsersRouter = Router();

adminUsersRouter.use(requireAuth, requireRole(RoleName.ADMIN));

adminUsersRouter.get("/users", asyncHandler(async (_req, res) => {
  const data = await adminUsersService.list();
  res.json({ data });
}));

adminUsersRouter.get("/users/:userId", asyncHandler(async (req, res) => {
  const data = await adminUsersService.getById(String(req.params.userId));
  res.json({ data });
}));

adminUsersRouter.post("/users", validateBody(adminCreateUserSchema), asyncHandler(async (req, res) => {
  const data = await adminUsersService.create(req.body);
  res.status(201).json({ data });
}));

adminUsersRouter.put("/users/:userId", validateBody(adminUpdateUserSchema), asyncHandler(async (req, res) => {
  const data = await adminUsersService.update(String(req.params.userId), req.body);
  res.json({ data });
}));

adminUsersRouter.patch("/users/:userId/role", asyncHandler(async (req, res) => {
  const data = await adminUsersService.update(String(req.params.userId), { roleName: req.body.roleName ?? req.body.role });
  res.json({ data });
}));

adminUsersRouter.patch("/users/:userId/status", validateBody(adminUpdateUserStatusSchema), asyncHandler(async (req, res) => {
  const data = await adminUsersService.updateStatus(String(req.params.userId), req.body.isActive);
  res.json({ data });
}));

adminUsersRouter.delete("/users/:userId", asyncHandler(async (req, res) => {
  await adminUsersService.delete(String(req.params.userId));
  res.status(204).send();
}));
