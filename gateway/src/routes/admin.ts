import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

import {
  blockIp,
  blockPath,
  getAccessControlSnapshot,
} from "../lib/access-control.js";
import { requireAdmin } from "../plugins/admin-auth.js";

export const adminRoutes: FastifyPluginAsync = async (app) => {
  app.get("/admin/access-control", async (request, reply) => {
    if (!requireAdmin(request, reply)) {
      return;
    }
    return getAccessControlSnapshot();
  });

  app.post("/admin/access-control/block-path", async (request, reply) => {
    if (!requireAdmin(request, reply)) {
      return;
    }
    const body = z.object({ path: z.string().min(1) }).parse(request.body);
    blockPath(body.path);
    return { ok: true, blocked_path: body.path };
  });

  app.post("/admin/access-control/block-ip", async (request, reply) => {
    if (!requireAdmin(request, reply)) {
      return;
    }
    const body = z.object({ ip: z.string().min(1) }).parse(request.body);
    blockIp(body.ip);
    return { ok: true, blocked_ip: body.ip };
  });
};
