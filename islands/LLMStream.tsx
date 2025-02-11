/** 
 * Island component that displays a streaming response from an agent task
 * Shows text and tool calls in a formatted way
 */
import { useEffect, useState } from "preact/hooks";
import type { StreamPart, TaskResponse } from "../routes/agents/api/task/:taskId.ts";
import { AgentVersion, type AgentVersionData } from "../components/AgentVersion.tsx";

interface LLMStreamProps {
  taskId: string;
}

export function LLMStream({ taskId }: LLMStreamProps) {
  const [parts, setParts] = useState<StreamPart[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [newVersions, setNewVersions] = useState<Record<string, AgentVersionData>>({});

  //console.log("Initializing LLMStream component with task ID:", taskId);

  // Fetch agent version data when we see a new version ID
  useEffect(() => {
    async function fetchNewVersions() {
      console.log("Fetching new versions for parts:", parts);
      for (const part of parts) {
        if (part.type === 'tool-result') {
          const result = part.result as Record<string, unknown>;
          if (typeof result?.newVersionId === 'string' && !newVersions[result.newVersionId]) {
            console.log("Fetching new version:", result.newVersionId);
            try {
              const response = await fetch(`/agents/api/version/${result.newVersionId}`);
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              const versionData = await response.json();
              console.log("Received version data:", versionData);
              setNewVersions(prev => ({
                ...prev,
                [result.newVersionId]: versionData
              }));
            } catch (err) {
              console.error("Error fetching new version:", err);
            }
          }
        }
      }
    }
    fetchNewVersions();
  }, [parts]);

  useEffect(() => {
    let timeoutId: number;

    async function pollTask() {
      try {
        // Stop polling after 100 requests
        if (pollCount >= 100) {
          console.log("Reached maximum poll count (100), stopping");
          setError("Request timeout - maximum poll count reached");
          return;
        }

        console.log(`Polling task ${taskId} (attempt ${pollCount + 1})`);
        const response = await fetch(`/agents/api/task/${taskId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: TaskResponse = await response.json();
        console.log("Received task data:", {
          isComplete: data.isComplete,
          error: data.error,
          partsCount: data.streamParts.length,
          lastPart: data.streamParts[data.streamParts.length - 1]
        });

        setParts(data.streamParts);
        setIsComplete(data.isComplete);
        if (data.error) {
          setError(data.error);
        }

        setPollCount(count => count + 1);

        if (!data.isComplete) {
          // After 20 polls, increase interval to 10 seconds
          const pollInterval = pollCount >= 20 ? 10000 : 1000;
          console.log(`Scheduling next poll in ${pollInterval}ms`);
          timeoutId = setTimeout(pollTask, pollInterval);
        } else {
          console.log("Task complete, stopping polls");
        }
      } catch (err) {
        console.error("Error polling task:", err);
        setError("Failed to fetch response");
      }
    }

    pollTask();
    return () => clearTimeout(timeoutId);
  }, [taskId]);

  if (error) {
    console.log("Error occurred:", error);
    return (
      <div class="alert alert-error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div class="space-y-2">
      {parts.reduce((acc: JSX.Element[], part, i) => {
        console.log("Rendering part:", { type: part.type, index: i });
        if (part.type === 'text-delta') {
          const prevElement = acc[acc.length - 1];
          if (prevElement?.props?.['data-type'] === 'text-delta') {
            // Combine with previous text delta
            acc[acc.length - 1] = (
              <div key={`text-${i}`} data-type="text-delta" class="whitespace-pre-wrap">
                {prevElement.props.children + part.textDelta}
              </div>
            );
          } else {
            // Create new text delta element
            acc.push(
              <div key={`text-${i}`} data-type="text-delta" class="whitespace-pre-wrap">
                {part.textDelta}
              </div>
            );
          }
        } else if (part.type === 'error') {
          acc.push(
            <div key={i} class="collapse collapse-arrow bg-error text-error-content rounded-lg">
              <input type="checkbox" class="collapse-toggle" defaultChecked /> 
              <div class="collapse-title font-mono text-sm flex items-center gap-2">
                <span class="text-error-content">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                </span>
                Error
              </div>
              <div class="collapse-content">
                <pre class="whitespace-pre-wrap break-all font-mono text-sm">
                  {part.error}
                </pre>
              </div>
            </div>
          );
        } else if (part.type === 'tool-call' || part.type === 'tool-result') {
          acc.push(
            <div key={i} class="collapse collapse-arrow bg-base-200 rounded-lg">
              <input type="checkbox" class="collapse-toggle" /> 
              <div class="collapse-title font-mono text-sm flex items-center gap-2">
                {part.type === 'tool-call' ? (
                  <span class="text-blue-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </span>
                ) : (
                  <span class="text-green-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                  </span>
                )}
                {part.type === 'tool-call' ? `Tool Call: ${part.toolName}` : 'Tool Result'}
              </div>
              <div class="collapse-content">
                {part.type === 'tool-result' && 
                 typeof part.result === 'object' && 
                 part.result !== null &&
                 'newVersionId' in part.result &&
                 typeof part.result.newVersionId === 'string' &&
                 newVersions[part.result.newVersionId] ? (
                  <AgentVersion 
                    version={newVersions[part.result.newVersionId]} 
                    showInvoke={true}
                    showNewVersion={false}
                  />
                ) : (
                  <pre class="whitespace-pre-wrap break-all font-mono text-sm">
                    {part.type === 'tool-call' 
                      ? JSON.stringify(part.args, null, 2)
                      : JSON.stringify(part.result, null, 2)
                    }
                  </pre>
                )}
              </div>
            </div>
          );
        }
        return acc;
      }, [])}
      {!isComplete && (
        <span 
          class="inline-block w-2 h-4 ml-1 bg-gray-500" 
          style={{
            animation: "blink 1s infinite",
            "@keyframes blink": {
              "0%, 100%": { opacity: 0 },
              "50%": { opacity: 1 }
            }
          }} 
        />
      )}
    </div>
  );
}
