import { ulid } from "https://deno.land/x/ulid@v0.3.0/mod.ts";
import { db } from "../db/mod.ts";
import type { DbItem } from "../db/types.ts";

export interface Invite {
  id: string;
  invitingUserId: string;
  inviteText: string;
  code: string;
  limit: number;
  used: number;
  active: boolean;
  createdAt: Date;
}

export async function createInvite(
  invitingUserId: string,
  inviteText: string,
  code: string,
  limit: number
): Promise<Invite> {
  const invite: Invite = {
    id: ulid(),
    invitingUserId,
    inviteText,
    code,
    limit,
    used: 0,
    active: true,
    createdAt: new Date(),
  };

  const inviteItem: DbItem<Invite> = {
    pk: `invite:${invite.id}`,
    sk: "",
    data: invite,
  };

  const userInviteItem: DbItem<Invite> = {
    pk: `user_invites:${invitingUserId}`,
    sk: invite.id,
    data: invite,
  };

  await db.set([inviteItem, userInviteItem]);
  return invite;
}

export async function getInvite(id: string): Promise<Invite | null> {
  const items = await db.get<Invite>({ pk: `invite:${id}`, sk: "" });
  return items[0]?.data || null;
}

export async function getInvites(userId: string): Promise<Invite[]> {
  const items = await db.query<Invite>({
    pk: `user_invites:${userId}`,
  });
  
  return items
    .map(item => item.data!)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function updateInvite(
  id: string,
  updates: Partial<Invite>
): Promise<Invite | null> {
  const items = await db.get<Invite>([
    { pk: `invite:${id}`, sk: "" }
  ]);
  
  if (!items[0]?.data) return null;
  const invite = items[0].data;
  
  const updatedInvite = { ...invite, ...updates };
  
  const inviteItem: DbItem<Invite> = {
    pk: `invite:${id}`,
    sk: "",
    data: updatedInvite,
    versionstamp: items[0].versionstamp
  };
  
  const userInviteItem: DbItem<Invite> = {
    pk: `user_invites:${invite.invitingUserId}`,
    sk: id,
    data: updatedInvite
  };

  await db.set([inviteItem, userInviteItem]);
  return updatedInvite;
}

export async function useInvite(id: string): Promise<boolean> {
  const items = await db.get<Invite>([
    { pk: `invite:${id}`, sk: "" }
  ]);
  
  if (!items[0]?.data) return false;
  const invite = items[0].data;
  
  if (!invite.active || invite.used >= invite.limit) {
    return false;
  }

  const updatedInvite = {
    ...invite,
    used: invite.used + 1,
    active: invite.used + 1 < invite.limit,
  };

  const inviteItem: DbItem<Invite> = {
    pk: `invite:${id}`,
    sk: "",
    data: updatedInvite,
    versionstamp: items[0].versionstamp
  };
  
  const userInviteItem: DbItem<Invite> = {
    pk: `user_invites:${invite.invitingUserId}`,
    sk: id,
    data: updatedInvite
  };

  await db.set([inviteItem, userInviteItem]);
  return true;
}
