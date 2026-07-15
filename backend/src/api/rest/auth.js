import asyncRoute from '../../lib/async-route.js';
import {
  clearSession,
  createSession,
  requireSession,
  verifyCredentials,
} from '../../logic/auth.js';

export { requireSession };

export default function registerAuthRoutes(app) {
  app.post('/api/auth/login', asyncRoute(async (request, response) => {
    const user = await verifyCredentials(request.body.email, request.body.password);
    if (!user) return response.status(401).json({ detail: 'Invalid email or password' });
    response.json(createSession(response, user));
  }));

  app.post('/api/auth/logout', (_request, response) => {
    clearSession(response);
    response.status(204).end();
  });

  app.get('/api/auth/session', requireSession, (request, response) => {
    response.json({ user: request.user, expiresAt: request.sessionExpiresAt });
  });

  app.post('/api/auth/refresh', requireSession, (request, response) => {
    response.json({ user: request.user, expiresAt: request.sessionExpiresAt });
  });
}
