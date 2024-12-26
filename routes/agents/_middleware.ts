import { FreshContext } from "$fresh/server.ts";


export async function handler(
  req: Request,
  ctx: FreshContext,
) {
  console.log("[Middleware] Handling request for:", req.url);
  
  // Check if user exists in context
  const user = ctx.state.user;

  console.log("[Middleware] User state:", user ? "exists" : "missing");
  
  if (!user) {
    console.log("[Middleware] No user in session, returning 404");
    return ctx.renderNotFound();
  }

  console.log("[Middleware] Authentication successful, proceeding to route");
  
  return await ctx.next();
}
