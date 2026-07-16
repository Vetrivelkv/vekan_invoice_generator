import asyncRoute from "../../lib/async-route.js";
import { clearSession } from "../../logic/auth.js";
import {
  completeAccountSetup,
  verifyEmailChange,
} from "../../logic/account.js";

export default function registerAccountRoutes(app) {
  app.post(
    "/api/account/setup-password",
    asyncRoute(async (request, response) => {
      await completeAccountSetup(request.body.token, request.body.password);
      clearSession(response);
      response.json({ status: "success" });
    }),
  );

  app.post(
    "/api/account/verify-email",
    asyncRoute(async (request, response) => {
      await verifyEmailChange(request.body.token);
      clearSession(response);
      response.json({ status: "success" });
    }),
  );
}
