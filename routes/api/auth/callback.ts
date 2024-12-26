/**
 * Google OAuth2 callback handler
 * Processes the OAuth callback, exchanges code for tokens, and creates user session
 */
import { FreshContext } from "$fresh/server.ts";
import { setSessionValue, saveSession } from "../../../core/sessions.ts";
import { ulid } from "$ulid/mod.ts";
import { db } from "$db";

async function getGoogleUserInfo(accessToken: string) {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return await response.json();
}

export async function handler(req: Request, ctx: FreshContext) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") || "/";
  
  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  // Exchange code for tokens
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: Deno.env.get("GOOGLE_CLIENT_ID") || "",
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET") || "",
      redirect_uri: Deno.env.get("GOOGLE_REDIRECT_URI") || "",
      grant_type: "authorization_code",
    }),
  });

  const tokens = await tokenResponse.json();
  
  if (!tokenResponse.ok) {
    return new Response("Failed to get tokens", { status: 400 });
  }

  // Get user info
  const userInfo = await getGoogleUserInfo(tokens.access_token);

  // Create session
  const session = ctx.state.session;
  setSessionValue(session, 0, userInfo.id);
  setSessionValue(session, 1, userInfo.email);
  setSessionValue(session, 2, userInfo.name);
  setSessionValue(session, 3, userInfo.picture);
  console.log("Saving session:", session);
  
  const response = new Response(null, {
    status: 302,
    headers: {
      Location: state,
    },
  });

  await saveSession(session, response);
  return response;
}
