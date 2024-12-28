/**
 * Agent versions page showing version history and system prompts.
 */

import { Handlers, PageProps } from "$fresh/server.ts";
import { db } from "$db";
import { AgentVersion, AgentVersionData } from "../../components/AgentVersion.tsx";
import { ulid } from "$ulid/mod.ts";

interface VersionsData {
  versions: AgentVersionData[];
  error?: string;
  showCoachForm?: boolean;
}

const COACH_INSTRUCTIONS = `You are an AI coach that is improving the instructions of other AI agents. You are provided with one case of some AI agent execution, including the agent name, input prompt and the output the agent. 

The user has rejected the output and provided some feedback, that will also be made available to you. You will be given the instruction set of the agent for analysis. You goal is to identify the improvements to the instructions so that such failures are prevented in the future. 

IMPORTANT RULES: 
Rule 1) Instructions should be precise and complemented by examples, if applicable. 
Rule 2) Provide detailed and deep context to support the agent decision making and explanations. Add to the context any relevant information received from the feedback. 
Rule 3) Use the tool to update the instructions. In the output, explain what you did.`;

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

      return ctx.render({ 
        versions: processedVersions,
        showCoachForm: processedVersions.length === 0 
      });
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
    
    // Handle Coach creation
    if (form.has("createCoach")) {
      const name = "Coach";
      const prompt = form.get("prompt")?.toString() || COACH_INSTRUCTIONS;
      const versionId = ulid();
      
      await db.set({
        pk: "AGENT_VERSION",
        sk: versionId,
        data: {
          name,
          prompt,
          timestamp: new Date().toISOString()
        }
      });

      await db.set({
        pk: `AGENTS_BY_NAME/${userEmail}`,
        sk: name,
        data: versionId
      });

      return new Response("", {
        status: 303,
        headers: { Location: "/agents/versions" }
      });
    }

    // Handle agent retirement
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
  const { versions, error, showCoachForm } = data;

  if (error) {
    return <div class="p-4">
      <h1 class="text-2xl font-bold mb-4">Error</h1>
      <div class="text-red-500">{error}</div>
    </div>;
  }

  if (showCoachForm) {
    return (
      <div class="p-4">
        <h1 class="text-2xl font-bold mb-4">Create Coach Agent</h1>
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Coach Agent</h2>
            <p class="mb-4">No agents found. Create the Coach agent to get started with the feedback system.</p>
            
            <form method="POST">
              <div class="form-control mb-4">
                <label class="label">
                  <span class="label-text">Name</span>
                </label>
                <input 
                  type="text" 
                  name="name" 
                  value="Coach" 
                  class="input input-bordered" 
                  disabled
                />
              </div>

              <div class="form-control mb-4">
                <label class="label">
                  <span class="label-text">Instructions</span>
                </label>
                <textarea 
                  name="prompt" 
                  class="textarea textarea-bordered h-64" 
                  defaultValue={COACH_INSTRUCTIONS}
                />
              </div>

              <div class="card-actions justify-end">
                <button 
                  type="submit" 
                  name="createCoach" 
                  value="true"
                  class="btn btn-primary"
                >
                  Create Coach Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
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
