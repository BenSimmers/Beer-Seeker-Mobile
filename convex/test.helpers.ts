/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

export const HOUR = 60;

export const newTest = () => convexTest(schema, modules);

export type T = ReturnType<typeof newTest>;
export type User = Awaited<ReturnType<typeof makeUser>>;

/** A signed-in user with a profile. Convex Auth's token subject is "userId|sessionId". */
export const makeUser = async (t: T, username: string) => {
  const ids = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", { email: `${username}@example.com` });
    const sessionId = await ctx.db.insert("authSessions", {
      userId,
      expirationTime: Date.now() + 24 * 60 * 60_000,
    });
    return { userId, sessionId };
  });
  const as = t.withIdentity({ subject: `${ids.userId}|${ids.sessionId}` });
  await as.mutation(api.profiles.create, { username, displayName: username });
  return { ...ids, as };
};

/** `follower` asks to follow `followee`, who accepts. */
export const follow = async (follower: User, followee: User) => {
  await follower.as.mutation(api.social.follow, { userId: followee.userId });
  await followee.as.mutation(api.social.respond, { userId: follower.userId, accept: true });
};

export const befriend = async (a: User, b: User) => {
  await follow(a, b);
  await follow(b, a);
};

export const makeFriends = async (t: T) => {
  const ben = await makeUser(t, "ben");
  const sam = await makeUser(t, "sam");
  await befriend(ben, sam);
  return { ben, sam };
};
