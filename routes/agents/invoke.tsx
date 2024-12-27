/**
 * Agent invocation page with streaming response.
 * Handles both normal agent invocations and coaching requests.
 */

import { Handlers, PageProps } from "$fresh/server.ts";

import { ulid } from "$ulid/mod.ts";
import { db } from "$db";
import { AgentVersion } from "../../components/AgentVersion.tsx";
import { LLMStream } from "../../islands/LLMStream.tsx";
import { AgentFeedback } from "../../components/AgentFeedback.tsx";
import TextWithCopyButton from "../../islands/TextWithCopyButton.tsx";
import { createAmazonBedrock } from 'https://esm.sh/@ai-sdk/amazon-bedrock';
import { tool, streamText } from 'https://esm.sh/ai';
import { TavilyClient } from "https://esm.sh/@agentic/tavily";
import { FirecrawlClient } from 'https://esm.sh/@agentic/firecrawl';
import { createAISDKTools } from 'https://esm.sh/@agentic/ai-sdk';
import { z } from "https://deno.land/x/zod/mod.ts";

function getModel() {
    const bedrock = createAmazonBedrock({
      region: Deno.env.get('AWS_REGION'),
      accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY'),
  });

  const model = bedrock("us.anthropic.claude-3-5-sonnet-20241022-v2:0");
  return model;
}

async function getTools(agentName: string, userEmail: string) {
  const tavily = new TavilyClient({
    apiKey: Deno.env.get("TAVILY_API_KEY")
  });

  const firecrawl = new FirecrawlClient();

  // Tool for creating new agent versions
  const newVersionTool = tool({
    description: "Creates a new version of an agent with improved instructions. The previous version will be archived.",
    parameters: z.object({
      versionId: z.string().describe("Current version ID of the agent to improve"),
      changelog: z.string().describe("Description of the improvements made"),
      instructions: z.string().describe("New improved instructions for the agent")
    }),
    execute: async ({ versionId, changelog, instructions }) => {
      console.log("newVersionTool called with:", {
        versionId,
        changelog,
        instructionsLength: instructions.length
      });

      // Get current version
      const currentVersion = await db.getOne({
        pk: "AGENT_VERSION",
        sk: versionId,
      });

      if (!currentVersion) {
        console.error("Version not found:", versionId);
        throw new Error("Version not found");
      }

      console.log("Current version found:", {
        name: currentVersion.data.name,
        id: currentVersion.sk
      });
      
      // Create new version
      const newVersionId = ulid();
      console.log("Creating new version:", newVersionId);
      
      await db.set({
        pk: "AGENT_VERSION",
        sk: newVersionId,
        data: {
          name: currentVersion.data.name,
          prompt: instructions,
          changelog,
          previousVersion: versionId,
          timestamp: new Date().toISOString()
        }
      });

      await db.set({
        pk: `AGENTS_BY_NAME/${userEmail}`,
        sk: currentVersion.data.name,
        data: newVersionId
      });

      console.log("New version created successfully:", newVersionId);
      return { newVersionId };
    }
  });

  const agents = await db.query({
    pk: `AGENTS_BY_NAME/${userEmail}`,
  });
  const agentNames = agents.map(a => a.sk).filter(a => a !== agentName).join(", ");
  console.log("Available agents:", agentNames);

  // Tool for invoking other agents
  const invokeAgentTool = tool({
    description: `Sends the prompt to another agent by name. Available agents: ${agentNames}. Returns the response from the agent.`,
    parameters: z.object({
      agentName: z.string().describe(async () => {
        // Get list of available agents for this user
        return `Name of the agent to invoke. Available agents: ${agentNames}`;
      }),
      prompt: z.string().describe("The prompt to send to the agent")
    }),
    execute: async ({ agentName, prompt }) => {
      console.log("invokeAgentTool called with:", { agentName, prompt });

      // Get agent version ID
      const agentRef = await db.getOne({
        pk: `AGENTS_BY_NAME/${userEmail}`,
        sk: agentName
      });

      if (!agentRef) {
        return `Agent ${agentName} not found. Available agents: ${agentNames}`;
      }

      const versionId = agentRef.data;
      console.log("Found agent version:", versionId);

      // Get agent version details
      const version = await db.getOne({
        pk: "AGENT_VERSION",
        sk: versionId
      });

      if (!version) {
        throw new Error(`Agent version '${versionId}' not found`);
      }

      // Create a new task
      const taskId = ulid();
      await db.set({
        pk: "AGENT_TASK",
        sk: `${userEmail}#${taskId}`,
        data: {
          agentVersionId: versionId,
          prompt,
          timestamp: new Date().toISOString(),
          isComplete: false
        }
      });

      // Start background processing
      processInBackground(version.data.name, version.data.prompt, prompt, taskId, userEmail);

      // Poll for completion
      let attempts = 0;
      const MAX_ATTEMPTS = 60; // 5 minutes with 5s interval
      let finalText = "";

      while (attempts < MAX_ATTEMPTS) {
        const task = await db.getOne({
          pk: "AGENT_TASK",
          sk: `${userEmail}#${taskId}`
        });

        if (task.data.isComplete) {
          // Get all stream parts
          const parts = await db.query({
            pk: "TASK_STREAM#" + taskId,
          });

          // Merge text-delta parts
          finalText = parts
            .filter(p => p.data.type === "text-delta")
            .map(p => p.data.textDelta)
            .join("");

          break;
        }

        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
        attempts++;
      }

      if (attempts >= MAX_ATTEMPTS) {
        throw new Error("Task timed out after 5 minutes");
      }

      return finalText;
    }
  });

  const tools = {
    ...createAISDKTools(tavily, firecrawl),
    newVersion: newVersionTool,
    invokeAgent: invokeAgentTool
  };
  return tools;
}

