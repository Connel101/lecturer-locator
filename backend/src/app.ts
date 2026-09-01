import express, { type Express, type Request, type Response } from 'express';
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.ts";

const app: Express = express();
const PORT = 3000;

app.all('/api/auth/{*any}', toNodeHandler(auth));

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});