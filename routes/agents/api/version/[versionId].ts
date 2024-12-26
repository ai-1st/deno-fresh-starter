/**
 * API endpoint for retrieving agent version data
 * Returns version details like name, prompt, timestamp, and changelog
 * Used by both direct version fetching and changelog history building
 */
import { FreshContext } from "$fresh/server.ts";
import { db } from "$db";

export async function handler(
  _req: Request,
  ctx: FreshContext,
): Promise<Response> {
  const versionId = ctx.params.versionId;
  console.log(`[Version API] Fetching version: ${versionId}`);

  try {
    const versions = await db.query({
      pk: "AGENT_VERSION",
      sk: versionId
    });
    console.log(`[Version API] Found ${versions.length} versions for id ${versionId}`);

    if (versions.length === 0) {
      console.log(`[Version API] Version not found: ${versionId}`);
      return new Response("Version not found", { status: 404 });
    }

    const version = versions[0];
    console.log(`[Version API] Version details:
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
    console.error('[Version API] Error fetching version:', error);
    return new Response("Internal server error", { status: 500 });
  }
}
