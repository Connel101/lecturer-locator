import { Router } from "express";

import { searchLecturers } from "../controllers/lecturers.ts";

export const lecturerRouter = Router();

lecturerRouter.get("/", searchLecturers);
