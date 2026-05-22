import { env } from "../../config/env";
import { sendMail } from "../../lib/mailer";

export const emailService = {
  async sendExternalCustomerAccessEmail(input: {
    email: string;
    password: string;
    firstName: string;
    caseNumber: string;
  }) {
    const loginUrl = `${env.APP_URL}/login`;
    const subject = "Your migration portal account is ready";
    const text = [
      `Hi ${input.firstName},`,
      "",
      `Your visa case ${input.caseNumber} has been created.`,
      `You can log in with:`,
      `Email: ${input.email}`,
      `Password: ${input.password}`,
      "",
      `Login: ${loginUrl}`,
    ].join("\n");

    const html = `
      <p>Hi ${input.firstName},</p>
      <p>Your visa case <strong>${input.caseNumber}</strong> has been created.</p>
      <p>You can log in with:</p>
      <ul>
        <li><strong>Email:</strong> ${input.email}</li>
        <li><strong>Password:</strong> ${input.password}</li>
      </ul>
      <p><a href="${loginUrl}">Open the migration portal</a></p>
    `;

    const content = { to: input.email, subject, text, html };

    try {
      const response = await fetch(
        `${env.EMAIL_SERVICE_API_URL}/samuelbuendia.com/migration-agency`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(content),
        },
      );
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.log(error);
    }
  },

  async sendCustomerAccessEmail(input: {
    email: string;
    password: string;
    firstName: string;
    caseNumber: string;
  }) {
    const loginUrl = `${env.APP_URL}/login`;
    const subject = "Your migration portal account is ready";
    const text = [
      `Hi ${input.firstName},`,
      "",
      `Your visa case ${input.caseNumber} has been created.`,
      `You can log in with:`,
      `Email: ${input.email}`,
      `Password: ${input.password}`,
      "",
      `Login: ${loginUrl}`,
    ].join("\n");

    const html = `
      <p>Hi ${input.firstName},</p>
      <p>Your visa case <strong>${input.caseNumber}</strong> has been created.</p>
      <p>You can log in with:</p>
      <ul>
        <li><strong>Email:</strong> ${input.email}</li>
        <li><strong>Password:</strong> ${input.password}</li>
      </ul>
      <p><a href="${loginUrl}">Open the migration portal</a></p>
    `;

    console.log({
      to: input.email,
      subject,
      text,
      html,
    });

    return await sendMail({
      to: input.email,
      subject,
      text,
      html,
    });
  },
};
