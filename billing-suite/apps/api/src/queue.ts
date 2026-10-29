import { Queue } from "bullmq";
import IORedis from "ioredis";
import { env } from "./env";

const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });

export const extractionQueue = new Queue("extraction", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 1000,
    removeOnFail: false, // keep failed jobs as a dead-letter set for inspection
  },
});
