/**
 * Agent versions page showing version history and system prompts.
 */

import { Handlers, PageProps } from "$fresh/server.ts";
import { db } from "$db";

interface VersionsData {
  versions: {
    id: string;
    name: string;
    prompt: string;
    changelog?: string;
    previousVersion?: string;
    hidden?: boolean;
  }[];
  showHidden: boolean;
  error?: string;
}

export const handler: Handlers<VersionsData> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const showHidden = url.searchParams.get("showHidden") === "true";

    try {
      const results = await db.query({
        pk: "AGENT_VERSION",
        limit: 50,
        reverse: true
      });

      const versions = results.map(item => ({
        id: item.sk,
        name: item.data.name,
        prompt: item.data.prompt,
        changelog: item.data.changelog,
        previousVersion: item.data.previousVersion,
        hidden: item.data.hidden
      }))
      .filter(v => showHidden || !v.hidden);

      return ctx.render({ versions, showHidden });
    } catch (error) {
      console.error("Error loading versions:", error);
      return ctx.render({ 
        versions: [],
        showHidden,
        error: "Failed to load versions" 
      });
    }
  },

  async POST(req) {
    const form = await req.formData();
    const versionId = form.get("versionId")?.toString();
    const action = form.get("action")?.toString();

    if (!versionId || !action) {
      return new Response("Missing parameters", { status: 400 });
    }

    const versions = await db.query({
      pk: "AGENT_VERSION",
      sk: versionId
    });

    if (versions.length === 0) {
      return new Response("Version not found", { status: 404 });
    }

    const version = versions[0];
    version.data.hidden = action === "hide";
    await db.set(version);

    // Redirect back to versions page
    const url = new URL(req.url);
    return new Response("", {
      status: 303,
      headers: { Location: url.toString() }
    });
  }
};

export default function VersionsPage({ data }: PageProps<VersionsData>) {
  const { versions, showHidden, error } = data;

  if (error) {
    return <div class="p-4">
      <h1 class="text-2xl font-bold mb-4">Error</h1>
      <div class="text-red-500">{error}</div>
    </div>;
  }

  return (
    <div class="p-4">
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center gap-4">
          <h1 class="text-2xl font-bold">Agent Versions</h1>
          <form method="GET">
            <input 
              type="hidden" 
              name="showHidden" 
              value={showHidden ? "false" : "true"} 
            />
            <button 
              type="submit"
              class="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              {showHidden ? "Hide Archived" : "Show All"}
            </button>
          </form>
        </div>
        <a 
          href="/agents/new"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          New Agent
        </a>
      </div>

      <div class="space-y-6">
        {versions.map((version) => (
          <div key={version.id} class="border rounded p-4">
            <div class="flex gap-4">
              <div class="flex-none">
                <img
                  src={`https://robohash.org/${version.id}.png?set=set2&size=400x400`}
                  alt={version.name}
                  class="w-[100px] h-[100px] sm:w-[200px] sm:h-[200px] rounded-lg shadow-md"
                />
              </div>
              <div class="flex-1">
                <div class="flex justify-between items-start mb-4">
                  <div>
                    <h3 class="font-semibold text-xl">{version.name}</h3>
                    <div class="text-sm text-gray-500 font-mono">
                      {version.id}
                    </div>
                    {version.previousVersion && (
                      <div class="text-sm text-gray-500">
                        Previous version: {version.previousVersion}
                      </div>
                    )}
                    {version.hidden && (
                      <div class="text-sm text-orange-500 font-medium">
                        Archived Version
                      </div>
                    )}
                  </div>
                  <div class="flex gap-2">
                    <form method="POST" class="inline">
                      <input type="hidden" name="versionId" value={version.id} />
                      <input 
                        type="hidden" 
                        name="action" 
                        value={version.hidden ? "unhide" : "hide"} 
                      />
                      <button 
                        type="submit"
                        class="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        {version.hidden ? "Unarchive" : "Archive"}
                      </button>
                    </form>
                    <a
                      href={`/agents/invoke?id=${version.id}`}
                      class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Invoke
                    </a>
                    <a
                      href={`/agents/new?fromVersion=${version.id}`}
                      class="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      New Version
                    </a>
                  </div>
                </div>

                {version.changelog && (
                  <div class="mb-4">
                    <div class="text-sm font-medium mb-1">Changelog</div>
                    <div class="text-gray-600">{version.changelog}</div>
                  </div>
                )}

                <div>
                  <div class="text-sm font-medium mb-1">System Prompt</div>
                  <pre class="bg-gray-50 p-3 rounded overflow-auto whitespace-pre-wrap text-sm">
                    {version.prompt}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
