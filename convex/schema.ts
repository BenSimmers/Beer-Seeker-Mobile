import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { reportReason } from "./lib/reports";

export default defineSchema({
  ...authTables,

  // Public face of an account. Kept apart from `users` (owned by Convex Auth)
  // so an email address is never returned to anyone but its owner.
  profiles: defineTable({
    userId: v.id("users"),
    /** Lowercase handle, unique across profiles; see lib/username.ts. */
    username: v.string(),
    displayName: v.string(),
    bio: v.optional(v.string()),
    avatarId: v.optional(v.id("_storage")),
    /** Friends can see your favourite places unless this is false. */
    showFavourites: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"])
    .index("by_username", ["username"])
    .index("by_avatar", ["avatarId"])
    .searchIndex("search_username", { searchField: "username" }),

  // A directed edge: `followerId` follows `followeeId`. Two edges pointing
  // opposite ways make the pair friends — there is no separate friends table.
  follows: defineTable({
    followerId: v.id("users"),
    followeeId: v.id("users"),
  })
    .index("by_follower", ["followerId", "followeeId"])
    .index("by_followee", ["followeeId", "followerId"]),

  // `requesterId` wants to follow `targetId`, who hasn't answered yet. Accepting
  // turns it into a `follows` edge; every follow starts here.
  followRequests: defineTable({
    requesterId: v.id("users"),
    targetId: v.id("users"),
    requestedAt: v.number(),
  })
    .index("by_requester", ["requesterId", "targetId"])
    .index("by_target", ["targetId", "requestedAt"]),

  // Server copy of a user's favourite places, mirrored from the device so
  // friends can see them on a profile. The device stays the source of truth.
  favouritePlaces: defineTable({
    userId: v.id("users"),
    /** favouriteKey(): rounded coordinates, unique per user. */
    key: v.string(),
    name: v.string(),
    lat: v.number(),
    lng: v.number(),
    vicinity: v.string(),
    category: v.string(),
    savedAt: v.number(),
  }).index("by_user", ["userId", "key"]),

  // `ownerId` lets `viewerId` see where they are until `expiresAt`. Opt-in per
  // friend and always time-boxed; a scheduled job deletes the row on expiry.
  locationShares: defineTable({
    ownerId: v.id("users"),
    viewerId: v.id("users"),
    expiresAt: v.number(),
  })
    .index("by_owner", ["ownerId", "viewerId"])
    .index("by_viewer", ["viewerId", "ownerId"]),

  // Latest position of anyone sharing with at least one friend. High-churn, so
  // kept off `profiles`; deleted as soon as the owner's last share ends.
  liveLocations: defineTable({
    userId: v.id("users"),
    lat: v.number(),
    lng: v.number(),
    /** Horizontal accuracy radius in metres, when the device reports one. */
    accuracy: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // A named set of people who can filter their friends map down to each other
  // and share with everyone at once. Run by `ownerId`; anyone can leave.
  groups: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
  }),

  // Membership, or an invite until it's accepted. The owner has a row too.
  groupMembers: defineTable({
    groupId: v.id("groups"),
    userId: v.id("users"),
    status: v.union(v.literal("invited"), v.literal("member")),
    invitedBy: v.id("users"),
    /** When they joined, or were invited while still pending. */
    since: v.number(),
  })
    .index("by_group", ["groupId", "userId"])
    .index("by_user", ["userId", "status"]),

  // `blockerId` has blocked `blockedId`. Hides the pair from each other both
  // ways; blocking also removes follows and location shares between them.
  blocks: defineTable({
    blockerId: v.id("users"),
    blockedId: v.id("users"),
    blockedAt: v.number(),
  })
    .index("by_blocker", ["blockerId", "blockedId"])
    .index("by_blocked", ["blockedId", "blockerId"]),

  // One user flagging another for review. Moderated by hand in the Convex
  // dashboard: set `status` to "resolved" once dealt with.
  reports: defineTable({
    reporterId: v.id("users"),
    reportedId: v.id("users"),
    reason: reportReason,
    details: v.optional(v.string()),
    /** Their profile as it was when reported, since they can edit it after. */
    snapshot: v.object({
      username: v.string(),
      displayName: v.string(),
      bio: v.optional(v.string()),
    }),
    status: v.union(v.literal("open"), v.literal("resolved")),
    reportedAt: v.number(),
  })
    .index("by_reporter", ["reporterId", "reportedId", "status"])
    .index("by_reported", ["reportedId", "status"]),
});
