/**
 * Tasks page showing agent execution history and feedback.
 */

import { Handlers, PageProps } from "$fresh/server.ts";
import { db } from "$db";
import { AgentVersion, AgentVersionData } from "../../components/AgentVersion.tsx";
import { LLMStream } from "../../islands/LLMStream.tsx";
import { AgentFeedback } from "../../components/AgentFeedback.tsx";
import TextWithCopyButton from "../../islands/TextWithCopyButton.tsx";

interface TasksData {
  tasks: {
    id: string;
    timestamp: string;
    agentVersion: AgentVersionData;
    prompt: string;
  }[];
  error?: string;
}

export const handler: Handlers<TasksData> = {
  async GET(req, ctx) {
    try {
      const userEmail = ctx.state.user?.email;
      
      if (!userEmail) {
        return new Response("Unauthorized", { status: 401 });
      }

      const tasks = await db.query({
        pk: "AGENT_TASK",
        sk: `${userEmail}#`,
        reverse: true
      });

      const tasksWithVersions = await Promise.all(
        tasks.map(async (task) => {
          const versions = await db.query({
            pk: "AGENT_VERSION",
            sk: task.data.agentVersionId
          });

          const baseTaskId = task.sk.replace(`${userEmail}#`, '');

          return {
            id: baseTaskId,
            timestamp: task.data.timestamp,
            agentVersion: versions[0] ? {
              id: versions[0].sk,
              name: versions[0].data.name,
              prompt: versions[0].data.prompt,
              timestamp: versions[0].data.timestamp
            } : undefined,
            prompt: task.data.prompt
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
          class="btn btn-error btn-sm"
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
              <TextWithCopyButton 
                text={task.prompt}
              />
            </div>

            <div class="mt-4">
              <div class="text-sm font-medium mb-1">Response</div>
              <div class="bg-gray-50 p-2 rounded">
                <LLMStream taskId={task.id} />
              </div>
            </div>

            {task.agentVersion && (
              <AgentFeedback
                taskId={task.id}
                agentVersion={task.agentVersion}
                prompt={task.prompt}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
