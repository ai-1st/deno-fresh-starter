import { Handlers, PageProps } from "$fresh/server.ts";
import { getSession, setSessionValue, saveSession } from "../../../core/sessions.ts";
import { getInvite, Invite } from "../../../core/invites.ts";
import { getUserById } from "../../../core/users.ts";

interface AcceptInviteData {
  invite: Invite;
  inviterName: string;
}

export const handler: Handlers<AcceptInviteData | null> = {
  async GET(req, ctx) {
    const inviteId = ctx.params.id;
    const session = await getSession(req);
    
    // Store invite ID in session at position 2
    setSessionValue(session, 2, inviteId);
    
    // If user is not logged in, redirect to signin
    if (!ctx.state.user) {
      const url = new URL("/signin", req.url);
      const response = new Response("", {
        status: 302,
        headers: { Location: url.toString() },
      });
      // Save session before redirecting
      return await saveSession(response, session);
    }

    // Get invite details
    const invite = await getInvite(inviteId);
    if (!invite || !invite.active || invite.used >= invite.limit) {
      return ctx.render(null);
    }

    // Get inviter's name
    const inviter = await getUserById(invite.invitingUserId);
    if (!inviter) {
      return ctx.render(null);
    }

    const response = await ctx.render({
      invite,
      inviterName: inviter.login,
    });

    // Save session after storing invite ID
    return await saveSession(response, session);
  }
};

export default function AcceptInvitePage({ data }: PageProps<AcceptInviteData | null>) {
  if (!data) {
    return <div class="p-4">
      <h1 class="text-2xl font-bold">Invalid Invite</h1>
      <p class="mt-4">This invite does not exist, has been deactivated, or has reached its usage limit.</p>
      <a href="/" class="mt-4 inline-block text-blue-500 hover:underline">Return to Home</a>
    </div>;
  }

  const { invite, inviterName } = data;

  return (
    <div class="p-4 max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold">Accept Invite</h1>
      <div class="mt-6 bg-white rounded-lg shadow p-6">
        <p class="text-lg">You have been invited by <strong>{inviterName}</strong></p>
        {invite.inviteText && (
          <div class="mt-4 p-4 bg-gray-50 rounded-lg italic">
            "{invite.inviteText}"
          </div>
        )}
        
        <div class="mt-6">
          <div class="bg-blue-50 border-l-4 border-blue-400 p-4">
            <p class="text-sm text-gray-600">
              Note: If you proceed to sign in or sign up using this invite, 
              <strong>{inviterName}</strong> will receive your contact information.
            </p>
          </div>
        </div>

        <div class="mt-6 flex gap-4">
          <a
            href="/signin"
            class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Continue to Sign In
          </a>
          <button
            class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            onClick={() => {
              // Remove invite from session and redirect to signin
              window.location.href = "/signin";
            }}
          >
            Reject Invite
          </button>
        </div>
      </div>
    </div>
  );
}