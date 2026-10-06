/**
 * Prints a bcrypt hash for ADMIN_PASSWORD_HASH.
 *
 *   pnpm admin:hash <password>
 *   pnpm admin:hash "my new password"
 *
 * /admin has no username — this one hash is the whole login — so this is the only
 * way to rotate it. Copy the printed line into `.env`:
 *
 *   ADMIN_PASSWORD_HASH='\$2b\$10\$...'
 *
 * The backslashes are required and easy to lose. Next.js runs `dotenv-expand` over
 * every value in `.env`, which treats a bare `$` as a variable reference: an
 * unescaped `$2b$10$...` is expanded to whatever those names resolve to (usually
 * nothing), so `bcrypt.compareSync` receives a truncated string and rejects the
 * correct password too. `\${DOLLAR}` is read back as a literal `$`.
 *
 * Cost 10 matches prisma/seed.mts and anything else that hashes passwords here.
 * The password is never logged, only the hash. Passing it on the command line puts
 * it in your shell history; a single leading `-` also stops most shells from
 * treating it as a flag.
 */
import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error('Usage: pnpm admin:hash <password>   e.g. pnpm admin:hash "admin1234"');
  process.exit(1);
}

// bcrypt truncates at 72 bytes, so a longer password would silently lose its tail.
// lib/prisma.ts and lib/auth.ts both read the hash straight from the env, so the
// round trip has to be exact.
if (Buffer.byteLength(password, "utf8") > 72) {
  console.error(
    `Password is ${Buffer.byteLength(password, "utf8")} bytes; bcrypt only uses the first 72.`,
  );
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);

if (!bcrypt.compareSync(password, hash)) {
  throw new Error("generated hash does not verify against the password");
}

// Escaped for `.env`: Next expands a bare `$` as a variable reference, which would
// truncate the hash and make the correct password fail. See the note at the top.
const forEnv = hash.replace(/\$/g, "\\$");

console.log(hash);
console.error(`\nADMIN_PASSWORD_HASH='${forEnv}'`);
console.error("\nPaste that line into .env, keeping the single quotes and the backslashes.");
