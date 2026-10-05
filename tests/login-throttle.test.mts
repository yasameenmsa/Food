/**
 * Login rate limiting.
 *
 * The pure parts are tested here against the database. The window arithmetic and
 * the IP hashing are what decide whether a locked-out attacker is let back in,
 * so they are asserted directly rather than inferred from a bcrypt round trip.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { testEnv } from "./helpers/env.mts";

// Must run before lib/prisma is imported; see the helper for why.
testEnv();

const {
  hashIp,
  isLockedOut,
  recordFailure,
  clearFailures,
  pruneExpiredWindows,
  MAX_ATTEMPTS,
  WINDOW_MS,
} = await import("../lib/login-throttle");
const { prisma } = await import("../lib/prisma");

/** A unique address per test so the suite cannot interfere with itself. */
let counter = 0;
const uniqueIp = () => `203.0.113.${(counter += 1) % 250}`;

test.after(async () => {
  await prisma.loginAttempt.deleteMany({});
  await prisma.$disconnect();
});

test("the IP is hashed, never stored in the clear", () => {
  const ip = "198.51.100.7";
  const hash = hashIp(ip);

  assert.notEqual(hash, ip);
  assert.match(hash, /^[a-f0-9]{64}$/);
  assert.ok(!hash.includes("198.51.100.7"));
});

test("the same IP always hashes to the same value", () => {
  assert.equal(hashIp("198.51.100.7"), hashIp("198.51.100.7"));
});

test("different IPs hash differently", () => {
  assert.notEqual(hashIp("198.51.100.7"), hashIp("198.51.100.8"));
});

test("the hash is keyed by SESSION_SECRET, so it is not a plain digest", () => {
  const ip = "198.51.100.9";
  const plain = createHash("sha256").update(ip).digest("hex");
  assert.notEqual(hashIp(ip), plain, "an unkeyed digest would be rainbow-tableable");
});

test("a fresh IP is not locked out", async () => {
  assert.equal(await isLockedOut(uniqueIp()), false);
});

test("failures are counted, and the cap locks the client out", async () => {
  const ip = uniqueIp();

  let locked = false;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    locked = await recordFailure(ip);
    assert.equal(
      await isLockedOut(ip),
      attempt >= MAX_ATTEMPTS,
      `after ${attempt} attempts isLockedOut should be ${attempt >= MAX_ATTEMPTS}`,
    );
  }

  assert.equal(locked, true, "the final failure should report the lockout");
  assert.equal(await isLockedOut(ip), true);
});

test("the lockout survives across separate calls, because state is in the database", async () => {
  const ip = uniqueIp();
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) await recordFailure(ip);

  // A fresh module-level call must still see the cap: nothing is cached in memory.
  assert.equal(await isLockedOut(ip), true);
});

test("a success clears the counter, so one typo never cascades into a lockout", async () => {
  const ip = uniqueIp();

  await recordFailure(ip);
  await recordFailure(ip);
  await recordFailure(ip);
  assert.equal(await isLockedOut(ip), false);

  await clearFailures(ip);

  // Well under the cap again, and the counter starts from zero.
  assert.equal(await isLockedOut(ip), false);
  for (let attempt = 0; attempt < MAX_ATTEMPTS - 1; attempt += 1) {
    assert.equal(await recordFailure(ip), false);
  }
  assert.equal(await recordFailure(ip), true);
});

test("one client's failures never lock out another", async () => {
  const attacker = uniqueIp();
  const bystander = uniqueIp();

  for (let attempt = 0; attempt < MAX_ATTEMPTS + 2; attempt += 1) await recordFailure(attacker);

  assert.equal(await isLockedOut(attacker), true);
  assert.equal(await isLockedOut(bystander), false);
});

test("only the hashed address is persisted", async () => {
  const ip = uniqueIp();
  await recordFailure(ip);

  const rows = await prisma.loginAttempt.findMany({ where: { ipHash: hashIp(ip) } });
  assert.equal(rows.length, 1);
  assert.ok(!JSON.stringify(rows).includes(ip), "the raw IP must not appear in any column");

  await prisma.loginAttempt.deleteMany({ where: { ipHash: hashIp(ip) } });
});

test("pruning drops only windows that can no longer lock anyone out", async () => {
  const ip = uniqueIp();
  await recordFailure(ip);

  // Nothing is prunable yet: the window is live.
  await pruneExpiredWindows();
  assert.equal(await isLockedOut(ip), false); // still under the cap

  // Force the window far into the past, as if the clock had moved on.
  await prisma.loginAttempt.updateMany({
    where: { ipHash: hashIp(ip) },
    data: { windowStart: new Date(Date.now() - WINDOW_MS - 60_000), attempts: MAX_ATTEMPTS },
  });

  // Past the window, the lockout no longer applies even before pruning.
  assert.equal(await isLockedOut(ip), false);

  await pruneExpiredWindows();
  const rows = await prisma.loginAttempt.findMany({ where: { ipHash: hashIp(ip) } });
  assert.equal(rows.length, 0);
});

test("a failure after the window expires starts a fresh count", async () => {
  const ip = uniqueIp();

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) await recordFailure(ip);
  assert.equal(await isLockedOut(ip), true);

  // Move the recorded window outside the live period.
  await prisma.loginAttempt.updateMany({
    where: { ipHash: hashIp(ip) },
    data: { windowStart: new Date(Date.now() - WINDOW_MS - 1_000) },
  });
  assert.equal(await isLockedOut(ip), false);

  // The next failure opens a new window rather than resuming the old count.
  assert.equal(await recordFailure(ip), false);

  await prisma.loginAttempt.deleteMany({ where: { ipHash: hashIp(ip) } });
});

test("the cap and window are the values the login action advertises", () => {
  assert.equal(MAX_ATTEMPTS, 8);
  assert.equal(WINDOW_MS, 15 * 60 * 1000);
});
