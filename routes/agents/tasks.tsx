/**
 * Tasks page showing agent execution history and feedback.
 */

import { Handlers, PageProps } from "$fresh/server.ts";
import { db } from "$db";
import { AgentVersion, AgentVersionData } from "../../components/AgentVersion.tsx";
import { LLMStream } from "../../islands/LLMStream.tsx";
import { ulid } from "$ulid/mod.ts";

interface TasksData {
  tasks: {
    id: string;
    timestamp: string;
    agentVersion: AgentVersionData;
    prompt: string;
    llmStreamId: string;
  }[];
  error?: string;
}

export const handler: Handlers<TasksData> = {
  async GET(req, ctx) {
    try {
      const tasks = await db.query({
        pk: "AGENT_TASK",
        limit: 10,
        reverse: true
      });

      const tasksWithVersions = await Promise.all(
        tasks.map(async (task) => {
          const versions = await db.query({
            pk: "AGENT_VERSION",
            sk: task.data.agentVersionId
          });

          return {
            id: task.sk,
            timestamp: task.data.timestamp,
            agentVersion: versions[0] ? {
              id: versions[0].sk,
              name: versions[0].data.name,
              prompt: versions[0].data.prompt
            } : undefined,
            prompt: task.data.prompt,
            llmStreamId: task.data.llmStreamId
          };
        })
      );

      return ctx.render({ tasks: tasksWithVersions });
    } catch (error) {
      console.error("Error loading tasks:", error);
      return ctx.render({ 
        tasks: [],
        error: "Failed to load tasks"
      });
    }
  },

  async POST(req, ctx) {
    try {
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
        sk: taskId
      });

      const [agentVersion] = await db.query({
        pk: "AGENT_VERSION",
        sk: agentVersionId
      });

      if (!task || !agentVersion) {
        return new Response("Task or agent not found", { status: 404 });
      }

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
<response>${task.data.response || ""}</response>
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

export default function TasksPage({ data }: PageProps<TasksData>) {
  const { tasks, error } = data;

  if (error) {
    return <div class="p-4">
      <h1 class="text-2xl font-bold mb-4">Error</h1>
      <div class="text-red-500">{error}</div>
    </div>;
  }

  return (
    <div class="p-4">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Tasks</h1>
        <a 
          href="/agents/cleanup"
          class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Cleanup
        </a>
      </div>

      <div class="space-y-6">
        {tasks.map((task) => (
          <div key={task.id} class="border rounded p-4">
            <AgentVersion 
              version={task.agentVersion} 
              showInvoke={true}
              showNewVersion={false}
            />
            
            <div class="mt-4">
              <div class="text-sm font-medium mb-1">Task Prompt</div>
              <div class="bg-gray-50 p-2 rounded whitespace-pre-wrap">
                {task.prompt}
              </div>
            </div>

            <div class="mt-4">
              <div class="text-sm font-medium mb-1">Response</div>
              <div class="bg-gray-50 p-2 rounded">
                <LLMStream llmStreamId={task.llmStreamId} />
              </div>
            </div>

            <form 
              method="POST" 
              class="mt-4"
            >
              <input type="hidden" name="agentVersionId" value={task.agentVersion?.id} />
              <input type="hidden" name="taskId" value={task.id} />
              
              <div class="flex flex-col gap-2">
                <textarea
                  name="feedback"
                  rows={5}
                  placeholder="Enter feedback to improve the agent..."
                  required
                  class="w-full px-3 py-2 border rounded"
                />
                <button
                  type="submit"
                  class="self-end px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Improve
                </button>
              </div>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
