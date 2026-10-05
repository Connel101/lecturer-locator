import assert from "node:assert/strict";
import { readFile, unlink } from "node:fs/promises";
import { mock, test } from "node:test";
import type { Request, Response } from "express";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { uploadLecturerTimetable } from "../src/controllers/admin-lecturers.ts";
import { getLecturerProfile } from "../src/controllers/lecturers.ts";
import { db } from "../src/lib/db.ts";
import { loadFile, saveFile } from "../src/lib/file-storage.ts";
import { isValidTimetableImage } from "../src/lib/timetable-image.ts";

const png = await readFile(new URL("../../frontend/public/icon-192.png", import.meta.url));
const lecturerId = "d7ac9ed3-b706-40bf-9572-cdaa1f018791";

function mockResponse() {
  const state = { status: 200, body: {} as Record<string, unknown> };
  const res = {
    status(code: number) { state.status = code; return res; },
    json(body: Record<string, unknown>) { state.body = body; return res; },
  } as unknown as Response;
  return { res, state };
}

test("timetable images require a supported content type, matching signature and size", () => {
  assert.equal(isValidTimetableImage(png, "image/png"), true);
  assert.equal(isValidTimetableImage(png, "image/jpeg"), false);
  assert.equal(isValidTimetableImage(Buffer.from('<svg onload="alert(1)"></svg>'), "image/png"), false);
  assert.equal(isValidTimetableImage(png, "image/svg+xml"), false);
  assert.equal(isValidTimetableImage(undefined, "image/png"), false);
  assert.equal(isValidTimetableImage(Buffer.alloc(4 * 1024 * 1024 + 1), "image/png"), false);
  assert.equal(isValidTimetableImage(Buffer.from([255, 216, 255, ...Array(20).fill(0)]), "image/jpeg"), true);
  assert.equal(isValidTimetableImage(Buffer.from("RIFF0000WEBP0000"), "image/webp"), true);
});

test("production stores timetables under their own S3 prefix with the image content type", async () => {
  const originalEnv = { ...process.env };
  Object.assign(process.env, {
    NODE_ENV: "production", STORAGE_S3_ENDPOINT: "https://storage.example.com",
    STORAGE_S3_BUCKET: "test-bucket", STORAGE_S3_REGION: "test-region",
    STORAGE_S3_ACCESS_KEY_ID: "test-key", STORAGE_S3_SECRET_ACCESS_KEY: "test-secret",
  });
  const commands: (PutObjectCommand | GetObjectCommand)[] = [];
  const send = mock.method(S3Client.prototype, "send", async (command: PutObjectCommand | GetObjectCommand) => {
    commands.push(command);
    return { Body: { transformToByteArray: async () => png } };
  });
  try {
    const ref = await saveFile("timetables", png, "image/png");
    assert.match(ref, /^\/api\/files\/timetables\/[0-9a-f-]{36}\.png$/);
    assert.equal(commands[0]?.input.Bucket, "test-bucket");
    assert.equal(commands[0]?.input.Key, ref.replace("/api/files/", ""));
    assert.equal((commands[0] as PutObjectCommand).input.ContentType, "image/png");
    assert.deepEqual((commands[0] as PutObjectCommand).input.Body, png);
    assert.deepEqual(await loadFile("timetables", ref.split("/").pop()!), png);
    assert.ok(commands[1] instanceof GetObjectCommand);
  } finally {
    send.mock.restore();
    for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key];
    Object.assign(process.env, originalEnv);
  }
});

test("upload and replacement save local images and references; invalid uploads preserve the timetable", async () => {
  let timetableFileRef: string | null = null;
  let exists = true;
  const savedFiles: string[] = [];
  const select = mock.method(db, "select", () => ({ from: () => ({ where: () => ({ limit: async () => exists ? [{ id: lecturerId }] : [] }) }) }));
  const update = mock.method(db, "update", () => ({ set: (values: { timetableFileRef: string }) => ({ where: () => ({ returning: async () => {
    timetableFileRef = values.timetableFileRef;
    savedFiles.push(timetableFileRef.split("/").pop()!);
    return [{ timetableFileRef }];
  } }) }) }));
  const request = { params: { id: lecturerId }, body: png, get: () => "image/png" } as unknown as Request;
  try {
    for (let i = 0; i < 2; i++) {
      const previous = timetableFileRef;
      const { res, state } = mockResponse();
      await uploadLecturerTimetable(request, res);
      assert.equal(state.status, 200);
      assert.equal(state.body.timetableFileRef, timetableFileRef);
      assert.notEqual(timetableFileRef, previous);
      const name = savedFiles.at(-1)!;
      assert.deepEqual(await loadFile("timetables", name), png);
    }
    const previous = timetableFileRef;
    for (const body of [Buffer.from("not an image"), Buffer.alloc(4 * 1024 * 1024 + 1)]) {
      const { res, state } = mockResponse();
      await uploadLecturerTimetable({ ...request, body } as Request, res);
      assert.equal(state.status, 400);
      assert.equal(timetableFileRef, previous);
    }
    exists = false;
    const { res, state } = mockResponse();
    await uploadLecturerTimetable(request, res);
    assert.equal(state.status, 404);
    assert.equal(timetableFileRef, previous);
  } finally {
    select.mock.restore();
    update.mock.restore();
    await Promise.all(savedFiles.map(name => unlink(new URL(`../data/uploads/timetables/${name}`, import.meta.url))));
  }
});

test("public profiles include the timetable reference only when available", async () => {
  for (const timetableFileRef of [null, "/api/files/timetables/example.png"]) {
    const profile = {
      id: lecturerId, fullName: "Example Lecturer", title: null, department: null,
      email: null, officePhone: null, researchArea: null, timetableFileRef,
      buildingName: null, floorLevel: null, floorPlanFileRef: null, roomNumber: null,
      routeId: null, entrancePoint: null, svgOverlay: null,
    };
    let query = 0;
    const chain = {
      from() { return this; }, leftJoin() { return this; }, innerJoin() { return this; }, where() { return this; },
      orderBy() { return query++ === 0 ? { limit: async () => [profile] } : []; },
    };
    const select = mock.method(db, "select", () => chain);
    const { res, state } = mockResponse();
    try {
      await getLecturerProfile({ params: { id: lecturerId } } as unknown as Request, res);
      assert.equal(state.status, 200);
      assert.equal(state.body.timetableFileRef, timetableFileRef ?? undefined);
      assert.equal(Object.hasOwn(state.body, "timetableFileRef"), timetableFileRef !== null);
    } finally {
      select.mock.restore();
    }
  }
});
