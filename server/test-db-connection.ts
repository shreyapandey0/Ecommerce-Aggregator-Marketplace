import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import "dotenv/config";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in .env file");
}

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

async function testConnection() {
  try {
    const result = await client`SELECT 1+1 AS test`;
    console.log("✅ Database connection successful. Result:", result);
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  } finally {
    await client.end();
  }
}

testConnection();
