import * as path from "node:path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "..", ".env") });

if (!process.env.DATABASE_URL) {
  console.warn(
    "[e2e] DATABASE_URL is unset; integration e2e specs will fail to connect.",
  );
}
