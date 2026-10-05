import "dotenv/config";
import { Client } from "pg";

const url = process.env.DATABASE_URL!;

const one = new Client({ connectionString: url });
const two = new Client({ connectionString: url });

await one.connect();
console.log("first connection: OK");

try {
  await two.connect();
  console.log("second connection: OK");
  const r = await two.query("select 1 as x");
  console.log("second query:", r.rows[0].x);
  await two.end();
} catch (error) {
  console.log("second connection FAILED:", (error as Error).message);
}

await one.end();