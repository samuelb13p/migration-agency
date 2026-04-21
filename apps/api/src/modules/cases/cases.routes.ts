import { Router } from "express";
import { createVisaCaseSchema, updateVisaCaseSchema } from "@migration-agency/shared";
import { validateBody } from "../../common/middleware/validate";
import { requireAuth } from "../auth/auth.middleware";
import { casesService } from "./cases.service";

export const casesRouter = Router();

casesRouter.use(requireAuth);

casesRouter.post(["/cases", "/visa-cases"], validateBody(createVisaCaseSchema), async (req, res) => {
  const data = await casesService.create(req.auth!, req.body);
  res.status(201).json({ data });
});

casesRouter.get(["/cases", "/visa-cases"], async (req, res) => {
  const data = await casesService.list(req.auth!);
  res.json({ data });
});

casesRouter.get(["/cases/:caseId", "/visa-cases/:caseId"], async (req, res) => {
  const data = await casesService.getById(String(req.params.caseId), req.auth!);
  res.json({ data });
});

casesRouter.patch(["/cases/:caseId", "/visa-cases/:caseId"], validateBody(updateVisaCaseSchema), async (req, res) => {
  const data = await casesService.update(String(req.params.caseId), req.auth!, req.body);
  res.json({ data });
});

casesRouter.get(["/cases/:caseId/checklist", "/visa-cases/:caseId/checklist"], async (req, res) => {
  const data = await casesService.getChecklist(String(req.params.caseId), req.auth!);
  res.json({ data });
});
