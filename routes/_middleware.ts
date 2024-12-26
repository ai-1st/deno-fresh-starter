import { getSession, saveSession } from "../core/sessions.ts";
import { FreshContext } from "$fresh/server.ts";
    
export async function handler(req: Request, ctx: FreshContext) {
  const session = await getSession(req);
  ctx.state.session = session;
  const user = session?.values?.[0] ? {
    id: session.values[0],
    email: session.values[1],
    name: session.values[2],
    picture: session.values[3],
  } : undefined;
  ctx.state.user = user;

  const response = await ctx.next();
  return await saveSession(response, session);
}
