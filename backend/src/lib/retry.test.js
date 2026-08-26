import assert from "node:assert/strict";
import test from "node:test";
import { withBoundedBackoff } from "./retry.js";

test("retries with bounded exponential backoff", async () => {
  const delays = [];
  let calls = 0;
  const result = await withBoundedBackoff(
    async () => {
      calls += 1;
      if (calls < 4) throw new Error("temporarily unavailable");
      return "connected";
    },
    {
      attempts: 4,
      initialDelayMs: 100,
      maxDelayMs: 250,
      sleepFn: async (delay) => delays.push(delay),
    },
  );

  assert.equal(result, "connected");
  assert.deepEqual(delays, [100, 200, 250]);
});

test("stops after the configured attempt limit", async () => {
  let calls = 0;
  await assert.rejects(
    withBoundedBackoff(
      async () => {
        calls += 1;
        throw new Error("still unavailable");
      },
      { attempts: 3, sleepFn: async () => {} },
    ),
    /still unavailable/,
  );
  assert.equal(calls, 3);
});
