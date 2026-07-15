import * as companyModel from '../models/companyModel.js';

export default class CompanyLogic {
  getAll() {
    return companyModel.getCompanies();
  }

  create(input) {
    const company = {
      name: input.name?.trim(),
      address: input.address?.trim(),
      gst_number: input.gst_number?.trim().toUpperCase(),
    };
    if (!company.name || !company.address || !company.gst_number) {
      throw new Error('Company name, address and GST number are required');
    }
    return companyModel.createCompany(company);
  }

  remove(companyId) {
    if (!companyId) throw new Error('Company ID is required');
    return companyModel.deleteCompany(companyId);
  }
}
