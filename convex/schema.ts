import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // Public face of an account. Kept apart from `users` (owned by Convex Auth)
  // so an email address is never returned to anyone but its owner.
  profiles: defineTable({
    userId: v.id("users"),
    /** Lowercase handle, unique across profiles; see lib/username.ts. */
    username: v.string(),
    displayName: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_username", ["username"])
    .searchIndex("search_username", { searchField: "username" }),

  // A directed edge: `followerId` follows `followeeId`. Two edges pointing
  // opposite ways make the pair friends — there is no separate friends table.
  follows: defineTable({
    followerId: v.id("users"),
    followeeId: v.id("users"),
  })
    .index("by_follower", ["followerId", "followeeId"])
    .index("by_followee", ["followeeId", "followerId"]),
});
