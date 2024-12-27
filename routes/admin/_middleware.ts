/**
 * Access control middleware for users route
 * Only allows access to dmitry.degtyarev@devfactory.com
 */
import { FreshContext } from "$fresh/server.ts";
import { getSessionValue } from "../../core/sessions.ts";

const ALLOWED_EMAIL = "dmitry.degtyarev@devfactory.com";

export async function handler(req: Request, ctx: FreshContext) {
  const session = ctx.state.session;
  const userEmail = getSessionValue(session, 1); // Email is stored at index 1

  if (!userEmail || userEmail !== ALLOWED_EMAIL) {
    return new Response("Unauthorized", { status: 403 });
  }

  return await ctx.next();
}
