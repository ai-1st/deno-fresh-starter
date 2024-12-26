/**
 * Reusable component for submitting feedback to improve agent behavior
 * Handles feedback form submission and redirects to coach agent
 */

import { AgentVersionData } from "./AgentVersion.tsx";

interface AgentFeedbackProps {
  taskId: string;
  agentVersion: AgentVersionData;
  prompt: string;
  response?: string;
}

export function AgentFeedback({ taskId, agentVersion, prompt, response }: AgentFeedbackProps) {
  return (
    <form 
      method="POST"
      action="/agents/feedback"
      class="mt-4"
    >
      <input type="hidden" name="agentVersionId" value={agentVersion?.id} />
      <input type="hidden" name="taskId" value={taskId} />
      
      <div class="flex flex-col gap-2">
        <textarea
          name="feedback"
          rows={5}
          placeholder="Enter feedback to improve the agent..."
          required
          class="textarea textarea-bordered w-full"
        />
        <button
          type="submit"
          class="btn btn-success self-end"
        >
          Improve Agent
        </button>
      </div>
    </form>
  );
}
