import { Handlers, PageProps } from "$fresh/server.ts";
import { getInvites, Invite, createInvite, updateInvite } from "../../core/invites.ts";
import CopyLinkButton from "../../islands/CopyLinkButton.tsx";
import QRCode from "../../islands/QRCode.tsx";

interface InvitesData {
  invites: Invite[];
  error?: string;
  baseUrl: string;
}

export const handler: Handlers<InvitesData> = {
  async GET(req, ctx) {
    try {
      const userId = ctx.state.userId;
      if (!userId) {
        return ctx.renderNotFound();
      }

      const invites = await getInvites(userId as string);
      return ctx.render({ 
        invites,
        baseUrl: new URL(req.url).origin
      });
    } catch (error) {
      return ctx.render({ 
        invites: [],
        error: error.message,
        baseUrl: new URL(req.url).origin
      });
    }
  },

  async POST(req, ctx) {
    const userId = ctx.state.userId;
    if (!userId) {
      return ctx.renderNotFound();
    }

    const form = await req.formData();
    const action = form.get("action")?.toString();

    if (action === "create") {
      const inviteText = form.get("inviteText")?.toString() || "";
      const code = form.get("code")?.toString() || "";
      const limit = parseInt(form.get("limit")?.toString() || "1", 10);

      try {
        await createInvite(userId, inviteText, code, limit);
        return new Response(null, {
          status: 303,
          headers: { Location: "/user/invites" },
        });
      } catch (error) {
        const invites = await getInvites(userId);
        return ctx.render({ invites, error: error.message, baseUrl: new URL(req.url).origin });
      }
    }

    if (action === "toggle") {
      const inviteId = form.get("inviteId")?.toString();
      if (!inviteId) {
        return new Response(null, { status: 400 });
      }

      try {
        await updateInvite(inviteId, { active: form.get("active") === "true" });
        return new Response(null, {
          status: 303,
          headers: { Location: "/user/invites" },
        });
      } catch (error) {
        const invites = await getInvites(userId);
        return ctx.render({ invites, error: error.message, baseUrl: new URL(req.url).origin });
      }
    }

    return new Response(null, { status: 400 });
  },
};

export default function InvitesPage({ data }: PageProps<InvitesData>) {
  const { invites, error, baseUrl } = data;

  return (
    <div class="p-4 mx-auto max-w-screen-md">
      <h1 class="text-2xl font-bold mb-4">My Invites</h1>
      
      {error && (
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">Create New Invite</h2>
        <form method="POST" class="space-y-4">
          <input type="hidden" name="action" value="create" />
          
          <div>
            <label class="block text-sm font-medium text-gray-700">
              Invite Text
              <input
                type="text"
                name="inviteText"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Join me on this platform!"
              />
            </label>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">
              Tracking Code
              <input
                type="text"
                name="code"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="WINTER2024"
              />
            </label>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">
              Usage Limit
              <input
                type="number"
                name="limit"
                required
                min="1"
                value="1"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </label>
          </div>

          <button
            type="submit"
            class="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Create Invite
          </button>
        </form>
      </div>

      <div>
        <h2 class="text-xl font-semibold mb-4">My Invites</h2>
        <div class="space-y-4">
          {invites.map((invite) => (
            <div key={invite.id} class="border rounded-lg p-4 bg-white shadow-sm">
              <div class="flex justify-between items-start">
                <div>
                  <p class="text-sm text-gray-500">ID: {invite.id}</p>
                  <p class="font-medium mt-1">{invite.inviteText}</p>
                  <p class="text-sm text-gray-600 mt-1">Code: {invite.code}</p>
                  <p class="text-sm text-gray-600">
                    Used: {invite.used} / {invite.limit}
                  </p>
                </div>
                <div class="flex items-center space-x-2">
                  <form method="POST">
                    <input type="hidden" name="action" value="toggle" />
                    <input type="hidden" name="inviteId" value={invite.id} />
                    <input
                      type="hidden"
                      name="active"
                      value={(!invite.active).toString()}
                    />
                    <button
                      type="submit"
                      class={`px-3 py-1 rounded text-sm ${
                        invite.active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {invite.active ? "Active" : "Inactive"}
                    </button>
                  </form>
                  <CopyLinkButton url={`${baseUrl}/invite/accept/${invite.id}`} />
                  <div class="ml-2">
                    <QRCode value={`${baseUrl}/invite/accept/${invite.id}`} width={120} height={120} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
