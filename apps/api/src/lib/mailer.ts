import nodemailer from "nodemailer";
import { env } from "../config/env";

type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

function createTransport() {
  if (env.SMTP_HOST && env.SMTP_PORT) {
    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }

  return nodemailer.createTransport({
    jsonTransport: true,
  });
}

export async function sendMail(input: SendMailInput) {
  const transport = createTransport();  
  const result = await transport.sendMail({
    from: env.SMTP_FROM ?? env.SMTP_USER ?? "no-reply@migration.local",
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
  return result;
}
