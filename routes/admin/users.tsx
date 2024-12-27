/**
 * Users list page
 * Displays all users from the database
 * Only accessible to authorized admin
 */
import { FreshContext } from "$fresh/server.ts";
import { db } from "$db";

interface UserData {
  email: string;
  name: string;
  picture: string;
  updatedAt: string;
}

export default async function UsersPage(_req: Request, _ctx: FreshContext) {
  // Query all users from the database
  const users = await db.query({
    pk: "USER"
  });

  return (
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-8">Users</h1>
      
      <div class="overflow-x-auto">
        <table class="table table-zebra w-full">
          <thead>
            <tr>
              <th>Avatar</th>
              <th>Name</th>
              <th>Email</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const data = user.data as UserData;
              return (
                <tr key={user.sk}>
                  <td>
                    <div class="avatar">
                      <div class="w-12 rounded-full">
                        <img src={data.picture} alt={data.name} />
                      </div>
                    </div>
                  </td>
                  <td>{data.name}</td>
                  <td>{data.email}</td>
                  <td>{new Date(data.updatedAt).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
