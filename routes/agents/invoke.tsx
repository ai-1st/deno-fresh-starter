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
import { createAmazonBedrock } from 'https://esm.sh/@ai-sdk/amazon-bedrock';
import { tool, generateText, streamText } from 'https://esm.sh/ai';
import { TavilyClient } from "https://esm.sh/@agentic/tavily";
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
      const versions = await db.get({
        pk: "AGENT_VERSION",
        sk: versionId,
      });

      if (versions.length === 0) {
        console.error("Version not found:", versionId);
        throw new Error("Version not found");
      }

      const currentVersion = versions[0];
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
    ...createAISDKTools(tavily),
    newVersion: newVersionTool
  };
  return tools;
}

interface StreamChunk {
  data?: string;
  error?: string;
  sequence: number;
  last: boolean;
}

const CHUNK_SIZE = 100;

/**
 * Stream text completion with tool support.
 * Enables AI to perform web searches using Tavily during generation.
 */
async function* llmStream(system: string, prompt: string, maxSteps: number): AsyncGenerator<StreamChunk> {
  let sequence = 1;
  try {
    console.log("Prompt:", prompt);
    const { textStream } = streamText({
      model: getModel(),
      prompt,
      system,
      tools: getTools(),
      maxSteps,
      onStepFinish: (step) => {
        if (step.type === 'tool_calls') {
          for (const call of step.toolCalls) {
            console.log("Tool called:", {
              tool: call.name,
              args: call.args,
              result: call.result
            });
          }
        } else if (step.type === 'message') {
          console.log("AI message:", step.message.content);
        }
      }
    });

    let bigChunk = "";
    for await (const chunk of textStream) {
      if (chunk) {
        bigChunk += chunk;
        if (bigChunk.length > CHUNK_SIZE) {
          yield { data: bigChunk, sequence: sequence++, last: false };  
          bigChunk = "";
        }
      }
    }
    yield { data: bigChunk, sequence: sequence++, last: true }; 
  } catch (error) {
    console.error("Streaming error:", error);
    yield { error: error.message, sequence: sequence++, last: true };
  }
}

interface AgentVersion {
  id: string;
  name: string;
  prompt: string;
  changelog: string;
}

interface InvokePageData {
  agent: AgentVersion;
  llmStreamId?: string;
  prefilledPrompt?: string;
}

export default function InvokePage({ data }: PageProps<InvokePageData>) {
  const { agent, llmStreamId, prefilledPrompt } = data;

  return (
    <div class="p-4">
      {agent && (
        <AgentVersion 
          version={agent} 
          showInvoke={false}
          showNewVersion={true}
        />
      )}

      {!llmStreamId ? (
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
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Output</h2>
            <LLMStream llmStreamId={llmStreamId} />
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
    const llmStreamId = url.searchParams.get("llmStreamId");
    const prefilledPrompt = url.searchParams.get("prompt") || undefined;

    if (!versionId) {
      return new Response("Missing version ID", { status: 400 });
    }

    const versions = await db.get({
      pk: "AGENT_VERSION",
      sk: versionId,
    });

    if (versions.length === 0) {
      return new Response("Agent version not found", { status: 404 });
    }

    const version = versions[0];
    return ctx.render({
      agent: {
        id: version.sk,
        ...version.data,
      },
      llmStreamId,
      prefilledPrompt
    });
  },

  async POST(req) {
    const url = new URL(req.url);
    const versionId = url.searchParams.get("id");
    if (!versionId) {
      return new Response("Missing version ID", { status: 400 });
    }

    const versions = await db.get({
      pk: "AGENT_VERSION",
      sk: versionId,
    });

    if (versions.length === 0) {
      return new Response("Agent version not found", { status: 404 });
    }

    const version = versions[0];
    const form = await req.formData();
    const prompt = form.get("prompt") as string;

    // Create a new llmStream ID
    const llmStreamId = ulid();
    const taskId = ulid();

    // Create a new task record
    await db.set({
      pk: "AGENT_TASK",
      sk: `anon#${taskId}`,
      data: {
        agentVersionId: versionId,
        prompt,
        response: "",
        llmStreamId,
      },
    });

    // Start background processing
    processInBackground(llmStreamId, version.data.prompt, prompt, taskId, versionId);

    // Redirect to the same page with llmStream ID
    const currentUrl = new URL(req.url);
    currentUrl.searchParams.set("llmStreamId", llmStreamId);
    return Response.redirect(currentUrl.toString());
  },
};

// Background processing function
async function processInBackground(
  llmStreamId: string, 
  systemPrompt: string, 
  userPrompt: string,
  taskId: string,
  versionId: string,
) {
  let fullResponse = "";
  for await (const chunk of llmStream(systemPrompt, userPrompt, 5)) {
    // Update the database with current progress
    await db.set({
      pk: `LLMSTREAM#${llmStreamId}`,
      sk: chunk.sequence.toString().padStart(6, '0'),
      data: {
        output: chunk.data,
        error: chunk.error,
        isComplete: chunk.last
      }
    });

    // Accumulate the response
    if (chunk.data) {
      fullResponse += chunk.data;
    }

    // If this is the last chunk, update the task with the full response
    if (chunk.last) {
      await db.set({
        pk: "AGENT_TASK",
        sk: `anon#${taskId}`,
        data: {
          agentVersionId: versionId,
          prompt: userPrompt,
          response: fullResponse,
          llmStreamId,
          timestamp: new Date().toISOString()
        },
      });
    }
  }
}
