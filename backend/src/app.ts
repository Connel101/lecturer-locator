import express, { type Express, type Request, type Response } from 'express';
import { fileURLToPath } from "node:url";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.ts";
import { lecturerRouter } from "./routes/lecturers.ts";

const app: Express = express();
const PORT = 3000;

// Serve local floor-plan assets through /data/floorplans.
const floorPlansDirectory = fileURLToPath(
  new URL("./data/floorplans/", import.meta.url),
);

app.use(
  "/data/floorplans",
  express.static(floorPlansDirectory),
);

app.all('/api/auth/{*any}', toNodeHandler(auth));
app.use('/api/lecturers', lecturerRouter);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
