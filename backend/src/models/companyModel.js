import { r } from '../config/rethinkdb.js';

const COMPANIES = 'companies';
const INVOICES = 'invoices';

export async function getCompanies() {
  return r.table(COMPANIES).orderBy({ index: 'name' }).run();
}

export async function createCompany(company) {
  const existingCount = await r.table(COMPANIES)
    .getAll(company.gst_number, { index: 'gst_number' })
    .count()
    .run();
  if (existingCount) throw new Error('A company with this GST number already exists');
  const result = await r.table(COMPANIES).insert({
    ...company,
    created_at: new Date(),
  }, { returnChanges: true }).run();
  const created = result.changes?.[0]?.new_val;
  if (!created) throw new Error('Company could not be created');
  return created;
}

export async function deleteCompany(companyId) {
  await r.table(INVOICES).filter({ company_id: companyId }).update({ company_id: null }).run();
  await r.table(COMPANIES).get(companyId).delete().run();
}
