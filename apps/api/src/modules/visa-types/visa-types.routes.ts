import { Router } from "express";
import { RoleName, documentTypeSchema, visaTypeRequiredDocumentSchema, visaTypeSchema } from "@migration-agency/shared";
import { validateBody } from "../../common/middleware/validate";
import { requireAuth, requireRole } from "../auth/auth.middleware";
import { visaTypesService } from "./visa-types.service";

export const visaTypesRouter = Router();

visaTypesRouter.use(requireAuth);

visaTypesRouter.get("/", async (_req, res) => {
  const data = await visaTypesService.list();
  res.json({ data });
});

visaTypesRouter.post("/", requireRole(RoleName.ADMIN), validateBody(visaTypeSchema), async (req, res) => {
  const data = await visaTypesService.createVisaType(req.body);
  res.status(201).json({ data });
});

visaTypesRouter.put("/:visaTypeId", requireRole(RoleName.ADMIN), validateBody(visaTypeSchema.partial()), async (req, res) => {
  const data = await visaTypesService.updateVisaType(String(req.params.visaTypeId), req.body);
  res.json({ data });
});

visaTypesRouter.delete("/:visaTypeId", requireRole(RoleName.ADMIN), async (req, res) => {
  await visaTypesService.deleteVisaType(String(req.params.visaTypeId));
  res.status(204).send();
});

visaTypesRouter.get("/:visaTypeId/required-documents", async (req, res) => {
  const data = await visaTypesService.listDocumentRules(String(req.params.visaTypeId));
  res.json({ data });
});

visaTypesRouter.post(
  "/:visaTypeId/required-documents",
  requireRole(RoleName.ADMIN),
  validateBody(visaTypeRequiredDocumentSchema),
  async (req, res) => {
    const data = await visaTypesService.createDocumentRule(String(req.params.visaTypeId), req.body);
    res.status(201).json({ data });
  },
);

visaTypesRouter.get("/document-types/all", async (_req, res) => {
  const data = await visaTypesService.listDocumentTypes();
  res.json({ data });
});

visaTypesRouter.post("/document-types/all", requireRole(RoleName.ADMIN), validateBody(documentTypeSchema), async (req, res) => {
  const data = await visaTypesService.createDocumentType(req.body);
  res.status(201).json({ data });
});
