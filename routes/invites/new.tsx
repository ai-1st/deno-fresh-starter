import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { Session, getSessionValue } from "../../core/sessions.ts";
import { createInvite } from "../../core/invites.ts";

interface Data {
  error?: string;
}

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
    const session = ctx.state.session as Session;
    const userId = getSessionValue(session, 0);
    if (!userId) {
      return new Response("", {
        status: 302,
        headers: { Location: "/login" },
      });
    }

    return ctx.render({});
  },

  async POST(req, ctx) {
    const session = ctx.state.session as Session;
    const userId = getSessionValue(session, 0);
    if (!userId) {
      return new Response("", {
        status: 302,
        headers: { Location: "/login" },
      });
    }

    const form = await req.formData();
    const inviteText = form.get("inviteText")?.toString() || "";
    const code = form.get("code")?.toString() || "";
    const limit = parseInt(form.get("limit")?.toString() || "1", 10);

    if (!inviteText) {
      return ctx.render({ error: "Invite text is required" });
    }

    await createInvite(userId, inviteText, code, limit);
    
    return new Response("", {
      status: 302,
      headers: { Location: "/invites" },
    });
  },
};

export default function NewInvitePage({ data }: PageProps<Data>) {
  return (
    <>
      <Head>
        <title>Create New Invite</title>
      </Head>
      <div class="p-4 mx-auto max-w-screen-md">
        <div class="mb-8">
          <h1 class="text-2xl font-bold">Create New Invite</h1>
        </div>

        {data.error && (
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {data.error}
          </div>
        )}

        <form method="POST" class="space-y-6">
          <div>
            <label
              htmlFor="inviteText"
              class="block text-sm font-medium text-gray-700"
            >
              Invite Text
            </label>
            <textarea
              id="inviteText"
              name="inviteText"
              rows={3}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter the message that will be sent with the invite"
              required
            />
          </div>

          <div>
            <label
              htmlFor="code"
              class="block text-sm font-medium text-gray-700"
            >
              Tracking Code
            </label>
            <input
              type="text"
              id="code"
              name="code"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Optional: Enter a code to track this invite's performance"
            />
          </div>

          <div>
            <label
              htmlFor="limit"
              class="block text-sm font-medium text-gray-700"
            >
              Usage Limit
            </label>
            <input
              type="number"
              id="limit"
              name="limit"
              min="1"
              value="1"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div class="flex justify-end space-x-4">
            <a
              href="/invites"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </a>
            <button
              type="submit"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Invite
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
