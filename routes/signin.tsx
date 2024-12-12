import { Handlers, PageProps } from "$fresh/server.ts";
import { getSession, setSessionValue, saveSession } from "../core/sessions.ts";
import { hashPassword } from "../core/crypto.ts";
import { getUserByLogin } from "../core/users.ts";

interface LoginData {
  error?: string;
  redirect?: string;
}

export const handler: Handlers<LoginData> = {
  async GET(req, ctx) {
    console.log("[Signin] GET request received");
    // Check if already logged in
    const session = await getSession(req);
    const userId = session.values[0];
    console.log("[Signin] Current session user:", userId || "none");

    if (userId) {
      console.log("[Signin] User already logged in, redirecting to home");
      return new Response("", {
        status: 302,
        headers: { Location: "/" },
      });
    }

    const url = new URL(req.url);
    const redirect = url.searchParams.get("redirect") || "/";
    console.log("[Signin] Rendering signin page with redirect:", redirect);
    return ctx.render({ redirect });
  },

  async POST(req, ctx) {
    console.log("[Signin] POST request received");
    const form = await req.formData();
    const login = form.get("login")?.toString();
    const password = form.get("password")?.toString();
    const redirect = form.get("redirect")?.toString() || "/";
    console.log("[Signin] Attempting login for user:", login);

    if (!login || !password) {
      console.log("[Signin] Missing login or password");
      return ctx.render({ error: "Login and password are required", redirect });
    }

    // Find user by login
    console.log("[Signin] Looking up user in database");
    const user = await getUserByLogin(login);

    if (!user) {
      console.log("[Signin] User not found");
      return ctx.render({ error: "Invalid login or password", redirect });
    }

    console.log("[Signin] User found:", user.login);
    
    const hashedPassword = await hashPassword(password);
    if (hashedPassword !== user.passwordHash) {
      console.log("[Signin] Invalid password");
      return ctx.render({ error: "Invalid login or password", redirect });
    }

    console.log("[Signin] Password verified, creating session");
    // Set session values
    const session = await getSession(req);
    await setSessionValue(session, 0, user.id);  // Store user ID
    await setSessionValue(session, 1, user.login); // Store username
    console.log("[Signin] Session values set:", { userId: user.id, login: user.login });

    // Create redirect response
    console.log("[Signin] Creating redirect response to:", redirect);
    const response = new Response("", {
      status: 302,
      headers: { Location: redirect },
    });

    // Save session and return the modified response
    console.log("[Signin] Saving session and redirecting");
    return await saveSession(response, session);
  },
};

export default function Login({ data }: PageProps<LoginData>) {
  const { error, redirect = "/" } = data;
  return (
    <div class="min-h-screen bg-gray-100 flex items-center justify-center">
      <div class="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form class="mt-8 space-y-6" method="POST">
          {error && (
            <div class="rounded-md bg-red-50 p-4">
              <div class="text-sm text-red-700">{error}</div>
            </div>
          )}
          <input type="hidden" name="redirect" value={redirect} />
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
            <a
              href="/signup"
              class="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Don't have an account? Sign up
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
