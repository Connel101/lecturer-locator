import "dotenv/config";

import { eq } from "drizzle-orm";

import { user } from "../src/db/auth-schema.ts";
import { auth } from "../src/lib/auth.ts";
import { db } from "../src/lib/db.ts";
import { provisionAdmin } from "../src/lib/provision-admin.ts";

const optional = process.argv.includes("--optional");
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  if (optional) {
    console.log("Admin provisioning skipped; ADMIN_EMAIL and ADMIN_PASSWORD are not both set.");
    process.exit(0);
  }

  console.error("ADMIN_EMAIL and ADMIN_PASSWORD must both be set.");
  process.exit(1);
}

try {
  const result = await provisionAdmin(
    {
      email,
      password,
      name: process.env.ADMIN_NAME,
    },
    {
      async findUserByEmail(normalizedEmail) {
        const [existingUser] = await db
          .select({ role: user.role })
          .from(user)
          .where(eq(user.email, normalizedEmail))
          .limit(1);
        return existingUser;
      },
      async createUser(newUser) {
        await auth.api.createUser({ body: newUser });
      },
    },
  );

  console.log(
    result === "created"
      ? `Administrator account created for ${email.trim().toLowerCase()}.`
      : `Administrator account already exists for ${email.trim().toLowerCase()}.`,
  );
} catch (error) {
  console.error(
    "Failed to provision administrator:",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
}
