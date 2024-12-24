/**
 * Coach route for improving agent prompts based on feedback.
 * Shows streaming suggestions and automatically creates new versions.
 */

import { Handlers, PageProps } from "$fresh/server.ts";
import { llmCoach } from "../../core/ai.ts";
import { db } from "$db";
import { ulid } from "$ulid/mod.ts";
import { LLMStream } from "../../islands/LLMStream.tsx";

interface CoachData {
  taskId?: string;
  agentVersionId?: string;
  llmStreamId?: string;
  error?: string;
}

export const handler: Handlers<CoachData> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const agentVersionId = url.searchParams.get("agentVersionId") || "";
    const taskId = url.searchParams.get("taskId") || "";
    const feedback = url.searchParams.get("feedback") || "";

    if (!agentVersionId || !taskId || !feedback) {
      return ctx.render({ error: "Missing required parameters" });
    }

    // Get agent version
    const agentVersions = await db.query({
      pk: "AGENT_VERSION",
      sk: agentVersionId
    });

    if (agentVersions.length === 0) {
      return ctx.render({ error: "Agent version not found" });
    }

    const agentVersion = agentVersions[0];

    // Get task details
    const tasks = await db.query({
      pk: "AGENT_TASK",
      sk: taskId
    });

    if (tasks.length === 0) {
      return ctx.render({ error: "Task not found" });
    }

    const task = tasks[0];

    // Start coach stream
    const llmStreamId = ulid();
    const stream = await llmCoach(
      agentVersion.data.prompt,
      task.data.prompt,
      task.data.response || "",
      feedback
    );

    // Store stream
    await db.set({
      pk: "LLM_STREAM",
      sk: llmStreamId,
      data: {
        agentVersionId,
        taskId,
        feedback,
        timestamp: new Date().toISOString()
      },
      ttl: Date.now() + (24 * 60 * 60 * 1000) // 1 day TTL
    });

    return ctx.render({
      taskId,
      agentVersionId,
      llmStreamId
    });
  }
};

export default function CoachPage({ data }: PageProps<CoachData>) {
  if (data.error) {
    return <div class="p-4">
      <h1 class="text-2xl font-bold mb-4">Error</h1>
      <div class="text-red-500">{data.error}</div>
    </div>;
  }

  const { llmStreamId } = data;

  return (
    <div class="p-4">
      <h1 class="text-2xl font-bold mb-4">Improving Agent Prompt</h1>
      
      {llmStreamId && (
        <div>
          <h2 class="text-xl font-semibold mb-2">Suggested Improvements</h2>
          <div class="bg-base-200 rounded p-4">
            <LLMStream llmStreamId={llmStreamId} />
          </div>
          
          <form method="POST" action="/agents/coach/apply" class="mt-6">
            <input type="hidden" name="llmStreamId" value={llmStreamId} />
            <div class="flex gap-4">
              <button
                type="submit"
                name="action"
                value="confirm"
                class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Apply Changes
              </button>
              <button
                type="submit"
                name="action"
                value="reject"
                class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Reject Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {!llmStreamId && (
        <div class="text-gray-600">
          No suggestions available. Submit agent feedback to get improvement suggestions.
        </div>
      )}
    </div>
  );
}
