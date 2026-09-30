import { Router } from "express";

import { requireAdmin } from "../middleware/require-admin.ts";
import {
  createFloorPlan,
  createOffice,
  createRoute,
  deleteFloorPlan,
  deleteOffice,
  deleteRoute,
  listFloorPlans,
  listOffices,
  listRoutes,
  updateFloorPlan,
  updateOffice,
  updateRoute,
} from "../controllers/admin-locations.ts";
import {
  addLecturerModule,
  createLecturer,
  listLecturers,
  removeLecturerModule,
  setLecturerActive,
  setLecturerOffice,
  updateLecturer,
  searchLecturers,
  listModules
} from "../controllers/admin-lecturers.ts";

export const adminRouter = Router();

adminRouter.use(requireAdmin);

// Floor-plan management
adminRouter.get("/floor-plans", listFloorPlans);
adminRouter.post("/floor-plans", createFloorPlan);
adminRouter.patch("/floor-plans/:id", updateFloorPlan);
adminRouter.delete("/floor-plans/:id", deleteFloorPlan);

// Lecturer management
adminRouter.get("/lecturers", searchLecturers);
adminRouter.get("/lecturers", listLecturers);

adminRouter.post("/lecturers", createLecturer);
adminRouter.patch("/lecturers/:id", updateLecturer);
adminRouter.patch("/lecturers/:id/active", setLecturerActive);
adminRouter.patch("/lecturers/:id/office", setLecturerOffice);
adminRouter.post("/lecturers/:id/modules", addLecturerModule);
adminRouter.delete("/lecturers/:id/modules/:moduleId", removeLecturerModule);
adminRouter.get("/modules", listModules);
// Office management
adminRouter.get("/offices", listOffices);
adminRouter.post("/offices", createOffice);
adminRouter.patch("/offices/:id", updateOffice);
adminRouter.delete("/offices/:id", deleteOffice);

// Route management
adminRouter.get("/routes", listRoutes);
adminRouter.post("/routes", createRoute);
adminRouter.patch("/routes/:id", updateRoute);
adminRouter.delete("/routes/:id", deleteRoute);