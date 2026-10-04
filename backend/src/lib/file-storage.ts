import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export type UploadKind = "floor-plans" | "routes";
const floorplanDirectory = fileURLToPath(new URL("../data/floorplans/", import.meta.url));
const previousUploadDirectory = fileURLToPath(new URL("../../data/uploads/", import.meta.url));

function localFilename(kind: UploadKind, name: string): string {
  return `${kind === "floor-plans" ? "uploaded-floor-plan" : "uploaded-route"}-${name}`;
}

function storageConfig() {
  if (process.env.NODE_ENV !== "production") return null;
  const { STORAGE_S3_ENDPOINT, STORAGE_S3_BUCKET, STORAGE_S3_REGION, STORAGE_S3_ACCESS_KEY_ID, STORAGE_S3_SECRET_ACCESS_KEY } = process.env;
  if (!STORAGE_S3_ENDPOINT || !STORAGE_S3_BUCKET || !STORAGE_S3_REGION || !STORAGE_S3_ACCESS_KEY_ID || !STORAGE_S3_SECRET_ACCESS_KEY) {
    throw new Error("Production file storage is not configured.");
  }
  return {
    bucket: STORAGE_S3_BUCKET,
    client: new S3Client({
      endpoint: STORAGE_S3_ENDPOINT,
      region: STORAGE_S3_REGION,
      forcePathStyle: true,
      credentials: { accessKeyId: STORAGE_S3_ACCESS_KEY_ID, secretAccessKey: STORAGE_S3_SECRET_ACCESS_KEY },
    }),
  };
}

export async function saveSvg(kind: UploadKind, bytes: Buffer): Promise<string> {
  const name = `${randomUUID()}.svg`;
  const key = `${kind}/${name}`;
  const config = storageConfig();
  if (config) {
    await config.client.send(new PutObjectCommand({ Bucket: config.bucket, Key: key, Body: bytes, ContentType: "image/svg+xml" }));
  } else {
    await writeFile(join(floorplanDirectory, localFilename(kind, name)), bytes, { flag: "wx" });
  }
  return `/api/files/${key}`;
}

export async function loadSvg(kind: UploadKind, name: string): Promise<Buffer> {
  const key = `${kind}/${name}`;
  const config = storageConfig();
  if (config) {
    const result = await config.client.send(new GetObjectCommand({ Bucket: config.bucket, Key: key }));
    if (!result.Body) throw new Error("Stored file has no body.");
    return Buffer.from(await result.Body.transformToByteArray());
  }
  try {
    return await readFile(join(floorplanDirectory, localFilename(kind, name)));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    // Keep links to files uploaded before the local storage folder changed working.
    return readFile(join(previousUploadDirectory, key));
  }
}
