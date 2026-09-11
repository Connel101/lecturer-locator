import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import express from "express";

import { app as application } from "../src/app.ts";
import { createRequireAdmin } from "../src/middleware/require-admin.ts";

let server: Server;
let baseUrl: string;

before(() => {
  server = application.listen(0);
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(() => {
  server.close();
});

function sessionWithRole(role: string | null) {
  return {
    user: {
      id: "user-id",
      name: "Test User",
      email: "test@example.com",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      role,
      banned: false,
      banReason: null,
      banExpires: null,
    },
    session: {
      id: "session-id",
      userId: "user-id",
      token: "token",
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: null,
      userAgent: null,
      impersonatedBy: null,
    },
  };
}

async function requestProtectedRoute(
  resolveSession: Parameters<typeof createRequireAdmin>[0],
) {
  const testApp = express();
  testApp.get(
    "/protected",
    createRequireAdmin(resolveSession),
    (_req, res) => res.status(200).json({ allowed: true, auth: res.locals.auth }),
  );

  const testServer = testApp.listen(0);
  const address = testServer.address() as AddressInfo;

  try {
    return await fetch(`http://127.0.0.1:${address.port}/protected`);
  } finally {
    testServer.close();
  }
}

test("returns 401 without a valid session", async () => {
  const response = await requestProtectedRoute(async () => null);

  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.code, "UNAUTHENTICATED");
});

test("returns 403 for an authenticated non-admin user", async () => {
  const response = await requestProtectedRoute(async () => sessionWithRole("user"));

  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, "FORBIDDEN");
});

test("allows an administrator and exposes the session to handlers", async () => {
  const response = await requestProtectedRoute(async () => sessionWithRole("admin"));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.allowed, true);
  assert.equal(body.auth.user.role, "admin");
});

test("allows admin when the user has multiple roles", async () => {
  const response = await requestProtectedRoute(async () =>
    sessionWithRole("user, admin"),
  );

  assert.equal(response.status, 200);
});

test("returns 500 when session verification fails", async () => {
  const originalConsoleError = console.error;
  console.error = () => undefined;

  try {
    const response = await requestProtectedRoute(async () => {
      throw new Error("session store unavailable");
    });

    assert.equal(response.status, 500);
    assert.equal((await response.json()).error.code, "AUTH_CHECK_FAILED");
  } finally {
    console.error = originalConsoleError;
  }
});

test("public lecturer routes are not guarded by administrator authentication", async () => {
  const response = await fetch(`${baseUrl}/api/lecturers?search=a&search=b`);

  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, "INVALID_SEARCH");
});
