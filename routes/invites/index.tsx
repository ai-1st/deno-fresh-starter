import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { Session, getSessionValue } from "../../core/sessions.ts";
import { getInvites, Invite } from "../../core/invites.ts";

interface Data {
  invites: Invite[];
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

    const invites = await getInvites(userId);
    return ctx.render({ invites });
  },
};

export default function InvitesPage({ data }: PageProps<Data>) {
  return (
    <>
      <Head>
        <title>Invites</title>
      </Head>
      <div class="p-4 mx-auto max-w-screen-md">
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-2xl font-bold">Invites</h1>
          <a
            href="/invites/new"
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Create New Invite
          </a>
        </div>
        
        {data.error && (
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {data.error}
          </div>
        )}

        {data.invites.length === 0 ? (
          <p class="text-gray-600">No invites created yet.</p>
        ) : (
          <div class="overflow-x-auto">
            <table class="min-w-full bg-white border rounded-lg">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invite Code
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invite Text
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tracking Code
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                {data.invites.map((invite) => (
                  <tr key={invite.id}>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invite.id}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invite.inviteText}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invite.code}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invite.used}/{invite.limit}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span
                        class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          invite.active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {invite.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div class="flex space-x-2">
                        <button
                          class="text-blue-600 hover:text-blue-900"
                          onClick={() => {
                            const url = `${window.location.origin}/signup?invite=${invite.id}`;
                            navigator.clipboard.writeText(url);
                            alert("Invite link copied to clipboard!");
                          }}
                        >
                          Copy Link
                        </button>
                        <a
                          href={`/invites/${invite.id}/edit`}
                          class="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
