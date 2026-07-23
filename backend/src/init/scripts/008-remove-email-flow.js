import { databaseName, r } from "../../config/rethinkdb.js";

export default async function removeEmailFlow() {
  try {
    const database = r.db(databaseName);
    const tables = await database.tableList().run();

    if (tables.includes("user_tokens")) {
      await database.tableDrop("user_tokens").run();
      console.log("Removed obsolete user_tokens table");
    }

    if (tables.includes("users")) {
      await database.table("users").update({
        email_verified: r.literal(),
        pending_email: r.literal(),
      }).run();
      console.log("Removed obsolete email verification fields");
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}
