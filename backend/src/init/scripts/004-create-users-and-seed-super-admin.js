import bcrypt from "bcryptjs";
import { databaseName, r } from "../../config/rethinkdb.js";
import { createMissingTables } from "./utils/create-missing-tables.js";

const DEFAULT_EMAIL = "vetrivelkvk@gmail.com";
const DEFAULT_PASSWORD = "19972002@VkKeyan";

export default async function createUsersAndSeedSuperAdmin() {
  try {
    const tableResult = await createMissingTables(["users"]);
    if (!tableResult.success) return tableResult;

    const users = r.db(databaseName).table("users");
    const indexes = await users.indexList().run();
    if (!indexes.includes("email")) {
      await users.indexCreate("email").run();
      await users.indexWait("email").run();
      console.log("Created index: users.email");
    }

    const existingUser = await users
      .getAll(DEFAULT_EMAIL, { index: "email" })
      .nth(0)
      .default(null)
      .run();

    const now = new Date();
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
    if (existingUser) {
      await users.get(existingUser.id).update({
        email: DEFAULT_EMAIL,
        password_hash: passwordHash,
        role: "super_admin",
        active: true,
        updated_at: now,
      }).run();
      console.log(`Updated default super admin: ${DEFAULT_EMAIL}`);
    } else {
      await users.insert({
        email: DEFAULT_EMAIL,
        password_hash: passwordHash,
        role: "super_admin",
        active: true,
        created_at: now,
        updated_at: now,
      }).run();
      console.log(`Created default super admin: ${DEFAULT_EMAIL}`);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}
