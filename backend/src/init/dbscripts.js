import initialCreate from "./scripts/001-initial-create.js";
import createIndexes from "./scripts/002-create-indexes.js";
import seedSettings from "./scripts/003-seed-settings.js";
import createUsersAndSeedSuperAdmin from "./scripts/004-create-users-and-seed-super-admin.js";
import enableInvoiceSoftDelete from "./scripts/005-enable-invoice-soft-delete.js";
import createInvoiceArchives from "./scripts/007-create-invoice-archives.js";
import removeEmailFlow from "./scripts/008-remove-email-flow.js";
import correct2018NovemberInvoiceArchives from "./scripts/009-correct-2018-november-invoice-archives.js";

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
  {
    key: "007-create-invoice-archives",
    applyScript: createInvoiceArchives,
  },
  {
    key: "008-remove-email-flow",
    applyScript: removeEmailFlow,
  },
  {
    key: "009-correct-2018-november-invoice-archives",
    applyScript: correct2018NovemberInvoiceArchives,
  },
];
