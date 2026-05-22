import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  API_URL: z.string().url().default("http://localhost:4000"),
  EMAIL_SERVICE_API_URL: z.string().url().default("http://localhost:5000"),
  AGENCY_NAME: z.string().default("Migration Agency"),
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  LOCAL_STORAGE_ROOT: z.string().default("./storage/private"),
  SIGNED_URL_SECRET: z.string().min(16),
  MAX_FILE_SIZE_MB: z.coerce.number().default(10),
  ALLOWED_FILE_TYPES: z.string().default("application/pdf,image/jpeg,image/png"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
});

export const env = envSchema.parse(process.env);

export const storageConfig = {
  root: env.LOCAL_STORAGE_ROOT,
  allowedMimeTypes: env.ALLOWED_FILE_TYPES.split(",").map((value) => value.trim()),
  maxFileSizeBytes: env.MAX_FILE_SIZE_MB * 1024 * 1024,
};
