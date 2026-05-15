import { Router } from "express";
import { RoleName, createAgentVisaCaseSchema, createVisaCaseSchema, updateVisaCaseSchema } from "@migration-agency/shared";
import { asyncHandler } from "../../common/middleware/async-handler";
import { validateBody } from "../../common/middleware/validate";
import { requireAuth, requireRole } from "../auth/auth.middleware";
import { casesService } from "./cases.service";

export const casesRouter = Router();

casesRouter.use(requireAuth);

casesRouter.post("/agent/visa-cases", requireRole(RoleName.AGENT, RoleName.ADMIN), validateBody(createAgentVisaCaseSchema), asyncHandler(async (req, res) => {
  const data = await casesService.createByAgent(req.auth!, req.body);
  res.status(201).json({ data });
}));

casesRouter.post(["/cases", "/visa-cases"], validateBody(createVisaCaseSchema), asyncHandler(async (req, res) => {
  const data = await casesService.create(req.auth!, req.body);
  res.status(201).json({ data });
}));

casesRouter.get(["/cases", "/visa-cases"], asyncHandler(async (req, res) => {
  const data = await casesService.list(req.auth!);
  res.json({ data });
}));

casesRouter.get(["/cases/:caseId", "/visa-cases/:caseId"], asyncHandler(async (req, res) => {
  const data = await casesService.getById(String(req.params.caseId), req.auth!);
  res.json({ data });
}));

casesRouter.patch(["/cases/:caseId", "/visa-cases/:caseId"], validateBody(updateVisaCaseSchema), asyncHandler(async (req, res) => {
  const data = await casesService.update(String(req.params.caseId), req.auth!, req.body);
  res.json({ data });
}));

casesRouter.get(["/cases/:caseId/checklist", "/visa-cases/:caseId/checklist"], asyncHandler(async (req, res) => {
  const data = await casesService.getChecklist(String(req.params.caseId), req.auth!);
  res.json({ data });
}));
