import initialCreate from "./scripts/001-initial-create.js";
import createIndexes from "./scripts/002-create-indexes.js";
import seedSettings from "./scripts/003-seed-settings.js";
import createUsersAndSeedSuperAdmin from "./scripts/004-create-users-and-seed-super-admin.js";
import enableInvoiceSoftDelete from "./scripts/005-enable-invoice-soft-delete.js";

export default [
  { key: "001-initial-create", applyScript: initialCreate },
  { key: "002-create-indexes", applyScript: createIndexes },
  { key: "003-seed-settings", applyScript: seedSettings },
  {
    key: "004-create-users-and-seed-super-admin",
    applyScript: createUsersAndSeedSuperAdmin,
  },
  {
    key: "005-enable-invoice-soft-delete",
    applyScript: enableInvoiceSoftDelete,
  },
];
