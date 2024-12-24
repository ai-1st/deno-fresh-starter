/**
 * Cleanup page for deleting all agent tasks and their associated LLM streams.
 */

import { Handlers, PageProps } from "$fresh/server.ts";
import { db } from "$db";

interface CleanupData {
  tasksDeleted?: number;
  streamsDeleted?: number;
  error?: string;
}

export const handler: Handlers<CleanupData> = {
  async POST(req) {
    try {
      // Delete all tasks
      const tasks = await db.query({
        pk: "AGENT_TASK"
      });

      // Collect all stream IDs before deleting tasks
      const streamIds = tasks
        .map(task => task.data.llmStreamId)
        .filter(Boolean);

      // Delete all tasks
      await Promise.all(
        tasks.map(task => 
          db.delete({
            pk: task.pk,
            sk: task.sk
          })
        )
      );

      // Delete all associated streams
      let streamsDeleted = 0;
      for (const streamId of streamIds) {
        const chunks = await db.query({
          pk: `LLMSTREAM#${streamId}`
        });
        
        await Promise.all(
          chunks.map(chunk =>
            db.delete({
              pk: chunk.pk,
              sk: chunk.sk
            })
          )
        );
        streamsDeleted += chunks.length;
      }

      // Redirect back with success message
      const url = new URL(req.url);
      url.searchParams.set("tasksDeleted", tasks.length.toString());
      url.searchParams.set("streamsDeleted", streamsDeleted.toString());
      return Response.redirect(url.toString());

    } catch (error) {
      console.error("Error during cleanup:", error);
      const url = new URL(req.url);
      url.searchParams.set("error", "Failed to cleanup data");
      return Response.redirect(url.toString());
    }
  },

  async GET(req, ctx) {
    const url = new URL(req.url);
    return ctx.render({
      tasksDeleted: parseInt(url.searchParams.get("tasksDeleted") || "0"),
      streamsDeleted: parseInt(url.searchParams.get("streamsDeleted") || "0"),
      error: url.searchParams.get("error") || undefined
    });
  }
};

export default function CleanupPage({ data }: PageProps<CleanupData>) {
  const { tasksDeleted, streamsDeleted, error } = data;

  return (
    <div class="p-4">
      <h1 class="text-2xl font-bold mb-4">Cleanup Tasks</h1>

      {error && (
        <div class="alert alert-error mb-4">
          <div class="flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="w-6 h-6 mx-2 stroke-current">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
            </svg>
            <label>{error}</label>
          </div>
        </div>
      )}

      {(tasksDeleted > 0 || streamsDeleted > 0) && (
        <div class="alert alert-success mb-4">
          <div class="flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="w-6 h-6 mx-2 stroke-current">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <label>Successfully deleted {tasksDeleted} tasks and {streamsDeleted} stream chunks</label>
          </div>
        </div>
      )}

      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-warning">Warning</h2>
          <p>This will delete all agent tasks and their associated LLM streams. This action cannot be undone.</p>
          <div class="card-actions justify-end mt-4">
            <form method="POST">
              <button 
                type="submit" 
                class="btn btn-error"
                onClick={(e) => {
                  if (!confirm("Are you sure you want to delete all tasks? This cannot be undone.")) {
                    e.preventDefault();
                  }
                }}
              >
                Delete All Tasks
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
