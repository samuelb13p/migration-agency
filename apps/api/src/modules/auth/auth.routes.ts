import { Router } from "express";
import { loginSchema, registerSchema } from "@migration-agency/shared";
import { validateBody } from "../../common/middleware/validate";
import { authService } from "./auth.service";
import { requireAuth } from "./auth.middleware";

export const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), async (req, res) => {
  const data = await authService.register(req.body);
  res.status(201).json({ data });
});

authRouter.post("/login", validateBody(loginSchema), async (req, res) => {
  const data = await authService.login(req.body);
  res.json({ data });
});

authRouter.post("/refresh", async (req, res) => {
  const data = await authService.refresh(String(req.body.refreshToken ?? ""));
  res.json({ data });
});

authRouter.post("/logout", async (req, res) => {
  await authService.logout(String(req.body.refreshToken ?? ""));
  res.status(204).send();
});

authRouter.get("/me", requireAuth, async (req, res) => {
  res.json({ data: req.auth });
});
