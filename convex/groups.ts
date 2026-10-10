import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { hiddenFrom } from "./lib/blocks";
import {
  GROUPS_PER_USER_MAX,
  GROUP_MEMBERS_MAX,
  deleteGroup,
  leaveGroup,
  normalizeGroupName,
  rowFor,
  rowsForUser,
  rowsOf,
} from "./lib/groups";
import { areFriends, avatarUrlFor, profileFor, requireUserId } from "./lib/session";
import { requireShareMinutes, shareUntil } from "./lib/sharing";

export type GroupMember = {
  userId: Id<"users">;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  status: "invited" | "member";
  isOwner: boolean;
  isYou: boolean;
};

export type Group = {
  groupId: Id<"groups">;
  name: string;
  youOwn: boolean;
  members: GroupMember[];
};

export type GroupInvite = {
  groupId: Id<"groups">;
  name: string;
  invitedBy: string;
  memberCount: number;
};

const requireMembership = async (ctx: QueryCtx, groupId: Id<"groups">) => {
  const me = await requireUserId(ctx);
  const [group, row] = await Promise.all([ctx.db.get(groupId), rowFor(ctx, groupId, me)]);
  if (!group || row?.status !== "member") throw new ConvexError("You're not in that group.");
  return { me, group };
};

const requireOwnership = async (ctx: QueryCtx, groupId: Id<"groups">) => {
  const found = await requireMembership(ctx, groupId);
  if (found.group.ownerId !== found.me) {
    throw new ConvexError("Only the group's creator can do that.");
  }
  return found;
};

/** Invites friends of `me` who aren't in the group yet, within the size limits. */
const inviteAll = async (
  ctx: MutationCtx,
  group: Doc<"groups">,
  me: Id<"users">,
  userIds: Id<"users">[],
) => {
  const existing = await rowsOf(ctx, group._id);
  const already = new Set(existing.map((r) => r.userId));
  const fresh = [...new Set(userIds)].filter((id) => !already.has(id));
  if (existing.length + fresh.length > GROUP_MEMBERS_MAX) {
    throw new ConvexError(`Groups can have up to ${GROUP_MEMBERS_MAX} people.`);
  }
  for (const userId of fresh) {
    const [profile, friends, theirGroups] = await Promise.all([
      profileFor(ctx, userId),
      areFriends(ctx, me, userId),
      rowsForUser(ctx, userId),
    ]);
    if (!profile || !friends) throw new ConvexError("You can only add your friends to a group.");
    if (theirGroups.length >= GROUPS_PER_USER_MAX) {
      throw new ConvexError(`@${profile.username} is in too many groups to join another.`);
    }
    await ctx.db.insert("groupMembers", {
      groupId: group._id,
      userId,
      status: "invited",
      invitedBy: me,
      since: Date.now(),
    });
  }
};

const describe = async (ctx: QueryCtx, group: Doc<"groups">, me: Id<"users">): Promise<Group> => {
  const [rows, hidden] = await Promise.all([rowsOf(ctx, group._id), hiddenFrom(ctx, me)]);
  const members = await Promise.all(
    rows
      .filter((r) => !hidden.has(r.userId))
      .map(async (r): Promise<GroupMember | null> => {
        const profile = await profileFor(ctx, r.userId);
        if (!profile) return null;
        return {
          userId: r.userId,
          username: profile.username,
          displayName: profile.displayName,
          avatarUrl: await avatarUrlFor(ctx, profile),
          status: r.status,
          isOwner: r.userId === group.ownerId,
          isYou: r.userId === me,
        };
      }),
  );
  return {
    groupId: group._id,
    name: group.name,
    youOwn: group.ownerId === me,
    members: members
      .filter((m) => m !== null)
      // Owner first, then members by name, invitees last.
      .sort(
        (a, b) =>
          Number(b.isOwner) - Number(a.isOwner) ||
          Number(a.status === "invited") - Number(b.status === "invited") ||
          a.displayName.localeCompare(b.displayName),
      ),
  };
};

/** Groups the caller has joined, by name. */
export const mine = query({
  args: {},
  handler: async (ctx): Promise<Group[]> => {
    const me = await requireUserId(ctx);
    const rows = (await rowsForUser(ctx, me)).filter((r) => r.status === "member");
    const groups = await Promise.all(rows.map((r) => ctx.db.get(r.groupId)));
    const described = await Promise.all(
      groups.filter((g) => g !== null).map((g) => describe(ctx, g, me)),
    );
    return described.sort((a, b) => a.name.localeCompare(b.name));
  },
});

