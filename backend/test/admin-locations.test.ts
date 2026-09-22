import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import type { Request, Response } from "express";

import { app as application } from "../src/app.ts";
import {
  createFloorPlan,
  createOffice,
  createRoute,
  deleteFloorPlan,
  deleteOffice,
  deleteRoute,
  updateFloorPlan,
  updateOffice,
  updateRoute,
} from "../src/controllers/admin-locations.ts";

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

/**
 * Creates a minimal Express response object for controller validation tests.
 * These tests stop before any database operation is reached.
 */
function createMockResponse() {
  const state: {
    statusCode: number;
    body: unknown;
    sent: boolean;
  } = {
    statusCode: 200,
    body: undefined,
    sent: false,
  };

  const res = {
    status(code: number) {
      state.statusCode = code;
      return res;
    },

    json(body: unknown) {
      state.body = body;
      return res;
    },

    send() {
      state.sent = true;
      return res;
    },
  } as unknown as Response;

  return { res, state };
}

/**
 * Creates the small portion of an Express request needed by these tests.
 */
function createRequest(
  body: Record<string, unknown> = {},
  params: Record<string, string> = {},
): Request {
  return {
    body,
    params,
  } as unknown as Request;
}

test("admin location routes require administrator authentication", async () => {
  const endpoints = [
    "/api/admin/floor-plans",
    "/api/admin/offices",
    "/api/admin/routes",
  ];

  for (const endpoint of endpoints) {
    const response = await fetch(`${baseUrl}${endpoint}`);

    assert.equal(response.status, 401);

    const body = await response.json();

    assert.equal(body.error.code, "UNAUTHENTICATED");
  }
});

test("rejects an invalid floor-plan ID for deletion", async () => {
  const req = {
    params: { id: "invalid" },
  } as unknown as Request;

  const mock = createMockResponse();

  await deleteFloorPlan(req, mock.res);

  assert.equal(mock.state.statusCode, 400);
  assert.deepEqual(mock.state.body, {
    error: {
      code: "INVALID_FLOOR_PLAN_ID",
      message: "Floor plan ID must be a positive integer.",
    },
  });
});

test("rejects a floor plan without a building name", async () => {
  const { res, state } = createMockResponse();

  await createFloorPlan(
    createRequest({
      floorLevel: 0,
      fileRef: "/data/floorplans/ground.svg",
    }),
    res,
  );

  assert.equal(state.statusCode, 400);
  assert.equal(
    (state.body as { error: { code: string } }).error.code,
    "INVALID_BUILDING_NAME",
  );
});

test("rejects an invalid floor-plan ID", async () => {
  const { res, state } = createMockResponse();

  await updateFloorPlan(
    createRequest({}, { id: "not-a-number" }),
    res,
  );

  assert.equal(state.statusCode, 404);
  assert.equal(
    (state.body as { error: { code: string } }).error.code,
    "FLOOR_PLAN_NOT_FOUND",
  );
});

test("rejects an office without a valid floor-plan ID", async () => {
  const { res, state } = createMockResponse();

  await createOffice(
    createRequest({
      floorPlanId: -1,
      roomNumber: "G01",
    }),
    res,
  );

  assert.equal(state.statusCode, 400);
  assert.equal(
    (state.body as { error: { code: string } }).error.code,
    "INVALID_FLOOR_PLAN_ID",
  );
});

test("rejects an invalid office ID for update", async () => {
  const { res, state } = createMockResponse();

  await updateOffice(
    createRequest({}, { id: "invalid" }),
    res,
  );

  assert.equal(state.statusCode, 404);
  assert.equal(
    (state.body as { error: { code: string } }).error.code,
    "OFFICE_NOT_FOUND",
  );
});

test("rejects changing an existing office's floor plan", async () => {
  const { res, state } = createMockResponse();

  await updateOffice(
    createRequest({ floorPlanId: 2, roomNumber: "B03" }, { id: "1" }),
    res,
  );

  assert.equal(state.statusCode, 400);
  assert.equal(
    (state.body as { error: { code: string } }).error.code,
    "FLOOR_PLAN_CHANGE_NOT_ALLOWED",
  );
});

test("rejects an invalid office ID for deletion", async () => {
  const { res, state } = createMockResponse();

  await deleteOffice(
    createRequest({}, { id: "0" }),
    res,
  );

  assert.equal(state.statusCode, 404);
  assert.equal(
    (state.body as { error: { code: string } }).error.code,
    "OFFICE_NOT_FOUND",
  );
});

test("rejects a route without a valid office ID", async () => {
  const { res, state } = createMockResponse();

  await createRoute(
    createRequest({
      officeId: 0,
      entrancePoint: "Main Entrance",
      svgOverlay: "<svg></svg>",
    }),
    res,
  );

  assert.equal(state.statusCode, 400);
  assert.equal(
    (state.body as { error: { code: string } }).error.code,
    "INVALID_OFFICE_ID",
  );
});

test("rejects a route without an entrance point", async () => {
  const { res, state } = createMockResponse();

  await createRoute(
    createRequest({
      officeId: 1,
      entrancePoint: "   ",
      svgOverlay: "<svg></svg>",
    }),
    res,
  );

  assert.equal(state.statusCode, 400);
  assert.equal(
    (state.body as { error: { code: string } }).error.code,
    "INVALID_ENTRANCE_POINT",
  );
});

test("rejects an empty SVG overlay", async () => {
  const { res, state } = createMockResponse();

  await createRoute(
    createRequest({
      officeId: 1,
      entrancePoint: "Main Entrance",
      svgOverlay: "   ",
    }),
    res,
  );

  assert.equal(state.statusCode, 400);
  assert.equal(
    (state.body as { error: { code: string } }).error.code,
    "INVALID_SVG_OVERLAY",
  );
});

test("rejects an invalid route ID for update", async () => {
  const { res, state } = createMockResponse();

  await updateRoute(
    createRequest({}, { id: "invalid" }),
    res,
  );

  assert.equal(state.statusCode, 404);
  assert.equal(
    (state.body as { error: { code: string } }).error.code,
    "ROUTE_NOT_FOUND",
  );
});

test("rejects an invalid route ID for deletion", async () => {
  const { res, state } = createMockResponse();

  await deleteRoute(
    createRequest({}, { id: "-3" }),
    res,
  );

  assert.equal(state.statusCode, 404);
  assert.equal(
    (state.body as { error: { code: string } }).error.code,
    "ROUTE_NOT_FOUND",
  );
});
