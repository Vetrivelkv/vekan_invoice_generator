import * as userModel from "../models/userModel.js";
import {
  issueUserToken,
  TOKEN_PURPOSES,
} from "../models/userTokenModel.js";
import {
  sendAccountSetupEmail,
  sendEmailChangeVerification,
} from "./email.js";

export const USER_ROLES = Object.freeze(["super_admin", "admin", "user"]);

function normalizeFullName(value) {
  const fullName = value?.trim().replace(/\s+/g, " ");
  if (!fullName) throw new Error("Full name is required");
  return fullName;
}

function normalizeEmail(value) {
  const email = value?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("A valid email address is required");
  }
  return email;
}

function normalizeRole(value) {
  if (!USER_ROLES.includes(value)) throw new Error("Invalid user role");
  return value;
}

async function deliverSetupEmail(user) {
  const token = await issueUserToken(
    user.id,
    TOKEN_PURPOSES.ACCOUNT_SETUP,
    user.email,
  );
  try {
    return await sendAccountSetupEmail({
      email: user.email,
      fullName: user.full_name,
      token,
    });
  } catch (error) {
    console.error(`Unable to send account setup email to ${user.email}:`, error.message);
    return { sent: false, error: error.message };
  }
}

async function deliverEmailChange(user, pendingEmail) {
  const token = await issueUserToken(
    user.id,
    TOKEN_PURPOSES.EMAIL_CHANGE,
    pendingEmail,
  );
  try {
    return await sendEmailChangeVerification({
      email: pendingEmail,
      fullName: user.full_name,
      token,
    });
  } catch (error) {
    console.error(`Unable to send email verification to ${pendingEmail}:`, error.message);
    return { sent: false, error: error.message };
  }
}

export default class UserLogic {
  getAll() {
    return userModel.getUsers();
  }

  async create(input) {
    const fullName = normalizeFullName(input.full_name);
    const email = normalizeEmail(input.email);
    const role = normalizeRole(input.role);
    if (await userModel.emailBelongsToAnotherUser(email)) {
      throw new Error("That email address is already assigned or awaiting verification");
    }

    const user = await userModel.createUser({
      full_name: fullName,
      email,
      pending_email: null,
      email_verified: false,
      password_hash: null,
      role,
      active: false,
      created_by: input.actorId,
    });
    if (!user) throw new Error("User could not be created");
    const delivery = await deliverSetupEmail(user);
    return {
      user: userModel.publicUser(user),
      email_sent: delivery.sent,
      email_error: delivery.error || null,
    };
  }

  async update(actor, userId, input) {
    const existing = await userModel.findUserById(userId);
    if (!existing) throw Object.assign(new Error("User not found"), { status: 404 });

    const fullName = normalizeFullName(input.full_name);
    const email = normalizeEmail(input.email);
    const role = normalizeRole(input.role);
    const active = Boolean(input.active);

    if (actor.id === userId && role !== existing.role) {
      throw new Error("You cannot change your own role");
    }
    if (actor.id === userId && !active) {
      throw new Error("You cannot deactivate your own account");
    }
    if (await userModel.emailBelongsToAnotherUser(email, userId)) {
      throw new Error("That email address is already assigned or awaiting verification");
    }

    const changes = { full_name: fullName, role, active };
    let delivery = null;
    if (email !== existing.email) {
      if (existing.email_verified && existing.password_hash) {
        changes.pending_email = email;
      } else {
        changes.email = email;
        changes.pending_email = null;
        changes.email_verified = false;
        changes.active = false;
      }
    }

    const updated = await userModel.updateUser(userId, changes);
    if (!updated) throw new Error("User could not be updated");

    if (email !== existing.email) {
      delivery = existing.email_verified && existing.password_hash
        ? await deliverEmailChange(updated, email)
        : await deliverSetupEmail(updated);
    }

    return {
      user: userModel.publicUser(updated),
      email_sent: delivery?.sent ?? null,
      email_error: delivery?.error || null,
    };
  }

  async sendVerificationEmail(userId) {
    const user = await userModel.findUserById(userId);
    if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
    if (user.email_verified && !user.pending_email) {
      throw new Error("This user has no pending invitation or email verification");
    }

    const delivery = user.pending_email
      ? await deliverEmailChange(user, user.pending_email)
      : await deliverSetupEmail(user);
    return {
      email_sent: delivery.sent,
      email_error: delivery.error || null,
    };
  }
}
