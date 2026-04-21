import { Router } from "express";
import { reviewUploadedDocumentSchema } from "@migration-agency/shared";
import { validateBody } from "../../common/middleware/validate";
import { requireAuth } from "../auth/auth.middleware";
import { reviewsService } from "./reviews.service";

export const reviewsRouter = Router();

reviewsRouter.use(requireAuth);

reviewsRouter.post("/uploads/:uploadId/review", validateBody(reviewUploadedDocumentSchema), async (req, res) => {
  const data = await reviewsService.review(String(req.params.uploadId), req.auth!, req.body);
  res.status(201).json({ data });
});
