import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { admin } from "better-auth/plugins"
import { db } from "./db.ts";
import * as appSchema from "../db/schema.ts";
import * as authSchema from "../db/auth-schema.ts";

const schema = {
  //...appSchema, only include when necessary
  ...authSchema,
};

export const auth = betterAuth({
  trustedOrigins:
  process.env.NODE_ENV === "production"
    ? []
    : ["http://localhost:5173"],
    
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
