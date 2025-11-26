// src/lib/send-email.ts
"use server";

import * as React from "react";

import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

type SendEmailArgs = {
  to: string;
  subject: string;
  react?: React.ReactElement;
  text?: string;
};

export async function sendEmail({ to, subject, react, text }: SendEmailArgs) {
  if (!resend) {
    console.warn("[EMAIL] RESEND_API_KEY missing. Logging instead.", {
      to,
      subject,
    });
    return;
  }

  const from = process.env.EMAIL_FROM || "HIVE <onboarding@resend.dev>";

  try {
    const result = await resend.emails.send({
      from,
      to,
      subject,
      react,
      text,
    });

    console.log("[EMAIL SENT]", result);
  } catch (error) {
    console.error("[EMAIL SEND ERROR]", error);
  }
}
