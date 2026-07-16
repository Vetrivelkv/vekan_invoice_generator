import bcrypt from "bcryptjs";
import * as userModel from "../models/userModel.js";
import {
  consumeUserToken,
  getUserToken,
  TOKEN_PURPOSES,
} from "../models/userTokenModel.js";

async function requireValidToken(rawToken, purpose) {
  const token = await getUserToken(rawToken);
  if (
    !token
    || token.purpose !== purpose
    || new Date(token.expires_at).getTime() <= Date.now()
  ) {
    throw Object.assign(
      new Error("This link is invalid or has expired"),
      { status: 400 },
    );
  }
  const user = await userModel.findUserById(token.user_id);
  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }
  return { token, user };
}

export async function completeAccountSetup(rawToken, password) {
  if (typeof password !== "string" || password.length < 8) {
    throw new Error("Password must contain at least 8 characters");
  }
  const { token, user } = await requireValidToken(
    rawToken,
    TOKEN_PURPOSES.ACCOUNT_SETUP,
  );
  if (token.email !== user.email) {
    throw new Error("This invitation no longer matches the user email");
  }

  await userModel.updateUser(user.id, {
    password_hash: await bcrypt.hash(password, 12),
    email_verified: true,
    active: true,
  });
  await consumeUserToken(rawToken);
}

export async function verifyEmailChange(rawToken) {
  const { token, user } = await requireValidToken(
    rawToken,
    TOKEN_PURPOSES.EMAIL_CHANGE,
  );
  if (token.email !== user.pending_email) {
    throw new Error("This verification link has been replaced");
  }
  if (await userModel.emailBelongsToAnotherUser(token.email, user.id)) {
    throw new Error("That email address is no longer available");
  }

  await userModel.updateUser(user.id, {
    email: token.email,
    pending_email: null,
    email_verified: true,
  });
  await consumeUserToken(rawToken);
}
