import bcrypt from "bcryptjs";
import * as userModel from "../models/userModel.js";

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

function normalizePassword(value, required = false) {
  if (!value) {
    if (required) throw new Error("Password is required");
    return null;
  }
  if (typeof value !== "string" || value.length < 8) {
    throw new Error("Password must contain at least 8 characters");
  }
  return value;
}

export default class UserLogic {
  getAll() {
    return userModel.getUsers();
  }

  async create(input) {
    const fullName = normalizeFullName(input.full_name);
    const email = normalizeEmail(input.email);
    const role = normalizeRole(input.role);
    const password = normalizePassword(input.password, true);
    if (await userModel.emailBelongsToAnotherUser(email)) {
      throw new Error("That email address is already assigned");
    }

    const user = await userModel.createUser({
      full_name: fullName,
      email,
      password_hash: await bcrypt.hash(password, 12),
      role,
      active: input.active !== false,
      created_by: input.actorId,
    });
    if (!user) throw new Error("User could not be created");
    return { user: userModel.publicUser(user) };
  }

  async update(actor, userId, input) {
    const existing = await userModel.findUserById(userId);
    if (!existing) throw Object.assign(new Error("User not found"), { status: 404 });

    const fullName = normalizeFullName(input.full_name);
    const email = normalizeEmail(input.email);
    const role = normalizeRole(input.role);
    const active = Boolean(input.active);
    const password = normalizePassword(input.password);

    if (actor.id === userId && role !== existing.role) {
      throw new Error("You cannot change your own role");
    }
    if (actor.id === userId && !active) {
      throw new Error("You cannot deactivate your own account");
    }
    if (await userModel.emailBelongsToAnotherUser(email, userId)) {
      throw new Error("That email address is already assigned");
    }

    if (active && !existing.password_hash && !password) {
      throw new Error("Set a password before activating this account");
    }

    const changes = { full_name: fullName, email, role, active };
    if (password) changes.password_hash = await bcrypt.hash(password, 12);
    const updated = await userModel.updateUser(userId, changes);
    if (!updated) throw new Error("User could not be updated");

    return { user: userModel.publicUser(updated) };
  }
}
