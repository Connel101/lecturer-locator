import { Router } from "express";

import {
  getLecturerProfile,
  searchLecturers,
} from "../controllers/lecturers.ts";

export const lecturerRouter = Router();

lecturerRouter.get("/", searchLecturers);
lecturerRouter.get("/:id", getLecturerProfile);
