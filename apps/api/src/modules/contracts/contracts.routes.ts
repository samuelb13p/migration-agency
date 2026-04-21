import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { contractsService } from "./contracts.service";

export const contractsRouter = Router();

contractsRouter.use(requireAuth);

contractsRouter.post(["/cases/:caseId/contracts", "/visa-cases/:caseId/contracts"], async (req, res) => {
  const data = await contractsService.generate(String(req.params.caseId), req.auth!);
  res.status(201).json({ data });
});

contractsRouter.get(["/cases/:caseId/contracts", "/visa-cases/:caseId/contracts"], async (req, res) => {
  const data = await contractsService.list(String(req.params.caseId), req.auth!);
  res.json({ data });
});

contractsRouter.get("/contracts/:contractId/download-token", async (req, res) => {
  const data = await contractsService.getDownloadToken(req.params.contractId, req.auth!);
  res.json({ data });
});

contractsRouter.get("/contracts/download/:token", async (req, res) => {
  const result = await contractsService.downloadByToken(req.params.token);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${result.contract.id}.pdf"`);
  res.send(result.file);
});
