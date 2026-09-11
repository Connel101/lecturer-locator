import { Router } from "express";

import { requireAdmin } from "../middleware/require-admin.ts";

export const adminRouter = Router();

adminRouter.use(requireAdmin);
