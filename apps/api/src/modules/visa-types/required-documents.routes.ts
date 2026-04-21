import { Router } from "express";
import { RoleName, documentTypeSchema, visaTypeRequiredDocumentSchema } from "@migration-agency/shared";
import { validateBody } from "../../common/middleware/validate";
import { requireAuth, requireRole } from "../auth/auth.middleware";
import { visaTypesService } from "./visa-types.service";

export const requiredDocumentsRouter = Router();

requiredDocumentsRouter.use(requireAuth, requireRole(RoleName.ADMIN));

requiredDocumentsRouter.put("/:requiredDocumentId", validateBody(visaTypeRequiredDocumentSchema.partial()), async (req, res) => {
  const data = await visaTypesService.updateDocumentRule(String(req.params.requiredDocumentId), req.body);
  res.json({ data });
});

requiredDocumentsRouter.delete("/:requiredDocumentId", async (req, res) => {
  await visaTypesService.deleteDocumentRule(String(req.params.requiredDocumentId));
  res.status(204).send();
});

requiredDocumentsRouter.put("/document-types/:documentTypeId", validateBody(documentTypeSchema.partial()), async (req, res) => {
  const data = await visaTypesService.updateDocumentType(String(req.params.documentTypeId), req.body);
  res.json({ data });
});
