/**
 * API endpoint for handling agent feedback submissions
 * Creates coaching tasks to improve agent behavior
 */

import { Handlers } from "$fresh/server.ts";
import { db } from "$db";
import type { StreamPart } from "./api/task/:taskId.ts";

async function reconstructResponse(taskId: string, userEmail: string): Promise<string> {
  // Get all stream parts for the task
  const streamParts = await db.query({
    pk: "TASK_STREAM#" + taskId
  });

  // Sort by SK to maintain order
  const sortedParts = streamParts
    .sort((a, b) => a.sk.localeCompare(b.sk))
    .map(item => item.data as StreamPart);

  let response = "";
  
  // Reconstruct response by merging text deltas and tool calls
  for (const part of sortedParts) {
    if (part.type === 'text-delta') {
      response += part.textDelta;
    } else if (part.type === 'tool-call') {
      response += `\n[Tool Call: ${part.toolName}]\n${JSON.stringify(part.args, null, 2)}\n`;
    }
  }

  return response;
}

export const handler: Handlers = {
  async POST(req, ctx) {
    try {
      const userEmail = ctx.state.user?.email;
      
      if (!userEmail) {
        return new Response("Unauthorized", { status: 401 });
      }

      const form = await req.formData();
      const taskId = form.get("taskId")?.toString();
      const agentVersionId = form.get("agentVersionId")?.toString();
      const feedback = form.get("feedback")?.toString();

      if (!taskId || !agentVersionId || !feedback) {
        return new Response("Missing required fields", { status: 400 });
      }

      // Get the original task and agent version
      const [task] = await db.query({
        pk: "AGENT_TASK",
        sk: `${userEmail}#${taskId}`
      });

      const [agentVersion] = await db.query({
        pk: "AGENT_VERSION",
        sk: agentVersionId
      });

      if (!task || !agentVersion) {
        return new Response("Task or agent not found", { status: 404 });
      }

      // Reconstruct the response from stream records
      const response = await reconstructResponse(taskId, userEmail);

      // Find the latest Coach agent version
      const coachVersions = await db.query({
        pk: "AGENT_VERSION"
      });

      // Filter for Coach agents and sort by SK (ULID) in descending order
      const latestCoach = coachVersions
        .filter(v => v.data.name === "Coach" && !v.data.hidden)
        .sort((a, b) => b.sk.localeCompare(a.sk))[0];

      if (!latestCoach) {
        return new Response("Coach agent not found", { status: 404 });
      }

      // Create coaching prompt with target agent's instructions
      const coachPrompt = `<agent_name>${agentVersion.data.name}</agent_name>
<agent_version>${agentVersion.sk}</agent_version>

<current_instructions>
${agentVersion.data.prompt}
</current_instructions>

<task_execution>
<prompt>${task.data.prompt}</prompt>
<response>${response}</response>
</task_execution>

<feedback>${feedback}</feedback>`;

      // Redirect to invoke page with coach version and prompt
      const invokeUrl = new URL("/agents/invoke", req.url);
      invokeUrl.searchParams.set("id", latestCoach.sk);
      invokeUrl.searchParams.set("prompt", coachPrompt);
      
      return Response.redirect(invokeUrl.toString());
    } catch (error) {
      console.error('Error processing feedback:', error);
      return new Response("Failed to process feedback", { status: 500 });
    }
  }
};
