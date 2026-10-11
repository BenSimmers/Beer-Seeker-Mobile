// @vitest-environment edge-runtime
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import { makeUser, newTest, type T } from "./test.helpers";

const allReports = (t: T) => t.run((ctx) => ctx.db.query("reports").collect());

describe("reports", () => {
  it("records the report with the profile as it was", async () => {
    const t = newTest();
    const ben = await makeUser(t, "ben");
    const sam = await makeUser(t, "sam");

    await ben.as.mutation(api.reports.report, {
      userId: sam.userId,
      reason: "harassment",
      details: "  Sent me abuse  ",
    });
    // Editing afterwards doesn't change what was reported.
    await sam.as.mutation(api.profiles.update, {
      displayName: "Totally Nice",
      bio: "",
      showFavourites: true,
    });

    expect(await allReports(t)).toMatchObject([
      {
        reporterId: ben.userId,
        reportedId: sam.userId,
        reason: "harassment",
        details: "Sent me abuse",
        status: "open",
        snapshot: { username: "sam", displayName: "sam" },
      },
    ]);
  });

  it("updates an open report instead of filing a duplicate", async () => {
    const t = newTest();
    const ben = await makeUser(t, "ben");
    const sam = await makeUser(t, "sam");

    await ben.as.mutation(api.reports.report, { userId: sam.userId, reason: "spam" });
    await ben.as.mutation(api.reports.report, { userId: sam.userId, reason: "impersonation" });
    expect(await allReports(t)).toMatchObject([{ reason: "impersonation" }]);

    // Once resolved, a new report is a new case.
    await t.run(async (ctx) => {
      const [report] = await ctx.db.query("reports").collect();
      if (report) await ctx.db.patch(report._id, { status: "resolved" });
    });
    await ben.as.mutation(api.reports.report, { userId: sam.userId, reason: "spam" });
    expect(await allReports(t)).toHaveLength(2);
  });

  it("refuses to report yourself or send an essay", async () => {
    const t = newTest();
    const ben = await makeUser(t, "ben");
    const sam = await makeUser(t, "sam");

    await expect(
      ben.as.mutation(api.reports.report, { userId: ben.userId, reason: "spam" }),
    ).rejects.toThrow(/yourself/);
    await expect(
      ben.as.mutation(api.reports.report, {
        userId: sam.userId,
        reason: "other",
        details: "x".repeat(501),
      }),
    ).rejects.toThrow(/500/);
    expect(await allReports(t)).toHaveLength(0);
  });

  it("is removed when either account is deleted", async () => {
    const t = newTest();
    const ben = await makeUser(t, "ben");
    const sam = await makeUser(t, "sam");
    const kim = await makeUser(t, "kim");
    await ben.as.mutation(api.reports.report, { userId: sam.userId, reason: "spam" });
    await sam.as.mutation(api.reports.report, { userId: kim.userId, reason: "spam" });
    await kim.as.mutation(api.reports.report, { userId: ben.userId, reason: "spam" });

    await sam.as.mutation(api.account.deleteAccount, {});

    expect(await allReports(t)).toMatchObject([{ reporterId: kim.userId }]);
  });
});
