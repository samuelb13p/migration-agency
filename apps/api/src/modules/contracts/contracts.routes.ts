import { Router } from "express";
import { RoleName, acceptContractSchema } from "@migration-agency/shared";
import { asyncHandler } from "../../common/middleware/async-handler";
import { validateBody } from "../../common/middleware/validate";
import { requireAuth, requireRole } from "../auth/auth.middleware";
import { contractsService } from "./contracts.service";

export const contractsRouter = Router();

contractsRouter.get("/contracts/download/:token", asyncHandler(async (req, res) => {
  const result = await contractsService.downloadByToken(String(req.params.token));
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${result.contract.id}.pdf"`);
  res.send(result.file);
}));

contractsRouter.use(requireAuth);

contractsRouter.get("/contract-templates/active", requireRole(RoleName.AGENT, RoleName.ADMIN), asyncHandler(async (_req, res) => {
  const data = await contractsService.listActiveTemplates();
  res.json({ data });
}));

contractsRouter.post(["/cases/:caseId/contracts", "/visa-cases/:caseId/contracts"], asyncHandler(async (req, res) => {
  const data = await contractsService.generate(String(req.params.caseId), req.auth!);
  res.status(201).json({ data });
}));

contractsRouter.get(["/cases/:caseId/contracts", "/visa-cases/:caseId/contracts"], asyncHandler(async (req, res) => {
  const data = await contractsService.list(String(req.params.caseId), req.auth!);
  res.json({ data });
}));

contractsRouter.post("/contracts/:contractId/accept", validateBody(acceptContractSchema), asyncHandler(async (req, res) => {
  const data = await contractsService.accept(String(req.params.contractId), req.auth!);
  res.json({ data });
}));

contractsRouter.get("/contracts/:contractId/download-token", asyncHandler(async (req, res) => {
  const data = await contractsService.getDownloadToken(String(req.params.contractId), req.auth!);
  res.json({ data });
}));
