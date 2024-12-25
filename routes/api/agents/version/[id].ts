/**
 * API endpoint for fetching a specific agent version
 * Used by the Changelog component to build version history
 */

import { Handlers } from "$fresh/server.ts";
import { db } from "$db";

export const handler: Handlers = {
  async GET(_req, ctx) {
    const id = ctx.params.id;
    console.log(`[Changelog API] Fetching version: ${id}`);

    try {
      const versions = await db.query({
        pk: "AGENT_VERSION",
        sk: id
      });
      console.log(`[Changelog API] Found ${versions.length} versions for id ${id}`);

      if (versions.length === 0) {
        console.log(`[Changelog API] Version not found: ${id}`);
        return new Response("Version not found", { status: 404 });
      }

      const version = versions[0];
      console.log(`[Changelog API] Version details:
        - Name: ${version.data.name}
        - Previous Version: ${version.data.previousVersion || 'none'}
        - Has Changelog: ${!!version.data.changelog}
        - Timestamp: ${version.data.timestamp}
      `);

      return Response.json({
        id: version.sk,
        name: version.data.name,
        prompt: version.data.prompt,
        timestamp: version.data.timestamp,
        previousVersion: version.data.previousVersion,
        changelog: version.data.changelog
      });
    } catch (error) {
      console.error('[Changelog API] Error fetching version:', error);
      return new Response("Internal server error", { status: 500 });
    }
  }
};
