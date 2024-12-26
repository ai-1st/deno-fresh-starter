/**
 * Google OAuth2 authentication endpoint
 * Initiates the OAuth flow by redirecting to Google's consent screen
 */
import { FreshContext } from "$fresh/server.ts";

export async function handler(req: Request, _ctx: FreshContext) {
  const url = new URL(req.url);
  const redirectUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  
  redirectUrl.searchParams.set("client_id", Deno.env.get("GOOGLE_CLIENT_ID") || "");
  redirectUrl.searchParams.set("redirect_uri", Deno.env.get("GOOGLE_REDIRECT_URI") || "");
  redirectUrl.searchParams.set("response_type", "code");
  redirectUrl.searchParams.set("scope", "openid email profile");
  redirectUrl.searchParams.set("state", url.searchParams.get("redirect") || "/");
  
  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectUrl.toString(),
    },
  });
}
