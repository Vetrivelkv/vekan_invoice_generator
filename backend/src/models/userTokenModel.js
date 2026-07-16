import crypto from "node:crypto";
import { r } from "../config/rethinkdb.js";

const TOKENS = "user_tokens";

export const TOKEN_PURPOSES = Object.freeze({
  ACCOUNT_SETUP: "account_setup",
  EMAIL_CHANGE: "email_change",
});

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function issueUserToken(userId, purpose, email) {
  await r
    .table(TOKENS)
    .getAll(userId, { index: "user_id" })
    .filter({ purpose })
    .delete()
    .run();

  const token = crypto.randomBytes(32).toString("base64url");
  const expiryMinutes = Number(process.env.ACCOUNT_TOKEN_EXPIRY_MINUTES) || 60;
  await r.table(TOKENS).insert({
    id: hashToken(token),
    user_id: userId,
    purpose,
    email,
    expires_at: new Date(Date.now() + expiryMinutes * 60 * 1000),
    created_at: new Date(),
  }).run();
  return token;
}

export function getUserToken(token) {
  if (!token) return null;
  return r.table(TOKENS).get(hashToken(token)).run();
}

export async function consumeUserToken(token) {
  if (!token) return;
  await r.table(TOKENS).get(hashToken(token)).delete().run();
}
