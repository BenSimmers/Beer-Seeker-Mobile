import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { stopsOf } from "./crawl";
import { requireUserId } from "./session";

/** Members plus pending invites; small enough to read whole. */
export const GROUP_MEMBERS_MAX = 20;
/** Groups one person belongs to or is invited to. */
export const GROUPS_PER_USER_MAX = 50;
export const GROUP_NAME_MAX = 40;

export const normalizeGroupName = (name: string) => {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (!trimmed) throw new ConvexError("Give the group a name.");
  if (trimmed.length > GROUP_NAME_MAX) {
    throw new ConvexError(`Keep the name under ${GROUP_NAME_MAX} characters.`);
  }
  return trimmed;
};

export const rowsOf = (ctx: QueryCtx, groupId: Id<"groups">) =>
  ctx.db
    .query("groupMembers")
    .withIndex("by_group", (q) => q.eq("groupId", groupId))
    .take(GROUP_MEMBERS_MAX);

export const rowFor = (ctx: QueryCtx, groupId: Id<"groups">, userId: Id<"users">) =>
  ctx.db
    .query("groupMembers")
    .withIndex("by_group", (q) => q.eq("groupId", groupId).eq("userId", userId))
    .unique();

export const rowsForUser = (ctx: QueryCtx, userId: Id<"users">) =>
  ctx.db
    .query("groupMembers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .take(GROUPS_PER_USER_MAX);

export const requireMembership = async (ctx: QueryCtx, groupId: Id<"groups">) => {
  const me = await requireUserId(ctx);
  const [group, row] = await Promise.all([ctx.db.get(groupId), rowFor(ctx, groupId, me)]);
  if (!group || row?.status !== "member") throw new ConvexError("You're not in that group.");
  return { me, group };
};

export const deleteGroup = async (ctx: MutationCtx, groupId: Id<"groups">) => {
  for (const row of await rowsOf(ctx, groupId)) await ctx.db.delete(row._id);
  for (const stop of await stopsOf(ctx, groupId)) await ctx.db.delete(stop._id);
  await ctx.db.delete(groupId);
};

export const leaveGroup = async (ctx: MutationCtx, groupId: Id<"groups">, userId: Id<"users">) => {
  const group = await ctx.db.get(groupId);
  if (!group) return;
  const rows = await rowsOf(ctx, groupId);
  const mine = rows.find((r) => r.userId === userId);
  if (mine) await ctx.db.delete(mine._id);
  if (group.ownerId !== userId) return;

  const [heir] = rows
    .filter((r) => r.userId !== userId && r.status === "member")
    .sort((a, b) => a.since - b.since);
  if (heir) await ctx.db.patch(groupId, { ownerId: heir.userId });
  else await deleteGroup(ctx, groupId);
};

export const separateInGroups = async (
  ctx: MutationCtx,
  blockerId: Id<"users">,
  blockedId: Id<"users">,
) => {
  for (const row of await rowsForUser(ctx, blockerId)) {
    const group = await ctx.db.get(row.groupId);
    if (!group) continue;
    if (group.ownerId === blockerId) {
      const theirs = await rowFor(ctx, group._id, blockedId);
      if (theirs) await ctx.db.delete(theirs._id);
    } else if (group.ownerId === blockedId) {
      await leaveGroup(ctx, group._id, blockerId);
    }
  }
};
