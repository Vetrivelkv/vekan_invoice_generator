import asyncRoute from "../../lib/async-route.js";
import { requireRole } from "../../logic/auth.js";
import SettingLogic from "../../logic/setting.js";

const settingLogic = new SettingLogic();
const requireAdministrator = requireRole("super_admin", "admin");

export default function registerSettingRoutes(app) {
  app.get(
    "/api/settings/billing",
    requireAdministrator,
    asyncRoute(async (_request, response) => {
      response.json({ settings: await settingLogic.getBillingSetting() });
    }),
  );

  app.put(
    "/api/settings/billing",
    requireAdministrator,
    asyncRoute(async (request, response) => {
      response.json({
        settings: await settingLogic.updateBillingSetting(request.body),
      });
    }),
  );
}
