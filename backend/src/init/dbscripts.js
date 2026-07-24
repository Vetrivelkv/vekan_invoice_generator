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
import removeRabiaQuotationAndRenumberArchives from "./scripts/012-remove-rabia-quotation-and-renumber-archives.js";
import number2019InvoiceArchivesThrough014 from "./scripts/013-number-2019-invoice-archives-through-014.js";
import numberInvoiceArchivesThrough025 from "./scripts/014-number-invoice-archives-through-025.js";
import remove2018Through2020InvoiceArchives from "./scripts/015-remove-2018-through-2020-invoice-archives.js";

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
  {
    key: "012-remove-rabia-quotation-and-renumber-archives",
    applyScript: removeRabiaQuotationAndRenumberArchives,
  },
  {
    key: "013-number-2019-invoice-archives-through-014",
    applyScript: number2019InvoiceArchivesThrough014,
  },
  {
    key: "014-number-invoice-archives-through-025",
    applyScript: numberInvoiceArchivesThrough025,
  },
  {
    key: "015-remove-2018-through-2020-invoice-archives",
    applyScript: remove2018Through2020InvoiceArchives,
  },
];
