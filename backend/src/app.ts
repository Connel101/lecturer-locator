import express, { type Express, type Request, type Response } from 'express';
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.ts";
import { lecturerRouter } from "./routes/lecturers.ts";
import { adminRouter } from "./routes/admin.ts";

export const app: Express = express();

app.all('/api/auth/{*any}', toNodeHandler(auth));
app.use('/api/admin', adminRouter);
app.use('/api/lecturers', lecturerRouter);

