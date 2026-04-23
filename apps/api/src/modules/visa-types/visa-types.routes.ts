import { Router } from "express";
import { RoleName, documentTypeSchema, visaTypeRequiredDocumentSchema, visaTypeSchema } from "@migration-agency/shared";
import { asyncHandler } from "../../common/middleware/async-handler";
import { validateBody } from "../../common/middleware/validate";
import { requireAuth, requireRole } from "../auth/auth.middleware";
import { visaTypesService } from "./visa-types.service";

export const visaTypesRouter = Router();

visaTypesRouter.use(requireAuth);

visaTypesRouter.get("/", asyncHandler(async (_req, res) => {
  const data = await visaTypesService.list();
  res.json({ data });
}));

visaTypesRouter.get("/document-types/all", asyncHandler(async (_req, res) => {
  const data = await visaTypesService.listDocumentTypes();
  res.json({ data });
}));

visaTypesRouter.post("/document-types/all", requireRole(RoleName.ADMIN), validateBody(documentTypeSchema), asyncHandler(async (req, res) => {
  const data = await visaTypesService.createDocumentType(req.body);
  res.status(201).json({ data });
}));

visaTypesRouter.get("/:visaTypeId", asyncHandler(async (req, res) => {
  const data = await visaTypesService.getById(String(req.params.visaTypeId));
  res.json({ data });
}));

visaTypesRouter.post("/", requireRole(RoleName.ADMIN), validateBody(visaTypeSchema), asyncHandler(async (req, res) => {
  const data = await visaTypesService.createVisaType(req.body);
  res.status(201).json({ data });
}));

visaTypesRouter.put("/:visaTypeId", requireRole(RoleName.ADMIN), validateBody(visaTypeSchema.partial()), asyncHandler(async (req, res) => {
  const data = await visaTypesService.updateVisaType(String(req.params.visaTypeId), req.body);
  res.json({ data });
}));

visaTypesRouter.delete("/:visaTypeId", requireRole(RoleName.ADMIN), asyncHandler(async (req, res) => {
  await visaTypesService.deleteVisaType(String(req.params.visaTypeId));
  res.status(204).send();
}));

visaTypesRouter.get("/:visaTypeId/required-documents", asyncHandler(async (req, res) => {
  const data = await visaTypesService.listDocumentRules(String(req.params.visaTypeId));
  res.json({ data });
}));

visaTypesRouter.post(
  "/:visaTypeId/required-documents",
  requireRole(RoleName.ADMIN),
  validateBody(visaTypeRequiredDocumentSchema),
  asyncHandler(async (req, res) => {
    const data = await visaTypesService.createDocumentRule(String(req.params.visaTypeId), req.body);
    res.status(201).json({ data });
  }),
);