interface AgentVersion {
  id: string;
  name: string;
  prompt: string;
  changelog: string;
}

interface InvokePageData {
  agent: AgentVersion;
  taskId?: string;
  prefilledPrompt?: string;
}

export default function InvokePage({ data }: PageProps<InvokePageData>) {
  const { agent, taskId, prefilledPrompt } = data;

  return (
    <div class="p-4">
      {agent && (
        <div class="flex justify-between items-start gap-4">
          <AgentVersion 
            version={agent} 
            showInvoke={true}
            showNewVersion={true}
          />
        </div>
      )}

      {!taskId ? (
        <form method="POST" class="mt-6">
          <input type="hidden" name="id" value={agent?.id} />
          <div>
            <label class="block text-sm font-medium mb-1" htmlFor="prompt">
              Your Prompt
            </label>
            <textarea
              id="prompt"
              name="prompt"
              required
              rows={4}
              class="textarea textarea-bordered w-full"
              placeholder="Enter your prompt for the agent"
              defaultValue={prefilledPrompt}
            ></textarea>
          </div>

          <button type="submit" class="btn btn-primary">
            Execute
          </button>
        </form>
      ) : (
        <div class="card bg-base-100 shadow-xl mt-6">
          <div class="card-body">
            <div class="mb-4">
              <div class="text-sm font-medium mb-1">Prompt</div>
              <TextWithCopyButton text={prefilledPrompt || ""} />
            </div>

            <h2 class="card-title">Output</h2>
            <LLMStream taskId={taskId} />

            {agent && (
              <AgentFeedback
                taskId={taskId}
                agentVersion={agent}
                prompt={prefilledPrompt || ""}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export const handler: Handlers = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const versionId = url.searchParams.get("id");
    const taskId = url.searchParams.get("taskId");

    if (!versionId) {
      return new Response("Missing version ID", { status: 400 });
    }

    const version = await db.getOne({
      pk: "AGENT_VERSION",
      sk: versionId,
    });

    if (!version) {
      return new Response("Agent version not found", { status: 404 });
    }

    const task = await db.getOne({
      pk: "AGENT_TASK",
      sk: `${ctx.state.user?.email}#${taskId}`
    });

    return ctx.render({
      agent: {
        id: version.sk,
        timestamp: version.data.timestamp,
        ...version.data,
      },
      taskId,
      prefilledPrompt: task?.data.prompt
    });
  },

  async POST(req, ctx) {
    const form = await req.formData();
    const versionId = form.get("id")?.toString();
    const prompt = form.get("prompt")?.toString();
    const isFeedback = form.get("feedback") === "true";

    const userEmail = ctx.state.user?.email;
    if (!userEmail) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (isFeedback) {
      // Handle feedback submission
      const taskId = form.get("taskId")?.toString();
      const agentVersionId = form.get("agentVersionId")?.toString();
      const feedbackText = form.get("feedback_text")?.toString();

      if (!taskId || !agentVersionId || !feedbackText) {
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
      const streamParts = await db.query({
        pk: "TASK_STREAM#" + taskId
      });

      let response = "";
      for (const part of streamParts
        .sort((a, b) => a.sk.localeCompare(b.sk))
        .map(item => item.data as StreamPart)
      ) {
        if (part.type === 'text-delta') {
          response += part.textDelta;
        } else if (part.type === 'tool-call') {
          response += `\n[Tool Call: ${part.toolName}]\n${JSON.stringify(part.args, null, 2)}\n`;
        }
      }

      // Find the latest Coach agent version
      const coachVersions = await db.query({
        pk: "AGENT_VERSION"
      });

      const latestCoach = coachVersions
        .filter(v => v.data.name === "Coach" && !v.data.hidden)
        .sort((a, b) => b.sk.localeCompare(a.sk))[0];

      if (!latestCoach) {
        return new Response("Coach agent not found", { status: 404 });
      }

      // Create coaching prompt
      const coachPrompt = `<agent_name>${agentVersion.data.name}</agent_name>
<agent_version>${agentVersion.sk}</agent_version>

<current_instructions>
${agentVersion.data.prompt}
</current_instructions>

<task_execution>
<prompt>${task.data.prompt}</prompt>
<response>${response}</response>
</task_execution>

<feedback>${feedbackText}</feedback>`;

      // Create a new task for the coach
      const newTaskId = ulid();
      await db.set({
        pk: "AGENT_TASK",
        sk: `${userEmail}#${newTaskId}`,
        data: {
          agentVersionId: latestCoach.sk,
          prompt: coachPrompt,
          timestamp: new Date().toISOString(),
          isComplete: false
        }
      });

      // Start background processing immediately
      processInBackground(
        latestCoach.data.name,
        latestCoach.data.prompt, 
        coachPrompt, 
        newTaskId, 
        userEmail
      );

      // Redirect to the task output page
      const currentUrl = new URL(req.url);
      currentUrl.searchParams.set("id", latestCoach.sk);
      currentUrl.searchParams.set("taskId", newTaskId);
      return Response.redirect(currentUrl.toString());

    } else {
      // Handle normal agent invocation
      if (!versionId || !prompt) {
        return new Response("Missing version ID or prompt", { status: 400 });
      }

      const version = await db.getOne({
        pk: "AGENT_VERSION",
        sk: versionId,
      });

      if (!version) {
        return new Response("Agent version not found", { status: 404 });
      }

      // Create a new task
      const taskId = ulid();
      await db.set({
        pk: "AGENT_TASK",
        sk: `${userEmail}#${taskId}`,
        data: {
          agentVersionId: versionId,
          prompt,
          timestamp: new Date().toISOString(),
          isComplete: false
        }
      });

      // Start background processing
      processInBackground(
        version.data.name,
        version.data.prompt, 
        prompt, 
        taskId, 
        userEmail
      );

      // Redirect to the same page with task ID
      const currentUrl = new URL(req.url);
      currentUrl.searchParams.set("taskId", taskId);
      return Response.redirect(currentUrl.toString());
    }
  }
};

// Background processing function
async function processInBackground(
  agentName: string,
  systemPrompt: string, 
  userPrompt: string,
  taskId: string,
  userEmail: string
) {
  const parts = [];
  try {
    console.log(`Invoking ${agentName} with prompt:`, userPrompt);
    const result = await streamText({
      model: getModel(),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      tools: await getTools(agentName, userEmail),
      maxSteps: 10
    });
    console.log("Invoked, streaming results");
    const CHUNK_SIZE = 100;
    let chunkId = 1;
    let mergedText = "";
    
    for await (const part of result.fullStream) {
      parts.push(part);
      
      // Merge text-delta parts
      if (part.type === 'text-delta' && mergedText.length < CHUNK_SIZE) {
        console.log("--" + part.textDelta);
        mergedText += part.textDelta;
        continue;
      }
      
      if (mergedText) {
        await db.set({
          pk: "TASK_STREAM#" + taskId,
          sk: chunkId.toString().padStart(6, '0'),
          data: {
            type: 'text-delta',
            textDelta: mergedText
          }
        });
        chunkId++;
        mergedText = ""; 
      }

      try {
        await db.set({
          pk: "TASK_STREAM#" + taskId,
          sk: chunkId.toString().padStart(6, '0'),
          data: part
        });
      } catch (error) {
        console.error('Error writing item into DB:', error);
        console.error('Item:', part);
      }
      chunkId++;
    }
    if (mergedText) {
      await db.set({
        pk: "TASK_STREAM#" + taskId,
        sk: chunkId.toString().padStart(6, '0'),
        data: {
          type: 'text-delta',
          textDelta: mergedText
        }
      });
    }
    await db.update({
      pk: "AGENT_TASK",
      sk: `${userEmail}#${taskId}`,
      data: {
        isComplete: true
      }
    });
  } catch (error) {
    console.error('Error in processInBackground:', error);
    await db.update({
      pk: "AGENT_TASK",
      sk: `${userEmail}#${taskId}`,
      data: {
        error: error instanceof Error ? error.message : String(error),
        isComplete: true
      }
    });
  }
}
