/**
 * Agent invocation page with streaming response.
 * Handles both normal agent invocations and coaching requests.
 */

import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { ulid } from "$ulid/mod.ts";
import { db } from "$db";
import { AgentVersion, AgentVersionData } from "../../components/AgentVersion.tsx";
import { LLMStream } from "../../islands/LLMStream.tsx";
import { AgentFeedback } from "../../components/AgentFeedback.tsx";
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

function getTools() {
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

      // Archive old version
      console.log("Archiving old version:", currentVersion.sk);
      currentVersion.data.hidden = true;
      await db.set(currentVersion);

      console.log("New version created successfully:", newVersionId);
      return { newVersionId };
    }
  });

  const tools = {
    ...createAISDKTools(tavily, firecrawl),
    newVersion: newVersionTool
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
    const prefilledPrompt = url.searchParams.get("prompt") || undefined;

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

    return ctx.render({
      agent: {
        id: version.sk,
        timestamp: version.data.timestamp,
        ...version.data,
      },
      taskId,
      prefilledPrompt
    });
  },

  async POST(req) {
    const url = new URL(req.url);
    const versionId = url.searchParams.get("id");
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

    const form = await req.formData();
    const prompt = form.get("prompt") as string;

    // Create a new task ID
    const taskId = ulid();

    // Create a new task record
    await db.set({
      pk: "AGENT_TASK",
      sk: `anon#${taskId}`,
      data: {
        agentVersionId: versionId,
        prompt,
        startedAt: new Date().toISOString(),
        isComplete: false
      },
    });

    // Start background processing
    processInBackground(version.data.prompt, prompt, taskId, versionId);

    // Redirect to the same page with task ID
    const currentUrl = new URL(req.url);
    currentUrl.searchParams.set("taskId", taskId);
    return Response.redirect(currentUrl.toString());
  },
};

// Background processing function
async function processInBackground(
  systemPrompt: string, 
  userPrompt: string,
  taskId: string,
  versionId: string,
) {
  const parts: StreamPart[] = [];
  try {
    const result = await streamText({
      model: getModel(),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      tools: getTools(),
      maxSteps: 5
    });

    const CHUNK_SIZE = 100;
    let chunkId = 1;
    let mergedText = "";
    
    for await (const part of result.fullStream) {
      parts.push(part);
      
      // Merge text-delta parts
      if (part.type === 'text-delta' && mergedText.length < CHUNK_SIZE) {
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

      await db.set({
        pk: "TASK_STREAM#" + taskId,
        sk: chunkId.toString().padStart(6, '0'),
        data: part
      });
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
      sk: `anon#${taskId}`,
      data: {
        isComplete: true
      }
    });
  } catch (error) {
    console.error('Error in processInBackground:', error);
    await db.update({
      pk: "AGENT_TASK",
      sk: `anon#${taskId}`,
      data: {
        error: error instanceof Error ? error.message : String(error),
        isComplete: true
      }
    });
  }
}
