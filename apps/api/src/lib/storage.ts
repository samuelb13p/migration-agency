import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { env, storageConfig } from "../config/env";
import { HttpError } from "../common/http-error";

export class LocalStorageService {
  async save(buffer: Buffer, relativeKey: string) {
    const filePath = path.resolve(process.cwd(), storageConfig.root, relativeKey);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
    return relativeKey;
  }

  async read(relativeKey: string) {
    const filePath = path.resolve(process.cwd(), storageConfig.root, relativeKey);
    return fs.readFile(filePath);
  }

  createSignedToken(storageKey: string, expiresInMinutes = 15) {
    const expiresAt = Date.now() + expiresInMinutes * 60_000;
    const payload = `${storageKey}:${expiresAt}`;
    const signature = crypto
      .createHmac("sha256", env.SIGNED_URL_SECRET)
      .update(payload)
      .digest("hex");

    return Buffer.from(`${payload}:${signature}`).toString("base64url");
  }

  verifySignedToken(token: string) {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [storageKey, expiresAt, signature] = decoded.split(":");
    const payload = `${storageKey}:${expiresAt}`;
    const expected = crypto
      .createHmac("sha256", env.SIGNED_URL_SECRET)
      .update(payload)
      .digest("hex");

    if (signature !== expected || Number(expiresAt) < Date.now()) {
      throw new HttpError(403, "Signed URL is invalid or expired.");
    }

    return storageKey;
  }
}

export const storageService = new LocalStorageService();
