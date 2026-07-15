import { r } from "../config/rethinkdb.js";

const USERS = "users";

export async function findUserByEmail(email) {
  return r.table(USERS)
    .getAll(email, { index: "email" })
    .nth(0)
    .default(null)
    .run();
}

export async function getUsers() {
  return r.table(USERS)
    .orderBy({ index: "email" })
    .without("password_hash")
    .run();
}
