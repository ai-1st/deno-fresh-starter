/**
 * Agent versions page showing version history and system prompts.
 */

import { Handlers, PageProps } from "$fresh/server.ts";
import { db } from "$db";
import { AgentVersion, AgentVersionData } from "../../components/AgentVersion.tsx";

interface VersionsData {
  versions: AgentVersionData[];
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
        timestamp: item.data.timestamp,
        previousVersion: item.data.previousVersion,
        changelog: item.data.changelog,
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
          class="btn btn-primary btn-sm"
        >
          New Agent
        </a>
      </div>

      <div class="space-y-6">
        {versions.map((version) => (
          <AgentVersion 
            key={version.id} 
            version={version}
            showInvoke={true}
            showNewVersion={true}
          />
        ))}
      </div>
    </div>
  );
}
