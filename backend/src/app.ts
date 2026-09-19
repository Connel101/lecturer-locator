import express, { type Express, type Request, type Response } from 'express';
import { fileURLToPath } from "node:url";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.ts";
import { lecturerRouter } from "./routes/lecturers.ts";
import { adminRouter } from "./routes/admin.ts";


export const app: Express = express();

// Serve local floor-plan assets through /data/floorplans.
const floorPlansDirectory = fileURLToPath(
  new URL("./data/floorplans/", import.meta.url),
);

app.use(
  "/data/floorplans",
  express.static(floorPlansDirectory),
);

app.all('/api/auth/{*any}', toNodeHandler(auth));
app.use(express.json());
app.use('/api/admin', adminRouter);
app.use('/api/lecturers', lecturerRouter);

export default app