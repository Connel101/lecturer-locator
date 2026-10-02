import { Router } from "express";

import {
  getLecturerProfile,
  searchLecturers,
} from "../controllers/lecturers.ts";

export const lecturerRouter = Router();


lecturerRouter.get("/:id", getLecturerProfile);
lecturerRouter.get("/", searchLecturers);