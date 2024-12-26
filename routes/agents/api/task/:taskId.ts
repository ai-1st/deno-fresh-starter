/**
 * API endpoint for retrieving task stream items
 * Returns an array of stream parts (text deltas, tool calls, results) for a given task
 */
import { HandlerContext } from "$fresh/server.ts";
import { db } from "$db";

export interface StreamPart {
  type: 'text-delta' | 'tool-call' | 'tool-result' | 'finish' | 'error';
  textDelta?: string;
  toolName?: string;
  args?: Record<string, unknown>;
  result?: unknown;
  error?: string;
}

export interface TaskResponse {
  streamParts: StreamPart[];
  isComplete: boolean;
  error?: string;
}

export async function handler(
  req: Request,
  ctx: HandlerContext,
): Promise<Response> {
  const taskId = ctx.params.taskId;
  console.log(`[Task API] Fetching task ${taskId}`);

  if (!taskId) {
    console.warn("[Task API] Missing task ID in request");
    return new Response("Missing task ID", { status: 400 });
  }

  try {
    // Get stream parts
    console.log(`[Task API] Querying stream parts for task ${taskId}`);
    const streamResult = await db.query({
      pk: "TASK_STREAM#" + taskId
    });
    console.log(`[Task API] Found ${streamResult.length} stream parts`);

    // Get task status
    console.log(`[Task API] Fetching task status`);
    const taskStatus = await db.getOne({
      pk: "AGENT_TASK",
      sk: `anon#${taskId}`
    });
    console.log(`[Task API] Task status:`, {
      isComplete: taskStatus?.data?.isComplete,
      hasError: !!taskStatus?.data?.error
    });

    if (streamResult.length === 0 && !taskStatus) {
      console.warn(`[Task API] No data found for task ${taskId}`);
      return new Response("No stream items found", { status: 404 }); 
    }

    // Sort items by sk to maintain order
    const sortedItems = streamResult.sort((a, b) => a.sk.localeCompare(b.sk));
    const response: TaskResponse = {
      streamParts: sortedItems.map(item => item.data),
      isComplete: taskStatus?.data?.isComplete ?? false,
      error: taskStatus?.data?.error
    };

    console.log(`[Task API] Returning response for task ${taskId}:`, {
      numParts: response.streamParts.length,
      isComplete: response.isComplete,
      hasError: !!response.error
    });

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error(`[Task API] Error fetching task ${taskId}:`, error);
    return new Response("Internal server error", { status: 500 });
  }
}
