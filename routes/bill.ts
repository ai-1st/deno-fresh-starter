/**
 * Dev backdoor endpoint for Bill's session
 * Creates a session with Bill's credentials and redirects to home
 */

import { Handlers } from "$fresh/server.ts";
import { getSession, setSessionValue, saveSession } from "../core/sessions.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const session = await getSession(req);
    
    // Set Bill's session values
    await setSessionValue(session, 0, "bill");
    await setSessionValue(session, 1, "bill.gleeson@cloudfix.com");
    await setSessionValue(session, 2, "Bill Gleeson");
    await setSessionValue(session, 3, "https://lh3.googleusercontent.com/a-/ALV-UjWHYMFXNwdHESwWg0p7xtiWuahcLjNpSYmX18Rh3bZ6Q11lf9c=s160-p-k-rw-no");

    // Create response with redirect
    const response = new Response(null, {
      status: 302,
      headers: { Location: "/" }
    });

    // Save session to response
    return await saveSession(response, session);
  }
};
