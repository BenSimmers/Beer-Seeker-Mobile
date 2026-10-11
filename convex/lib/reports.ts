import { v, type Infer } from "convex/values";

export const reportReason = v.union(
  v.literal("spam"),
  v.literal("harassment"),
  v.literal("inappropriate"),
  v.literal("impersonation"),
  v.literal("underage"),
  v.literal("other"),
);

export type ReportReason = Infer<typeof reportReason>;

export const REPORT_DETAILS_MAX = 500;
