import { Router } from "express";
import { contractTemplateSchema, documentTypeSchema, rolePermissionsAssignmentSchema, RoleName } from "@migration-agency/shared";
import { asyncHandler } from "../../common/middleware/async-handler";
import { validateBody } from "../../common/middleware/validate";
import { requireAuth, requireRole } from "../auth/auth.middleware";
import { adminConfigService } from "./admin-config.service";

export const adminConfigRouter = Router();

adminConfigRouter.use(requireAuth, requireRole(RoleName.ADMIN));

adminConfigRouter.get("/roles", asyncHandler(async (_req, res) => {
  const data = await adminConfigService.listRoles();
  res.json({ data });
}));

adminConfigRouter.get("/permissions", asyncHandler(async (_req, res) => {
  const data = await adminConfigService.listPermissions();
  res.json({ data });
}));

adminConfigRouter.get("/roles/:roleId/permissions", asyncHandler(async (req, res) => {
  const data = await adminConfigService.getRolePermissions(String(req.params.roleId));
  res.json({ data });
}));

adminConfigRouter.put(
  "/roles/:roleId/permissions",
  validateBody(rolePermissionsAssignmentSchema),
  asyncHandler(async (req, res) => {
    const data = await adminConfigService.assignRolePermissions(String(req.params.roleId), req.body.permissionIds);
    res.json({ data });
  }),
);

adminConfigRouter.get("/contract-templates", asyncHandler(async (_req, res) => {
  const data = await adminConfigService.listContractTemplates();
  res.json({ data });
}));

adminConfigRouter.get("/contract-templates/:templateId", asyncHandler(async (req, res) => {
  const data = await adminConfigService.getContractTemplate(String(req.params.templateId));
  res.json({ data });
}));

adminConfigRouter.post(
  "/contract-templates",
  validateBody(contractTemplateSchema),
  asyncHandler(async (req, res) => {
    const data = await adminConfigService.createContractTemplate(req.body);
    res.status(201).json({ data });
  }),
);

adminConfigRouter.put(
  "/contract-templates/:templateId",
  validateBody(contractTemplateSchema.partial()),
  asyncHandler(async (req, res) => {
    const data = await adminConfigService.updateContractTemplate(String(req.params.templateId), req.body);
    res.json({ data });
  }),
);

adminConfigRouter.delete("/contract-templates/:templateId", asyncHandler(async (req, res) => {
  await adminConfigService.deleteContractTemplate(String(req.params.templateId));
  res.status(204).send();
}));

adminConfigRouter.get("/document-types", asyncHandler(async (_req, res) => {
  const data = await adminConfigService.listDocumentTypes();
  res.json({ data });
}));

adminConfigRouter.get("/document-types/:documentTypeId", asyncHandler(async (req, res) => {
  const data = await adminConfigService.getDocumentType(String(req.params.documentTypeId));
  res.json({ data });
}));

adminConfigRouter.post(
  "/document-types",
  validateBody(documentTypeSchema),
  asyncHandler(async (req, res) => {
    const data = await adminConfigService.createDocumentType(req.body);
    res.status(201).json({ data });
  }),
);

adminConfigRouter.put(
  "/document-types/:documentTypeId",
  validateBody(documentTypeSchema.partial()),
  asyncHandler(async (req, res) => {
    const data = await adminConfigService.updateDocumentType(String(req.params.documentTypeId), req.body);
    res.json({ data });
  }),
);

adminConfigRouter.delete("/document-types/:documentTypeId", asyncHandler(async (req, res) => {
  await adminConfigService.deleteDocumentType(String(req.params.documentTypeId));
  res.status(204).send();
}));
