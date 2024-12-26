/**
 * API endpoint for retrieving agent version data
 * Returns version details like name, prompt, timestamp, and changelog
 */
import { HandlerContext } from "$fresh/server.ts";
import { db } from "$db";

export async function handler(
  req: Request,
  ctx: HandlerContext,
): Promise<Response> {
  const versionId = ctx.params.versionId;
  
  if (!versionId) {
    return new Response("Missing version ID", { status: 400 });
  }

  try {
    const version = await db.getOne({
      pk: "AGENT_VERSION",
      sk: versionId
    });

    if (!version) {
      return new Response("Version not found", { status: 404 });
    }

    const versionData = {
      id: version.sk,
      name: version.data.name,
      prompt: version.data.prompt,
      timestamp: version.data.timestamp,
      changelog: version.data.changelog
    };

    return new Response(JSON.stringify(versionData), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error(`Error fetching version ${versionId}:`, error);
    return new Response("Internal server error", { status: 500 });
  }
}
