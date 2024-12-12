import { Handlers, PageProps } from "$fresh/server.ts";
import { db } from "../db/mod.ts";
import { User } from "../core/users.ts";

interface DiagData {
  users: Array<User>;
}

export const handler: Handlers<DiagData> = {
  async GET(_req, ctx) {
    // Query all users
    const items = await db.query<User>({
      pk: "user_by_login",
    });
    const users = items.map((item) => (item.data)).filter(Boolean);
    return ctx.render({ users });
  },
};

export default function DiagPage({ data }: PageProps<DiagData>) {
  return (
    <div class="p-4">
      <h1 class="text-2xl font-bold mb-4">Diagnostic: Users</h1>
      <div class="overflow-x-auto">
        <table class="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr class="bg-gray-100">
              <th class="border border-gray-300 px-4 py-2">ID</th>
              <th class="border border-gray-300 px-4 py-2">Login</th>
              <th class="border border-gray-300 px-4 py-2">Password Hash</th>
            </tr>
          </thead>
          <tbody>
            {data.users.map((user) => (
              <tr key={user.id}>
                <td class="border border-gray-300 px-4 py-2 font-mono">
                  {user.id}
                </td>
                <td class="border border-gray-300 px-4 py-2">
                  {user.login}
                </td>
                <td class="border border-gray-300 px-4 py-2 font-mono text-xs break-all">
                  {user.passwordHash}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p class="mt-4 text-sm text-gray-600">
        Total users: {data.users.length}
      </p>
    </div>
  );
}
