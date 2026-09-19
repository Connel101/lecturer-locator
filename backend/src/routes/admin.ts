import { Router } from "express";

import { requireAdmin } from "../middleware/require-admin.ts";
import {
  addLecturerModule,
  createLecturer,
  listLecturers,
  removeLecturerModule,
  setLecturerActive,
  setLecturerOffice,
  updateLecturer,
} from "../controllers/admin-lecturers.ts";

export const adminRouter = Router();

adminRouter.use(requireAdmin);

adminRouter.get("/lecturers", listLecturers);
adminRouter.post("/lecturers", createLecturer);
adminRouter.patch("/lecturers/:id", updateLecturer);
adminRouter.patch("/lecturers/:id/active", setLecturerActive);
adminRouter.patch("/lecturers/:id/office", setLecturerOffice);
adminRouter.post("/lecturers/:id/modules", addLecturerModule);
adminRouter.delete("/lecturers/:id/modules/:moduleId", removeLecturerModule);