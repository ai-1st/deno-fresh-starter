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
  async POST(req, ctx) {
    try {
      // Get all tasks
      const tasks = await db.query({
        pk: "AGENT_TASK"
      });

      // Get all task streams
      const taskIds = tasks.map(task => task.sk.replace('anon#', ''));
      const streamPromises = taskIds.map(taskId => 
        db.query({
          pk: "TASK_STREAM#" + taskId
        })
      );
      const streamResults = await Promise.all(streamPromises);
      const streams = streamResults.flat();

      // Delete all tasks
      await Promise.all(
        tasks.map(task => 
          db.delete({
            pk: task.pk,
            sk: task.sk
          })
        )
      );

      // Delete all streams
      await Promise.all(
        streams.map(stream =>
          db.delete({
            pk: stream.pk,
            sk: stream.sk
          })
        )
      );

      return ctx.render({
        tasksDeleted: tasks.length,
        streamsDeleted: streams.length
      });

    } catch (error) {
      console.error("Error during cleanup:", error);
      return ctx.render({
        error: "Failed to cleanup tasks and streams"
      });
    }
  },

  async GET(req, ctx) {
    return ctx.render({});
  }
};

function CleanupPage({ data }: PageProps<CleanupData>) {
  return (
    <div class="p-4">
      <h1 class="text-2xl font-bold mb-4">Cleanup Agent Tasks</h1>
      
      {data.error && (
        <div class="alert alert-error mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{data.error}</span>
        </div>
      )}

      {data.tasksDeleted !== undefined && (
        <div class="alert alert-success mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Successfully deleted {data.tasksDeleted} tasks and {data.streamsDeleted} stream items</span>
        </div>
      )}

      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-warning">Warning</h2>
          <p>This will delete all agent tasks and their associated stream data. This action cannot be undone.</p>
          <div class="card-actions justify-end mt-4">
            <form method="POST">
              <button 
                type="submit" 
                class="btn btn-error"
                onclick="return confirm('Are you sure you want to delete all tasks and their streams? This cannot be undone.')"
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

export default CleanupPage;
