import initialCreate from "./scripts/001-initial-create.js";
import createIndexes from "./scripts/002-create-indexes.js";
import seedSettings from "./scripts/003-seed-settings.js";
import createUsersAndSeedSuperAdmin from "./scripts/004-create-users-and-seed-super-admin.js";
import enableInvoiceSoftDelete from "./scripts/005-enable-invoice-soft-delete.js";
import createInvoiceArchives from "./scripts/007-create-invoice-archives.js";
import removeEmailFlow from "./scripts/008-remove-email-flow.js";
import correct2018NovemberInvoiceArchives from "./scripts/009-correct-2018-november-invoice-archives.js";
import remove2018SeptemberQuotationArchives from "./scripts/010-remove-2018-september-quotation-archives.js";
import number2018DecemberInvoiceArchives from "./scripts/011-number-2018-december-invoice-archives.js";

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
  {
    key: "010-remove-2018-september-quotation-archives",
    applyScript: remove2018SeptemberQuotationArchives,
  },
  {
    key: "011-number-2018-december-invoice-archives",
    applyScript: number2018DecemberInvoiceArchives,
  },
];
