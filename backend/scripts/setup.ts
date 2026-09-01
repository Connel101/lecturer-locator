import { existsSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

const envPath = resolve(process.cwd(), ".env");

// Create .env only if it doesn't already exist
if (!existsSync(envPath)) {
  const authSecret = randomBytes(32).toString("base64");

  const env = `# Authentication
BETTER_AUTH_SECRET=${authSecret}
BETTER_AUTH_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://lecturer_locator:dev_password@localhost:5432/lecturer_locator
`;

  writeFileSync(envPath, env, {
    encoding: "utf8",
    flag: "wx",
  });

  console.log("✓ Created .env");
  console.log("✓ Generated BETTER_AUTH_SECRET");
} else {
  console.log("✓ .env already exists — leaving it unchanged.");
}

// Apply database migrations
console.log("Applying database migrations...");

try {
  execSync("npm run migrate", {
    stdio: "inherit",
  });

  console.log("✓ Database migrations applied");
} catch {
  console.error("✗ Failed to apply database migrations.");
  console.error("Make sure the PostgreSQL Docker container is running:");
  console.error("  docker compose up -d");
  process.exit(1);
}

console.log("");
console.log("Backend setup complete.");
console.log("Run `npm run dev` to start the backend.");