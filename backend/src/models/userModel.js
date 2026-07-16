import { r } from "../config/rethinkdb.js";

const USERS = "users";
const PRIVATE_FIELDS = ["password_hash"];

export async function findUserByEmail(email) {
  return r.table(USERS)
    .getAll(email, { index: "email" })
    .nth(0)
    .default(null)
    .run();
}

export function findUserById(userId) {
  return r.table(USERS).get(userId).run();
}

export async function emailBelongsToAnotherUser(email, excludedUserId = null) {
  const users = await r
    .table(USERS)
    .filter((user) =>
      user("email")
        .default("")
        .eq(email)
        .or(user("pending_email").default("").eq(email)),
    )
    .run();
  return users.some((user) => user.id !== excludedUserId);
}

export async function getUsers() {
  return r.table(USERS)
    .orderBy({ index: "email" })
    .without(...PRIVATE_FIELDS)
    .run();
}

export async function createUser(user) {
  const result = await r.table(USERS).insert({
    ...user,
    created_at: new Date(),
    updated_at: new Date(),
  }, { returnChanges: true }).run();
  return result.changes?.[0]?.new_val || null;
}

export async function updateUser(userId, changes) {
  const result = await r.table(USERS).get(userId).update({
    ...changes,
    updated_at: new Date(),
  }, { returnChanges: true }).run();
  return result.changes?.[0]?.new_val || null;
}

export function publicUser(user) {
  if (!user) return null;
  return Object.fromEntries(
    Object.entries(user).filter(([key]) => !PRIVATE_FIELDS.includes(key)),
  );
}
