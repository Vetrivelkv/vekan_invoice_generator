import asyncRoute from "../../lib/async-route.js";
import { requireRole } from "../../logic/auth.js";
import UserLogic from "../../logic/user.js";

const userLogic = new UserLogic();

export default function registerUserRoutes(app) {
  app.get(
    "/api/users",
    requireRole("super_admin", "admin"),
    asyncRoute(async (_request, response) => {
      response.json({ users: await userLogic.getAll() });
    }),
  );

  app.post(
    "/api/users",
    requireRole("super_admin"),
    asyncRoute(async (request, response) => {
      response.status(201).json(await userLogic.create({
        ...request.body,
        actorId: request.user.id,
      }));
    }),
  );

  app.put(
    "/api/users/:userId",
    requireRole("super_admin"),
    asyncRoute(async (request, response) => {
      response.json(
        await userLogic.update(
          request.user,
          request.params.userId,
          request.body,
        ),
      );
    }),
  );

}
