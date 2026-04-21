import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { notificationsService } from "./notifications.service";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get("/", async (req, res) => {
  const data = await notificationsService.list(req.auth!.id);
  res.json({ data });
});

notificationsRouter.patch("/:notificationId/read", async (req, res) => {
  const data = await notificationsService.markRead(req.params.notificationId, req.auth!.id);
  res.json({ data });
});
