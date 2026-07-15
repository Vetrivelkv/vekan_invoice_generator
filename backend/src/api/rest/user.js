import asyncRoute from "../../lib/async-route.js";
import { requireRole } from "../../logic/auth.js";
import UserLogic from "../../logic/user.js";

const userLogic = new UserLogic();

export default function registerUserRoutes(app) {
  app.get(
    "/api/users",
    requireRole("super_admin"),
    asyncRoute(async (_request, response) => {
      response.json({ users: await userLogic.getAll() });
    }),
  );
}
