const resendEndpoint = "https://api.resend.com/emails";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function applicationUrl(path, token) {
  const baseUrl = (
    process.env.APP_PUBLIC_URL || "http://localhost:5173"
  ).replace(/\/$/, "");
  return `${baseUrl}${path}?token=${encodeURIComponent(token)}`;
}

async function sendEmail({ to, subject, html }) {
  if (process.env.EMAIL_DELIVERY_DISABLED === "true") {
    return { sent: false, disabled: true };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is required to send account emails");

  const response = await fetch(resendEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "Vekan Tech <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || "Resend rejected the email request");
  }
  return { sent: true, id: body.id };
}

export function sendAccountSetupEmail({ email, fullName, token }) {
  const safeName = escapeHtml(fullName);
  const setupUrl = applicationUrl("/account/setup", token);
  return sendEmail({
    to: email,
    subject: "Set up your Vekan account",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#171b18">
        <h1 style="color:#e7472e">Welcome to Vekan</h1>
        <p>Hello ${safeName},</p>
        <p>Your Vekan account has been created. Verify your email and set your password using the button below.</p>
        <p style="margin:28px 0">
          <a href="${setupUrl}" style="background:#e7472e;color:white;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">Set up password</a>
        </p>
        <p>This link expires in ${Number(process.env.ACCOUNT_TOKEN_EXPIRY_MINUTES) || 60} minutes and can only be used once.</p>
      </div>
    `,
  });
}

export function sendEmailChangeVerification({ email, fullName, token }) {
  const safeName = escapeHtml(fullName);
  const verificationUrl = applicationUrl("/account/verify-email", token);
  return sendEmail({
    to: email,
    subject: "Verify your new Vekan email address",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#171b18">
        <h1 style="color:#e7472e">Verify your email</h1>
        <p>Hello ${safeName},</p>
        <p>A Vekan administrator requested that this become your new account email address.</p>
        <p style="margin:28px 0">
          <a href="${verificationUrl}" style="background:#e7472e;color:white;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">Verify email address</a>
        </p>
        <p>Your current email remains active until this link is confirmed. The link expires in ${Number(process.env.ACCOUNT_TOKEN_EXPIRY_MINUTES) || 60} minutes.</p>
      </div>
    `,
  });
}
