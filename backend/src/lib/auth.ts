import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { admin } from "better-auth/plugins"
import { db } from "./db.ts";
import * as schema from "../db/schema.ts";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  plugins: [
    admin(),
  ],
});
