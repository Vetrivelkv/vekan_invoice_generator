import { databaseName, r } from "../../config/rethinkdb.js";
import { createMissingTables } from "./utils/create-missing-tables.js";

const DEFAULT_EMAIL = "vetrivelkvk@gmail.com";
const DEFAULT_FULL_NAME = "Vetrivel K";

export default async function enableUserInvitations() {
  try {
    const tableResult = await createMissingTables(["user_tokens"]);
    if (!tableResult.success) return tableResult;

    const database = r.db(databaseName);
    const tokens = database.table("user_tokens");
    const tokenIndexes = await tokens.indexList().run();
    if (!tokenIndexes.includes("user_id")) {
      await tokens.indexCreate("user_id").run();
      await tokens.indexWait("user_id").run();
      console.log("Created index: user_tokens.user_id");
    }

    const users = database.table("users");
    const existingUsers = await users.run();
    let defaultSuperAdmin = existingUsers.find(
      (user) => user.email?.toLowerCase() === DEFAULT_EMAIL,
    );
    if (!defaultSuperAdmin) {
      defaultSuperAdmin = existingUsers.find(
        (user) => user.role === "super_admin",
      );
    }

    for (const user of existingUsers) {
      const isDefaultSuperAdmin = user.id === defaultSuperAdmin?.id;
      const fallbackName = user.email?.split("@")[0] || "Vekan User";
      await users.get(user.id).update({
        full_name: isDefaultSuperAdmin
          ? DEFAULT_FULL_NAME
          : user.full_name || fallbackName,
        email: isDefaultSuperAdmin ? DEFAULT_EMAIL : user.email,
        email_verified: isDefaultSuperAdmin
          ? true
          : Boolean(user.email_verified ?? user.password_hash),
        pending_email: user.pending_email || null,
        updated_at: new Date(),
      }).run();
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}
