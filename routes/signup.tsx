import { Handlers, PageProps } from "$fresh/server.ts";
import { getSession, setSessionValue } from "../core/sessions.ts";
import { encrypt } from "../core/crypto.ts";
import { db } from "../db/mod.ts";
import { ulid } from "$ulid/mod.ts";

interface SignupData {
  error?: string;
}

export const handler: Handlers<SignupData> = {
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
    const confirmPassword = form.get("confirm_password")?.toString();

    if (!login || !password || !confirmPassword) {
      return ctx.render({ error: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return ctx.render({ error: "Passwords do not match" });
    }

    // Check if login is available
    const existingUser = await db.get({
      pk: "users_by_login",
      sk: login
    });
    if (existingUser.length > 0) {
      return ctx.render({ error: "Login is already taken" });
    }

    // Create new user
    const userUlid = ulid();
    const encryptedPassword = await encrypt(password, login);
    
    const user = {
      ulid: userUlid,
      login,
      password: encryptedPassword,
    };

    // Store user data
    await db.atomic()
      .check({ key: ["users_by_login", login], versionstamp: null })
      .set(["users", userUlid], user)
      .set(["users_by_login", login], user)
      .commit();

    // Create session
    const session = await getSession(req);
    setSessionValue(session, 0, userUlid);
    setSessionValue(session, 1, login);

    const response = new Response("", {
      status: 302,
      headers: { Location: "/" },
    });

    return response;
  },
};

export default function Signup({ data }: PageProps<SignupData>) {
  return (
    <div class="min-h-screen bg-gray-100 flex items-center justify-center">
      <div class="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
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
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
            <div>
              <label for="confirm_password" class="sr-only">Confirm Password</label>
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
            <a href="/login" class="font-medium text-indigo-600 hover:text-indigo-500">
              Already have an account? Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
