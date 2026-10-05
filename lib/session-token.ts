/**
 * Signed session tokens — pure, no `next/headers`.
 *
 * Kept separate from `lib/auth.ts` so `proxy.ts` can verify a cookie in the Edge
 * runtime without dragging in server-only modules. The cookie is stateless: it
 * carries only an issued-at and an expiry, both covered by the HMAC.
 */

export const SESSION_COOKIE = "alzaytona_admin";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

type SessionPayload = {
  /** Issued-at, seconds since epoch. */
  iat: number;
  exp: number;
};

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    throw new Error("SESSION_SECRET is not set — copy .env.example to .env");
  }
  return value;
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

/** HMAC-SHA256 via Web Crypto, which is available on both Node and the Edge. */
async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return base64Url(new Uint8Array(mac));
}

export async function createSessionToken(
  now = Math.floor(Date.now() / 1000),
): Promise<string> {
  const body = base64Url(
    new TextEncoder().encode(
      JSON.stringify({ iat: now, exp: now + SESSION_MAX_AGE_SECONDS } satisfies SessionPayload),
    ),
  );
  return `${body}.${await sign(body)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;

  const [body, signature] = token.split(".");
  if (!body || !signature) return false;

  // Compare in constant time. The length check first is unavoidable, but both
  // values are base64url HMACs of a known length, so it leaks nothing useful.
  const expected = await sign(body);
  const a = new TextEncoder().encode(expected);
  const b = new TextEncoder().encode(signature);
  if (a.length !== b.length) return false;

  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) mismatch |= a[index] ^ b[index];
  if (mismatch !== 0) return false;

  try {
    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(body)),
    ) as SessionPayload;
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
