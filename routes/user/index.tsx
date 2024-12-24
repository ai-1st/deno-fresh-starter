import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { getUserById } from "../../core/users.ts";
import { getSessionValue, Session } from "../../core/sessions.ts";

interface Data {
  login: string;
  createdAt: Date;
}

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
    console.log("GET /user/")
    const session = ctx.state.session as Session;
    const userId = getSessionValue(session, 0);
    const user = await getUserById(userId as string);
    if (!user) {
      console.log("This shouldn't happen as middleware ensures user exists")
      return new Response("", {
        status: 302,
        headers: { Location: "/signin" },
      });
    }
    return ctx.render({ 
      login: user.login,
      createdAt: user.createdAt,
    });
  },
};

export default function UserProfile({ data }: PageProps<Data>) {
  const { login, createdAt } = data;
  
  return (
    <>
      <Head>
        <title>User Profile</title>
      </Head>
      <div class="p-4 mx-auto max-w-screen-md">
        <h1 class="text-2xl font-bold mb-6">User Profile</h1>
        
        <div class="bg-white shadow rounded-lg p-6">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div class="mt-1 text-sm text-gray-900">
                {login}
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700">
                Account Created
              </label>
              <div class="mt-1 text-sm text-gray-900">
                {new Date(createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div class="mt-8 space-x-4">
            <a
              href="/invites"
              class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Manage Invites
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
