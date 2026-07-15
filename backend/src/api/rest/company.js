import asyncRoute from '../../lib/async-route.js';
import CompanyLogic from '../../logic/company.js';

const companyLogic = new CompanyLogic();

export default function registerCompanyRoutes(app) {
  app.get('/api/companies', asyncRoute(async (_request, response) => {
    response.json({ companies: await companyLogic.getAll() });
  }));

  app.post('/api/companies', asyncRoute(async (request, response) => {
    response.status(201).json({ company: await companyLogic.create(request.body) });
  }));

  app.delete('/api/companies/:companyId', asyncRoute(async (request, response) => {
    await companyLogic.remove(request.params.companyId);
    response.status(204).end();
  }));
}
