import { db } from "../db/mod.ts";
import type { DbItem } from "../db/types.ts";
import { ulid } from "$ulid/mod.ts";

export interface User {
  id: string;
  login: string;
  passwordHash: string;
}

export async function getUser(id: string): Promise<User | null> {
  const items = await db.get<User>({ pk: `user:${id}`, sk: "" });
  return items[0]?.data || null;
}

export async function getUserByLogin(login: string): Promise<User | null> {
  const items = await db.get<User>({
    pk: "user_by_login",
    sk: login,
  });
  return items[0]?.data || null;
}

export async function createUser(
  login: string,
  passwordHash: string,
): Promise<User> {
  const user: User = {
    id: ulid(),
    login,
    passwordHash,
  };

  const userItem: DbItem<User> = {
    pk: `user:${user.id}`,
    sk: "",
    data: user,
  };

  const loginItem: DbItem<User> = {
    pk: "user_by_login",
    sk: user.login,
    data: user,
  };

  await db.set([userItem, loginItem]);
  return user;
}
