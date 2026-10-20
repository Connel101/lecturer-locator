import assert from "node:assert/strict";
import { readFile, unlink } from "node:fs/promises";
import { mock, test } from "node:test";
import type { Request, Response } from "express";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { uploadLecturerPhoto } from "../src/controllers/admin-lecturers.ts";
import { getLecturerProfile } from "../src/controllers/lecturers.ts";
import { db } from "../src/lib/db.ts";
import { loadFile, saveFile } from "../src/lib/file-storage.ts";

const png = await readFile(new URL("../../frontend/public/icon-192.png", import.meta.url));
const lecturerId = "d7ac9ed3-b706-40bf-9572-cdaa1f018791";

test("photo upload saves a local image and exposes its URL on the public profile", async () => {
  let photoUrl: string | null = null;
  const select = mock.method(db, "select", () => ({ from: () => ({ where: () => ({ limit: async () => [{ id: lecturerId }] }) }) }));
  const update = mock.method(db, "update", () => ({ set: (values: { photoUrl: string }) => ({ where: () => ({ returning: async () => {
    photoUrl = values.photoUrl;
    return [{ photoUrl }];
  } }) }) }));
  const request = { params: { id: lecturerId }, body: png, get: () => "image/png" } as unknown as Request;
  let status = 200;
  let body: Record<string, unknown> = {};
  const res = { status(code: number) { status = code; return res; }, json(value: Record<string, unknown>) { body = value; return res; } } as unknown as Response;
  try {
    await uploadLecturerPhoto(request, res);
    assert.equal(status, 200);
    assert.match(photoUrl!, /^\/api\/files\/profile-photos\/[0-9a-f-]{36}\.png$/);
    assert.equal(body.photoUrl, photoUrl);
    assert.deepEqual(await loadFile("profile-photos", photoUrl!.split("/").pop()!), png);

    await uploadLecturerPhoto({ ...request, body: Buffer.from("invalid") } as Request, res);
    assert.equal(status, 400);
    assert.equal(body.photoUrl, undefined);

    select.mock.restore();
    const profile = {
      id: lecturerId, fullName: "Example Lecturer", title: null, department: null,
      email: null, officePhone: null, researchArea: null, timetableFileRef: null, photoUrl,
      buildingName: null, floorLevel: null, floorPlanFileRef: null, roomNumber: null,
      routeId: null, entrancePoint: null, svgOverlay: null,
    };
    let query = 0;
    const chain = {
      from() { return this; }, leftJoin() { return this; }, innerJoin() { return this; }, where() { return this; },
      orderBy() { return query++ === 0 ? { limit: async () => [profile] } : []; },
    };
    const profileSelect = mock.method(db, "select", () => chain);
    try {
      await getLecturerProfile({ params: { id: lecturerId } } as unknown as Request, res);
      assert.equal(body.photoUrl, photoUrl);
    } finally {
      profileSelect.mock.restore();
    }
  } finally {
    select.mock.restore();
    update.mock.restore();
    const savedRef = photoUrl as string | null;
    if (savedRef) await unlink(new URL(`../data/uploads/profile-photos/${savedRef.split("/").pop()}`, import.meta.url));
  }
});

test("production saves profile photos under the S3 prefix", async () => {
  const originalEnv = { ...process.env };
  Object.assign(process.env, {
    NODE_ENV: "production", STORAGE_S3_ENDPOINT: "https://storage.example.com",
    STORAGE_S3_BUCKET: "test-bucket", STORAGE_S3_REGION: "test-region",
    STORAGE_S3_ACCESS_KEY_ID: "test-key", STORAGE_S3_SECRET_ACCESS_KEY: "test-secret",
  });
  const send = mock.method(S3Client.prototype, "send", async (command: PutObjectCommand) => {
    assert.equal(command.input.Bucket, "test-bucket");
    assert.match(command.input.Key!, /^profile-photos\/[0-9a-f-]{36}\.png$/);
    assert.equal(command.input.ContentType, "image/png");
    assert.deepEqual(command.input.Body, png);
    return {};
  });
  try {
    const ref = await saveFile("profile-photos", png, "image/png");
    assert.match(ref, /^\/api\/files\/profile-photos\/[0-9a-f-]{36}\.png$/);
  } finally {
    send.mock.restore();
    for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key];
    Object.assign(process.env, originalEnv);
  }
});
