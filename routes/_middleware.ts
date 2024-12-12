import { sessionMiddleware } from "../core/sessions.ts";
import { FreshContext } from "$fresh/server.ts";
    
export async function handler(req: Request, ctx: FreshContext) {
  return await sessionMiddleware(req, ctx);
}
