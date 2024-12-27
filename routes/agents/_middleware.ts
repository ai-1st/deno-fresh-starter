import { FreshContext } from "$fresh/server.ts";


export async function handler(
  req: Request,
  ctx: FreshContext,
) {

  // Check if user exists in context
  const user = ctx.state.user;

  if (!user) {
    console.log("[Middleware] No user in session, returning 404");
    return ctx.renderNotFound();
  }

  return await ctx.next();
}
