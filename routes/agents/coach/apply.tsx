/**
 * Handler for applying coach suggestions and creating new agent versions.
 * Creates new version when user confirms changes.
 */

import { Handlers } from "$fresh/server.ts";
import { db } from "$db";
import { ulid } from "$ulid/mod.ts";

export const handler: Handlers = {
  async POST(req) {
    const form = await req.formData();
    const llmStreamId = form.get("llmStreamId")?.toString();
    const action = form.get("action")?.toString();

    if (!llmStreamId) {
      return new Response("Missing stream ID", { status: 400 });
    }

    // Get stream data
    const streams = await db.query({
      pk: "LLM_STREAM",
      sk: llmStreamId
    });

    if (streams.length === 0) {
      return new Response("Stream not found", { status: 404 });
    }

    const stream = streams[0];
    const { agentVersionId, taskId, feedback } = stream.data;

    if (action === "confirm") {
      // Get current agent version
      const versions = await db.query({
        pk: "AGENT_VERSION",
        sk: agentVersionId
      });

      if (versions.length === 0) {
        return new Response("Agent version not found", { status: 404 });
      }

      const currentVersion = versions[0];

      // Get the improved prompt from stream
      const streamContent = await db.query({
        pk: "LLM_STREAM_CONTENT",
        sk: llmStreamId
      });

      if (streamContent.length === 0) {
        return new Response("Stream content not found", { status: 404 });
      }

      const improvedPrompt = streamContent[0].data.content;

      // Create new version
      const newVersionId = ulid();
      await db.set({
        pk: "AGENT_VERSION",
        sk: newVersionId,
        data: {
          name: currentVersion.data.name,
          prompt: improvedPrompt,
          previousVersion: agentVersionId,
          changelog: `Improved based on feedback from task ${taskId}: ${feedback}`,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Delete stream data
    await db.delete({
      pk: "LLM_STREAM",
      sk: llmStreamId
    });
    await db.delete({
      pk: "LLM_STREAM_CONTENT", 
      sk: llmStreamId
    });

    // Redirect back to tasks
    return new Response("", {
      status: 303,
      headers: { Location: `/agents/tasks` },
    });
  }
};
