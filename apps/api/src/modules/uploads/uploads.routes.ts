import multer from "multer";
import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { uploadsService } from "./uploads.service";

const upload = multer({ storage: multer.memoryStorage() });

export const uploadsRouter = Router();

uploadsRouter.use(requireAuth);

uploadsRouter.post(["/cases/:caseId/uploads", "/visa-cases/:caseId/uploads"], upload.single("file"), async (req, res) => {
  const data = await uploadsService.upload(
    String(req.params.caseId),
    String(req.body.documentTypeId ?? req.body.requiredDocumentId ?? ""),
    req.file,
    req.auth!,
  );

  res.status(201).json({ data });
});

uploadsRouter.get(["/cases/:caseId/uploads", "/visa-cases/:caseId/uploads"], async (req, res) => {
  const data = await uploadsService.list(String(req.params.caseId), req.auth!);
  res.json({ data });
});

uploadsRouter.get("/uploads/:uploadId/download-token", async (req, res) => {
  const data = await uploadsService.getDownloadToken(String(req.params.uploadId), req.auth!);
  res.json({ data });
});

uploadsRouter.get("/uploads/download/:token", async (req, res) => {
  const result = await uploadsService.downloadByToken(String(req.params.token));
  res.setHeader("Content-Type", result.upload.mimeType);
  res.setHeader("Content-Disposition", `attachment; filename="${result.upload.originalFileName}"`);
  res.send(result.file);
});
