import { Router } from "express";

import { createLecturer, updateLecturer } from "../controllers/lecturers.ts";
import { requireAdmin } from "../middleware/require-admin.ts";

export const adminRouter = Router();

adminRouter.use(requireAdmin);
adminRouter.post("/lecturers", createLecturer);
adminRouter.put("/lecturers/:id", updateLecturer);
