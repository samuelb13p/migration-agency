import cors from "cors";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { errorHandler } from "./common/middleware/error-handler";
import { env } from "./config/env";
import { authRouter } from "./modules/auth/auth.routes";
import { adminConfigRouter } from "./modules/admin/admin-config.routes";
import { adminUsersRouter } from "./modules/admin/admin-users.routes";
import { casesRouter } from "./modules/cases/cases.routes";
import { contractsRouter } from "./modules/contracts/contracts.routes";
import { notificationsRouter } from "./modules/notifications/notifications.routes";
import { reviewsRouter } from "./modules/reviews/reviews.routes";
import { uploadsRouter } from "./modules/uploads/uploads.routes";
import { profileRouter } from "./modules/users/profile.routes";
import { requiredDocumentsRouter } from "./modules/visa-types/required-documents.routes";
import { visaTypesRouter } from "./modules/visa-types/visa-types.routes";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.APP_URL, credentials: true }));
  app.use(express.json());
  app.use(pinoHttp());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/admin", adminUsersRouter);
  app.use("/api/admin", adminConfigRouter);
  app.use("/api/profile", profileRouter);
  app.use("/api/visa-types", visaTypesRouter);
  app.use("/api/required-documents", requiredDocumentsRouter);
  app.use("/api", casesRouter);
  app.use("/api", uploadsRouter);
  app.use("/api", reviewsRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api", contractsRouter);
  app.use(errorHandler);

  return app;
}
