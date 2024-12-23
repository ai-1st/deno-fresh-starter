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
            previousVersion: version.sk
          }
        });
      }
    }

    return ctx.render({});
  },

  async POST(req) {
    const form = await req.formData();
    const name = form.get("name")?.toString();
    const prompt = form.get("prompt")?.toString();
    const previousVersion = form.get("previousVersion")?.toString();

    if (!name || !prompt) {
      return new Response("Name and prompt are required", { status: 400 });
    }

    const versionId = ulid();
    await db.set({
      pk: "AGENT_VERSION",
      sk: versionId,
      data: {
        name,
        prompt,
        previousVersion,
        timestamp: new Date().toISOString()
      }
    });

    // If this is a new version, archive the previous one
    if (previousVersion) {
      const versions = await db.query({
        pk: "AGENT_VERSION",
        sk: previousVersion
      });

      if (versions.length > 0) {
        const version = versions[0];
        version.data.hidden = true;
        await db.set(version);
      }
    }

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

        <div class="mb-4">
          <label class="block text-sm font-medium mb-1" for="name">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            class="w-full px-3 py-2 border rounded"
            defaultValue={prefill?.name}
          />
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium mb-1" for="prompt">
            System Prompt
          </label>
          <textarea
            id="prompt"
            name="prompt"
            required
            rows={10}
            class="w-full px-3 py-2 border rounded"
            placeholder="Enter the system prompt that defines this agent's behavior. Include any necessary examples directly in the prompt."
            defaultValue={prefill?.prompt}
          ></textarea>
        </div>

        <div class="flex gap-4">
          <button
            type="submit"
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {prefill ? "Create New Version" : "Create Agent"}
          </button>

          <a
            href="/agents/versions"
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
