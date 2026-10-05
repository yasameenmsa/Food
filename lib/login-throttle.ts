/**
 * Login rate limiting.
 *
 * There is exactly one admin password, and it guards every dish, every price,
 * and every customer phone number and delivery address. Without a cap, bcrypt's
 * cost factor is the only thing between an attacker and the whole database, so
 * the cap lives in the database: it survives a restart, works across instances,
 * and the owner can inspect it.
 *
 * The client IP is hashed with SESSION_SECRET before it is stored. This table
 * should not become a log of who connected to the shop.
 */
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

/** Consecutive failures allowed inside one window. */
export const MAX_ATTEMPTS = 8;

/** How long a window lasts. */
export const WINDOW_MS = 15 * 60 * 1000;

/** SHA-256 of the client IP, keyed with the session secret. */
export function hashIp(ip: string): string {
  const secret = process.env.SESSION_SECRET ?? "dev-only-change-me";
  return createHash("sha256").update(`${secret}:${ip}`).digest("hex");
}

/**
 * Counts a failure and reports whether the client is now locked out.
 *
 * The read and the increment happen in one transaction so two concurrent
 * requests cannot both read "7 attempts" and both be let through as the eighth.
 */
export async function recordFailure(ip: string): Promise<boolean> {
  const ipHash = hashIp(ip);
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_MS);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.loginAttempt.findFirst({
      where: { ipHash, windowStart: { gte: windowStart } },
      orderBy: { windowStart: "desc" },
    });

    // No row inside the live window, or the last row belongs to an expired
    // window: start a fresh one.
    if (!existing) {
      await tx.loginAttempt.deleteMany({ where: { ipHash } });
      await tx.loginAttempt.create({
        data: { ipHash, windowStart: now, attempts: 1 },
      });
      return 1 >= MAX_ATTEMPTS;
    }

    const attempts = existing.attempts + 1;
    await tx.loginAttempt.update({
      where: { id: existing.id },
      data: { attempts, windowStart: now },
    });
    return attempts >= MAX_ATTEMPTS;
  });
}

/** True while the client is over the cap and the window has not expired. */
export async function isLockedOut(ip: string): Promise<boolean> {
  const ipHash = hashIp(ip);
  const windowStart = new Date(Date.now() - WINDOW_MS);
  const row = await prisma.loginAttempt.findFirst({
    where: { ipHash, windowStart: { gte: windowStart } },
    orderBy: { windowStart: "desc" },
  });
  return row !== null && row.attempts >= MAX_ATTEMPTS;
}

/** Clears the counter after a correct password, so one typo never cascades. */
export async function clearFailures(ip: string): Promise<void> {
  await prisma.loginAttempt.deleteMany({ where: { ipHash: hashIp(ip) } });
}

/** Housekeeping: drop windows that can no longer lock anyone out. */
export async function pruneExpiredWindows(): Promise<void> {
  await prisma.loginAttempt.deleteMany({
    where: { windowStart: { lt: new Date(Date.now() - WINDOW_MS) } },
  });
}