/** One group the caller is in, or null if they aren't (any more). */
export const get = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }): Promise<Group | null> => {
    const me = await requireUserId(ctx);
    const [group, row] = await Promise.all([ctx.db.get(groupId), rowFor(ctx, groupId, me)]);
    if (!group || row?.status !== "member") return null;
    return describe(ctx, group, me);
  },
});

export const invites = query({
  args: {},
  handler: async (ctx): Promise<GroupInvite[]> => {
    const me = await requireUserId(ctx);
    const rows = (await rowsForUser(ctx, me)).filter((r) => r.status === "invited");
    const found = await Promise.all(
      rows.map(async (r): Promise<GroupInvite | null> => {
        const [group, inviter, members] = await Promise.all([
          ctx.db.get(r.groupId),
          profileFor(ctx, r.invitedBy),
          rowsOf(ctx, r.groupId),
        ]);
        if (!group) return null;
        return {
          groupId: group._id,
          name: group.name,
          invitedBy: inviter?.displayName ?? "Someone",
          memberCount: members.filter((m) => m.status === "member").length,
        };
      }),
    );
    return found.filter((i) => i !== null);
  },
});

/** Makes a group owned by the caller and invites `memberIds`, who must be friends. */
export const create = mutation({
  args: { name: v.string(), memberIds: v.array(v.id("users")) },
  handler: async (ctx, { name, memberIds }): Promise<Id<"groups">> => {
    const me = await requireUserId(ctx);
    if ((await rowsForUser(ctx, me)).length >= GROUPS_PER_USER_MAX) {
      throw new ConvexError(`You can be in up to ${GROUPS_PER_USER_MAX} groups.`);
    }
    const groupId = await ctx.db.insert("groups", { name: normalizeGroupName(name), ownerId: me });
    await ctx.db.insert("groupMembers", {
      groupId,
      userId: me,
      status: "member",
      invitedBy: me,
      since: Date.now(),
    });
    const group = await ctx.db.get(groupId);
    if (group)
      await inviteAll(
        ctx,
        group,
        me,
        memberIds.filter((id) => id !== me),
      );
    return groupId;
  },
});

export const invite = mutation({
  args: { groupId: v.id("groups"), userIds: v.array(v.id("users")) },
  handler: async (ctx, { groupId, userIds }) => {
    const { me, group } = await requireOwnership(ctx, groupId);
    await inviteAll(ctx, group, me, userIds);
  },
});

export const respond = mutation({
  args: { groupId: v.id("groups"), accept: v.boolean() },
  handler: async (ctx, { groupId, accept }) => {
    const me = await requireUserId(ctx);
    const row = await rowFor(ctx, groupId, me);
    if (!row || row.status !== "invited") return;
    if (accept) await ctx.db.patch(row._id, { status: "member", since: Date.now() });
    else await ctx.db.delete(row._id);
  },
});

/** Removes a member or cancels an invite. The owner leaves with `leave`. */
export const removeMember = mutation({
  args: { groupId: v.id("groups"), userId: v.id("users") },
  handler: async (ctx, { groupId, userId }) => {
    const { me } = await requireOwnership(ctx, groupId);
    if (userId === me) throw new ConvexError("Leave the group instead.");
    const row = await rowFor(ctx, groupId, userId);
    if (row) await ctx.db.delete(row._id);
  },
});

export const leave = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const me = await requireUserId(ctx);
    await leaveGroup(ctx, groupId, me);
  },
});

export const rename = mutation({
  args: { groupId: v.id("groups"), name: v.string() },
  handler: async (ctx, { groupId, name }) => {
    await requireOwnership(ctx, groupId);
    await ctx.db.patch(groupId, { name: normalizeGroupName(name) });
  },
});

export const remove = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    await requireOwnership(ctx, groupId);
    await deleteGroup(ctx, groupId);
  },
});

/**
 * Shares the caller's location with every member who is also their friend —
 * sharing stays friends-only, so other members are skipped and counted.
 */
export const shareWithGroup = mutation({
  args: { groupId: v.id("groups"), minutes: v.number() },
  handler: async (ctx, { groupId, minutes }): Promise<{ shared: number; skipped: number }> => {
    const { me } = await requireMembership(ctx, groupId);
    requireShareMinutes(minutes);
    const others = (await rowsOf(ctx, groupId)).filter(
      (r) => r.status === "member" && r.userId !== me,
    );
    const expiresAt = Date.now() + minutes * 60_000;
    let shared = 0;
    for (const row of others) {
      if (!(await areFriends(ctx, me, row.userId))) continue;
      await shareUntil(ctx, me, row.userId, expiresAt);
      shared++;
    }
    return { shared, skipped: others.length - shared };
  },
});
