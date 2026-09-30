import express, { Router } from "express";
import { loadSvg, saveSvg, type UploadKind } from "../lib/file-storage.ts";
import { isValidSvgUpload } from "../lib/svg-upload.ts";
import { requireAdmin } from "../middleware/require-admin.ts";

export const filesRouter = Router();
const kinds = new Set<UploadKind>(["floor-plans", "routes"]);

filesRouter.post("/:kind", requireAdmin, express.raw({ type: "image/svg+xml", limit: "4mb" }), async (req, res) => {
  const kind = req.params.kind;
  if (typeof kind !== "string" || !kinds.has(kind as UploadKind)) {
    res.status(404).json({ error: { message: "Unknown upload type." } });
    return;
  }
  const bytes = req.body;
  if (!isValidSvgUpload(bytes)) {
    res.status(400).json({ error: { message: "Choose a valid SVG file (up to 4 MB)." } });
    return;
  }
  try {
    const fileRef = await saveSvg(kind as UploadKind, bytes);
    res.status(201).json({ fileRef });
  } catch (error) {
    console.error("File upload failed:", error);
    res.status(500).json({ error: { message: "The file could not be uploaded." } });
  }
});

filesRouter.get("/:kind/:name", async (req, res) => {
  const { kind, name } = req.params;
  if (typeof kind !== "string" || !kinds.has(kind as UploadKind) || typeof name !== "string" || !/^[0-9a-f-]{36}\.svg$/.test(name)) {
    res.sendStatus(404);
    return;
  }
  try {
    const bytes = await loadSvg(kind as UploadKind, name);
    res.set("Content-Type", "image/svg+xml")
      .set("X-Content-Type-Options", "nosniff")
      .set("Content-Security-Policy", "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:")
      .send(bytes);
  } catch (error) {
    console.error("File read failed:", error);
    res.sendStatus(404);
  }
});
