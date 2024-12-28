/**
 * Create new agent version with system prompt.
 * Supports creating from scratch or from existing version.
 */

import { Handlers, PageProps } from "$fresh/server.ts";
import { db } from "$db";
import { ulid } from "$ulid/mod.ts";

interface NewAgentData {
  prefill?: {
    name: string;
    prompt: string;
    previousVersion: string;
    changelog?: string;
    tools?: {
      webSearch: boolean;
      urlScrape: boolean;
      agentCall: boolean;
    };
  };
  error?: string;
}

export const handler: Handlers<NewAgentData> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const fromVersion = url.searchParams.get("fromVersion");

    if (fromVersion) {
      const versions = await db.query({
        pk: "AGENT_VERSION",
        sk: fromVersion
      });

      if (versions.length > 0) {
        const version = versions[0];
        return ctx.render({
          prefill: {
            name: version.data.name,
            prompt: version.data.prompt,
            previousVersion: version.sk,
            tools: version.data.tools || {
              webSearch: false,
              urlScrape: false,
              agentCall: false
            }
          }
        });
      }
    }

    return ctx.render({});
  },

  async POST(req, ctx) {
    const form = await req.formData();
    const name = form.get("name")?.toString();
    const prompt = form.get("prompt")?.toString();
    const previousVersion = form.get("previousVersion")?.toString();
    const changelog = form.get("changelog")?.toString();
    const tools = {
      webSearch: form.get("tool_web_search") === "on",
      urlScrape: form.get("tool_url_scrape") === "on",
      agentCall: form.get("tool_agent_call") === "on"
    };

    if (!name || !prompt) {
      return new Response("Name and prompt are required", { status: 400 });
    }

    // Get user email from context state
    const userEmail = ctx.state.user?.email;
    if (!userEmail) {
      return new Response("User not authenticated", { status: 403 });
    }

    const versionId = ulid();
    await db.set({
      pk: "AGENT_VERSION",
      sk: versionId,
      data: {
        name,
        prompt,
        previousVersion,
        changelog,
        timestamp: new Date().toISOString(),
        tools
      }
    });

    // Upsert AGENTS_BY_NAME entity
    await db.set({
      pk: `AGENTS_BY_NAME/${userEmail}`,
      sk: name,
      data: versionId
    });

    return new Response("", {
      status: 303,
      headers: { Location: "/agents/versions" },
    });
  },
};

export default function NewAgent({ data }: PageProps<NewAgentData>) {
  const { prefill, error } = data;

  return (
    <div class="p-4">
      <h1 class="text-2xl font-bold mb-4">
        {prefill ? "Create New Version" : "Create New Agent"}
      </h1>

      {error && (
        <div class="text-red-500 mb-4">{error}</div>
      )}

      <form method="POST" class="max-w-2xl">
        {prefill && (
          <input
            type="hidden"
            name="previousVersion"
            value={prefill.previousVersion}
          />
        )}

        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text text-sm">Name</span>
          </label>
          <input
            type="text"
            name="name"
            class="input input-bordered input-sm"
            defaultValue={prefill?.name}
            required
          />
        </div>

        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text text-sm">System Prompt</span>
          </label>
          <textarea
            name="prompt"
            rows={20}
            class="textarea textarea-bordered text-sm"
            defaultValue={prefill?.prompt}
            required
          ></textarea>
        </div>

        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text text-sm">Available Tools</span>
          </label>
          <div class="flex flex-col gap-2">
            <label class="flex items-center gap-2">
              <input 
                type="checkbox" 
                name="tool_web_search" 
                class="checkbox checkbox-sm"
                defaultChecked={prefill?.tools?.webSearch}
              />
              <span class="text-sm">Tavily Web Search</span>
            </label>
            <label class="flex items-center gap-2">
              <input 
                type="checkbox" 
                name="tool_url_scrape" 
                class="checkbox checkbox-sm"
                defaultChecked={prefill?.tools?.urlScrape}
              />
              <span class="text-sm">Firecrawl Scrape URLs</span>
            </label>
            <label class="flex items-center gap-2">
              <input 
                type="checkbox" 
                name="tool_agent_call" 
                class="checkbox checkbox-sm"
                defaultChecked={prefill?.tools?.agentCall}
              />
              <span class="text-sm">Calling other Agents</span>
            </label>
          </div>
        </div>

        {prefill && (
          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text text-sm">Change Description</span>
            </label>
            <input 
              type="text"
              name="changelog"
              class="input input-bordered input-sm"
              placeholder="Describe what changes you made to the instructions"
            />
          </div>
        )}

        <div class="flex gap-4">
          <button
            type="submit"
            class="btn btn-primary btn-sm"
          >
            {prefill ? "Create New Version" : "Create Agent"}
          </button>

          <a
            href="/agents/versions"
            class="btn btn-ghost btn-sm"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
