import { FreshContext } from "$fresh/server.ts";
import { Session, getSessionValue } from "../../core/sessions.ts";

export async function handler(
  req: Request,
  ctx: FreshContext,
) {
  console.log("[Middleware] Handling request for:", req.url);
  
  // Ensure session exists and is of correct type
  const session = ctx.state.session;
  console.log("[Middleware] Session state:", session ? "exists" : "missing");
  
  if (!session || !(session as Session).values) {
    console.log("[Middleware] No valid session, redirecting to signin");
    const url = new URL(req.url);
    return new Response("", {
      status: 302,
      headers: { Location: `/signin?redirect=${encodeURIComponent(url.pathname)}` },
    });
  }

  const userId = getSessionValue(session as Session, 0);
  console.log("[Middleware] User ID from session:", userId || "not found");
  
  if (!userId) {
    console.log("[Middleware] No user ID in session, redirecting to signin");
    const url = new URL(req.url);
    return new Response("", {
      status: 302,
      headers: { Location: `/signin?redirect=${encodeURIComponent(url.pathname)}` },
    });
  }

  console.log("[Middleware] Authentication successful, proceeding to route");
  // Add the userId to the state for downstream handlers
  ctx.state.userId = userId;
  
  return await ctx.next();
}
