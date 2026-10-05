import "dotenv/config";
import { Client } from "pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const client = new Client({ connectionString: url });
await client.connect();
const result = await client.query<{ version: string }>("select version()");
console.log("connected:", result.rows[0].version);
await client.end();