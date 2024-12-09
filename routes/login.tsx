import { Handlers, PageProps } from "$fresh/server.ts";
import { getSession, setSessionValue } from "../core/sessions.ts";
import { encrypt } from "../core/crypto.ts";
import { db } from "../db/mod.ts";

interface LoginData {
  error?: string;
}

export const handler: Handlers<LoginData> = {
  async GET(req, ctx) {
    // Check if already logged in
    const session = await getSession(req);
    const userId = session.values[0];
    if (userId) {
      return new Response("", {
        status: 302,
        headers: { Location: "/" },
      });
    }

    return ctx.render();
  },

  async POST(req, ctx) {
    const form = await req.formData();
    const login = form.get("login")?.toString();
    const password = form.get("password")?.toString();

    if (!login || !password) {
      return ctx.render({ error: "Login and password are required" });
    }

    // Find user by login
    const user = await db.get(["users_by_login", login]);
    if (!user) {
      return ctx.render({ error: "Invalid login or password" });
    }

    // Verify password
    const encryptedPassword = await encrypt(password, login);
    if (user.password !== encryptedPassword) {
      return ctx.render({ error: "Invalid login or password" });
    }

    // Create session
    const session = await getSession(req);
    setSessionValue(session, 0, user.ulid);
    setSessionValue(session, 1, user.login);

    const response = new Response("", {
      status: 302,
      headers: { Location: "/" },
    });

    return response;
  },
};

export default function Login({ data }: PageProps<LoginData>) {
  return (
    <div class="min-h-screen bg-gray-100 flex items-center justify-center">
      <div class="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form class="mt-8 space-y-6" method="POST">
          {data?.error && (
            <div class="rounded-md bg-red-50 p-4">
              <div class="text-sm text-red-700">{data.error}</div>
            </div>
          )}
          <div class="rounded-md shadow-sm -space-y-px">
            <div>
              <label for="login" class="sr-only">Login</label>
              <input
                id="login"
                name="login"
                type="text"
                required
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Login"
              />
            </div>
            <div>
              <label for="password" class="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign in
            </button>
          </div>
          <div class="text-sm text-center">
            <a href="/signup" class="font-medium text-indigo-600 hover:text-indigo-500">
              Don't have an account? Sign up
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
