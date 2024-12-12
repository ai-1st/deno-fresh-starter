import { Handlers } from "$fresh/server.ts";
import { clearSession } from "../core/sessions.ts";

export const handler: Handlers = {
  GET(_req, _ctx) {
    console.log("[Logout] GET request received");
    // Clear session values
    console.log("[Logout] Session cleared");

    // Redirect to home page
    return clearSession(new Response("", {
      status: 302,
      headers: { Location: "/" },
    }));
  },
};
