import { databaseName, r } from "../../config/rethinkdb.js";

export default async function seedSettings() {
  try {
    await r
      .db(databaseName)
      .table("app_settings")
      .insert(
        {
          id: "current_bill_number",
          value: 129,
        },
        { conflict: "update" },
      )
      .run();
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}
