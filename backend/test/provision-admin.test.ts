import assert from "node:assert/strict";
import { test } from "node:test";

import { provisionAdmin } from "../src/lib/provision-admin.ts";

const input = {
  email: " ADMIN@example.com ",
  password: "secure-password",
  name: "Site Admin",
};

test("creates an administrator through the supplied auth API", async () => {
  let createdUser: unknown;

  const result = await provisionAdmin(input, {
    async findUserByEmail() {
      return undefined;
    },
    async createUser(user) {
      createdUser = user;
    },
  });

  assert.equal(result, "created");
  assert.deepEqual(createdUser, {
    email: "admin@example.com",
    password: "secure-password",
    name: "Site Admin",
    role: "admin",
  });
});

test("is idempotent when the account is already an administrator", async () => {
  let createCalls = 0;

  const result = await provisionAdmin(input, {
    async findUserByEmail() {
      return { role: "user,admin" };
    },
    async createUser() {
      createCalls += 1;
    },
  });

  assert.equal(result, "already-admin");
  assert.equal(createCalls, 0);
});

test("refuses to change an existing non-admin account", async () => {
  await assert.rejects(
    provisionAdmin(input, {
      async findUserByEmail() {
        return { role: "user" };
      },
      async createUser() {
        assert.fail("createUser must not be called");
      },
    }),
    /non-administrator account already exists/,
  );
});
