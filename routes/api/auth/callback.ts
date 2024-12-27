/**
 * Google OAuth2 callback handler
 * Processes OAuth callback, exchanges code for tokens, creates user session and stores user data
 * 
 * Side effects:
 * - Stores user data in database
 * - Creates user session
 * - Sets session values
 */
import { FreshContext } from "$fresh/server.ts";
import { setSessionValue, saveSession } from "../../../core/sessions.ts";
import { ulid } from "$ulid/mod.ts";
import { db } from "$db";

/**
 * Fetches user info from Google's userinfo endpoint
 * @param accessToken Google OAuth access token
 * @returns User profile data from Google
 */
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

  // Store user data in DB
  try {
    await db.set({
      pk: "USER",
      sk: userInfo.email,
      data: {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Failed to store user data:", error);
    return new Response("Failed to store user data", { status: 500 });
  }

  // Create session
  const session = ctx.state.session;
  await setSessionValue(session, 0, userInfo.id);
  await setSessionValue(session, 1, userInfo.email);
  await setSessionValue(session, 2, userInfo.name);
  await setSessionValue(session, 3, userInfo.picture);

  // Create response with redirect
  const response = new Response(null, {
    status: 302,
    headers: { Location: state }
  });

  // Save session to response
  return await saveSession(response, session);
}
