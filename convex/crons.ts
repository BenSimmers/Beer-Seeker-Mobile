import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Every 15 minutes so zones with :30 and :45 offsets still get theirs on time.
crons.cron("weekend nudge", "*/15 * * * *", internal.nudges.sendDue, {});

export default crons;
