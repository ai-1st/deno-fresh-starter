import { useEffect, useState } from "preact/hooks";

interface LLMStreamProps {
  llmStreamId: string;
}

export function LLMStream({ llmStreamId }: LLMStreamProps) {
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [startFrom, setStartFrom] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [isStreaming, setIsStreaming] = useState(true);

  useEffect(() => {
    let timeoutId: number;
    
    const pollStream = async (llmStreamId, startFrom) => {
      console.log("Polling stream for llmStream:", llmStreamId, startFrom);
      try {
        const response = await fetch(`/agents/api/stream/${llmStreamId}/${startFrom}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
          // Don't set isComplete, keep retrying
          setRetryCount(count => count + 1);
          timeoutId = setTimeout(() => pollStream(llmStreamId, startFrom), 1000);
          return;
        }

        // Reset error state and retry count on successful response
        setError(null);
        setRetryCount(0);

        if (data.text) {
          setOutput(prev => prev + data.text);
        }

        if (data.isComplete) {
          setIsComplete(true);
          setIsStreaming(false);
        } else {
          timeoutId = setTimeout(() => pollStream(llmStreamId, data.sequence), 1000);
        }
        
      } catch (err) {
        setError(err.message);
        setRetryCount(count => count + 1);
        // Continue polling despite error
        timeoutId = setTimeout(() => pollStream(llmStreamId, startFrom), 1000);
      }
    };

    pollStream(llmStreamId, startFrom);

    // Cleanup timeout on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [llmStreamId]); // Only re-run if llmStreamId changes

  return (
    <div class="space-y-4">
      {error && (
        <div class="alert alert-error">
          <p>Error: {error}</p>
          <p>Retry attempt: {retryCount}</p>
          <p>Continuing to poll for updates...</p>
        </div>
      )}
      {output && (
        <div class="whitespace-pre-wrap">
          {output}
          {isStreaming && (
            <span class="inline-block w-2 h-4 ml-1 bg-gray-500 animate-[blink_1s_infinite]" style={{
              animation: "blink 1s infinite",
              "@keyframes blink": {
                "0%, 100%": { opacity: 0 },
                "50%": { opacity: 1 }
              }
            }} />
          )}
        </div>
      )}
      {!output && !error && (
        <div class="animate-pulse">Waiting for response...</div>
      )}
    </div>
  );
}
