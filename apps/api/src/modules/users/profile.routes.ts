import { Router } from "express";
import { adminProfileSchema, agentProfileSchema, customerProfileSchema } from "@migration-agency/shared";
import { validateBody } from "../../common/middleware/validate";
import { requireAuth } from "../auth/auth.middleware";
import { profileService } from "./profile.service";

export const profileRouter = Router();

profileRouter.use(requireAuth);

profileRouter.get("/", async (req, res) => {
  const data = await profileService.getProfile(req.auth!.id);
  res.json({ data });
});

profileRouter.put("/", validateBody(customerProfileSchema.or(agentProfileSchema).or(adminProfileSchema)), async (req, res) => {
  const data = await profileService.updateProfile(req.auth!.id, req.body);
  res.json({ data });
});
