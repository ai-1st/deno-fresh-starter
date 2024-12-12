import { Handlers, PageProps } from "$fresh/server.ts";
import { getSession, setSessionValue, saveSession } from "../core/sessions.ts";
import { hashPassword } from "../core/crypto.ts";
import { createUser, getUserByLogin } from "../core/users.ts";

interface SignupData {
  error?: string;
  redirect?: string;
}

export const handler: Handlers<SignupData> = {
  async GET(req, ctx) {
    console.log("[Signup] GET request received");
    // Check if already logged in
    const session = await getSession(req);
    const userId = session.values[0];
    console.log("[Signup] Current session user:", userId || "none");

    if (userId) {
      console.log("[Signup] User already logged in, redirecting to home");
      return new Response("", {
        status: 302,
        headers: { Location: "/" },
      });
    }

    const url = new URL(req.url);
    const redirect = url.searchParams.get("redirect") || "/";
    console.log("[Signup] Rendering signup page with redirect:", redirect);
    return ctx.render({ redirect });
  },

  async POST(req, ctx) {
    console.log("[Signup] POST request received");
    const form = await req.formData();
    const login = form.get("login")?.toString();
    const password = form.get("password")?.toString();
    const confirmPassword = form.get("confirm_password")?.toString();
    const redirect = form.get("redirect")?.toString() || "/";
    console.log("[Signup] Attempting to create user:", login);

    if (!login || !password || !confirmPassword) {
      console.log("[Signup] Missing required fields");
      return ctx.render({ error: "All fields are required", redirect });
    }

    if (password !== confirmPassword) {
      console.log("[Signup] Passwords do not match");
      return ctx.render({ error: "Passwords do not match", redirect });
    }

    // Check if login is available
    console.log("[Signup] Checking if username is available");
    const existingUser = await getUserByLogin(login);
    if (existingUser) {
      console.log("[Signup] Username already taken");
      return ctx.render({ error: "Login is already taken", redirect });
    }

    try {
      // Create new user
      console.log("[Signup] Creating new user");
      const hashedPassword = await hashPassword(password);
      const user = await createUser(login, hashedPassword);
      console.log("[Signup] User created successfully");

      // Set session values
      console.log("[Signup] Creating session");
      const session = await getSession(req);
      await setSessionValue(session, 0, user.id);  // Store user ID
      await setSessionValue(session, 1, user.login); // Store username
      console.log("[Signup] Session values set:", { userId: user.id, login: user.login });

      // Create redirect response
      console.log("[Signup] Creating redirect response to:", redirect);
      const response = new Response("", {
        status: 302,
        headers: { Location: redirect },
      });

      // Save session and return the modified response
      console.log("[Signup] Saving session and redirecting");
      return await saveSession(response, session);
    } catch (error) {
      console.error("[Signup] Failed to create user:", error);
      return ctx.render({ error: "Failed to create user", redirect });
    }
  },
};

export default function Signup({ data }: PageProps<SignupData>) {
  const { error, redirect = "/" } = data;
  return (
    <div class="min-h-screen bg-gray-100 flex items-center justify-center">
      <div class="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
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
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
            <div>
              <label for="confirm_password" class="sr-only">
                Confirm Password
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                required
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign up
            </button>
          </div>
          <div class="text-sm text-center">
            <a
              href="/signin"
              class="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Already have an account? Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
