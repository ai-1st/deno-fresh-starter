/**
 * Agent versions page showing version history and system prompts.
 */

import { Handlers, PageProps } from "$fresh/server.ts";
import { db } from "$db";
import { AgentVersion, AgentVersionData } from "../../components/AgentVersion.tsx";

interface VersionsData {
  versions: AgentVersionData[];
  error?: string;
}

export const handler: Handlers<VersionsData> = {
  async GET(req, ctx) {
    // Get user email from context state
    const userEmail = ctx.state.user?.email;
    if (!userEmail) {
      return ctx.renderNotFound();
    }

    try {
      // First, fetch agent names for this user
      const agentNames = await db.query({
        pk: `AGENTS_BY_NAME/${userEmail}`,
        limit: 50
      });

      // Fetch versions for each agent name
      const versionsPromises = agentNames.map(async (agent) => {
        const versions = await db.query({
          pk: "AGENT_VERSION",
          sk: agent.data,
          limit: 1
        });
        return versions[0];
      });

      const versions = await Promise.all(versionsPromises);

      const processedVersions = versions
        .filter(v => v) // Remove any null/undefined results
        .map(item => ({
          id: item.sk,
          name: item.data.name,
          prompt: item.data.prompt,
          timestamp: item.data.timestamp,
          previousVersion: item.data.previousVersion,
          changelog: item.data.changelog,
        }));

      return ctx.render({ versions: processedVersions });
    } catch (error) {
      console.error("Error loading versions:", error);
      return ctx.render({ 
        versions: [],
        error: "Failed to load versions" 
      });
    }
  },

  async POST(req, ctx) {
    // Get user email from context state
    const userEmail = ctx.state.user?.email;
    if (!userEmail) {
      return ctx.renderNotFound();
    }

    const form = await req.formData();
    const agentId = form.get("agentId")?.toString();
    const agentName = form.get("agentName")?.toString();

    if (!agentId || !agentName) {
      return new Response("Missing agent ID or name", { status: 400 });
    }

    try {
      // Remove the agent from AGENTS_BY_NAME
      await db.delete({
        pk: `AGENTS_BY_NAME/${userEmail}`,
        sk: agentName
      });

      // Redirect back to versions page
      return new Response("", {
        status: 303,
        headers: { Location: "/agents/versions" }
      });
    } catch (error) {
      console.error("Error retiring agent:", error);
      return new Response("Failed to retire agent", { status: 500 });
    }
  },
};

export default function VersionsPage({ data }: PageProps<VersionsData>) {
  const { versions, error } = data;

  if (error) {
    return <div class="p-4">
      <h1 class="text-2xl font-bold mb-4">Error</h1>
      <div class="text-red-500">{error}</div>
    </div>;
  }

  return (
    <div class="p-4">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Agent Versions</h1>
        <a 
          href="/agents/new"
          class="btn btn-primary btn-sm"
        >
          New Agent
        </a>
      </div>

      <div class="space-y-6">
        {versions.map((version) => (
          <div key={version.id} class="relative">
            <AgentVersion 
              version={version}
              showInvoke={true}
              showNewVersion={true}
            />
            <form 
              method="POST" 
              class="absolute top-0 right-0 mt-2 mr-2"
            >
              <input 
                type="hidden" 
                name="agentId" 
                value={version.id} 
              />
              <input 
                type="hidden" 
                name="agentName" 
                value={version.name} 
              />
              <button 
                type="submit" 
                class="btn btn-xs btn-error"
                onclick="return confirm('Are you sure you want to retire this agent?');"
              >
                Retire
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
