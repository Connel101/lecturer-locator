import { and, asc, eq, ilike } from "drizzle-orm";
import type { Request, Response } from "express";

import {
  floorPlans,
  lecturerOfficeHours,
  lecturerModules,
  lecturers,
  modules,
  offices,
  routes,
} from "../db/schema.ts";
import { db } from "../lib/db.ts";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sendLecturerNotFound(res: Response): void {
  res.status(404).json({
    error: {
      code: "LECTURER_NOT_FOUND",
      message: "Lecturer profile is unavailable.",
    },
  });
}

export async function searchLecturers(
  req: Request,
  res: Response,
): Promise<void> {
  const search = req.query.search;

  if (search !== undefined && typeof search !== "string") {
    res.status(400).json({
      error: {
        code: "INVALID_SEARCH",
        message: "The search parameter must be a single text value.",
      },
    });
    return;
  }

  const searchTerm = search?.trim();
  const publicLecturerFilter = searchTerm
    ? and(
        eq(lecturers.active, true),
        ilike(lecturers.fullName, `%${searchTerm}%`),
      )
    : eq(lecturers.active, true);

  try {
    const rows = await db
      .select({
        id: lecturers.id,
        fullName: lecturers.fullName,
        title: lecturers.title,
        department: lecturers.department,
        buildingName: floorPlans.buildingName,
        floorLevel: floorPlans.floorLevel,
        roomNumber: offices.roomNumber,
      })
      .from(lecturers)
      .leftJoin(offices, eq(lecturers.officeId, offices.id))
      .leftJoin(floorPlans, eq(offices.floorPlanId, floorPlans.id))
      .where(publicLecturerFilter)
      .orderBy(asc(lecturers.fullName));

    const results = rows.map((row) => ({
      id: row.id,
      fullName: row.fullName,
      title: row.title,
      department: row.department,
      office:
        row.roomNumber === null
          ? null
          : {
              buildingName: row.buildingName,
              floorLevel: row.floorLevel,
              roomNumber: row.roomNumber,
            },
    }));

    res.status(200).json({ lecturers: results });
  } catch (error) {
    console.error("Failed to search lecturers:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "The requested information could not be loaded.",
      },
    });
  }
}

export async function getLecturerProfile(
  req: Request,
  res: Response,
): Promise<void> {
  const lecturerId = req.params.id;

  if (typeof lecturerId !== "string" || !UUID_PATTERN.test(lecturerId)) {
    sendLecturerNotFound(res);
    return;
  }

  try {
    const [profile] = await db
      .select({
        id: lecturers.id,
        fullName: lecturers.fullName,
        title: lecturers.title,
        department: lecturers.department,
        email: lecturers.email,
        officePhone: lecturers.officePhone,
        researchArea: lecturers.researchArea,
        buildingName: floorPlans.buildingName,
        floorLevel: floorPlans.floorLevel,
        floorPlanFileRef: floorPlans.fileRef,
        roomNumber: offices.roomNumber,
        routeId: routes.id,
        entrancePoint: routes.entrancePoint,
        svgOverlay: routes.svgOverlay,
      })
      .from(lecturers)
      .leftJoin(offices, eq(lecturers.officeId, offices.id))
      .leftJoin(floorPlans, eq(offices.floorPlanId, floorPlans.id))
      .leftJoin(routes, eq(offices.id, routes.officeId))
      .where(and(eq(lecturers.id, lecturerId), eq(lecturers.active, true)))
      .orderBy(asc(routes.id))
      .limit(1);

    if (!profile) {
      sendLecturerNotFound(res);
      return;
    }

    const [lecturerModuleRows, officeHourRows] = await Promise.all([
      db
        .select({
          id: modules.id,
          code: modules.code,
          name: modules.name,
        })
        .from(lecturerModules)
        .innerJoin(modules, eq(lecturerModules.moduleId, modules.id))
        .where(eq(lecturerModules.lecturerId, lecturerId))
        .orderBy(asc(modules.code)),
      db
        .select({
          dayOfWeek: lecturerOfficeHours.dayOfWeek,
          startTime: lecturerOfficeHours.startTime,
          endTime: lecturerOfficeHours.endTime,
        })
        .from(lecturerOfficeHours)
        .where(eq(lecturerOfficeHours.lecturerId, lecturerId))
        .orderBy(
          asc(lecturerOfficeHours.dayOfWeek),
          asc(lecturerOfficeHours.startTime),
        ),
    ]);

    res.status(200).json({
      id: profile.id,
      fullName: profile.fullName,
      title: profile.title,
      department: profile.department,
      ...(profile.email !== null && { email: profile.email }),
      ...(profile.officePhone !== null && {
        officePhone: profile.officePhone,
      }),
      modules: lecturerModuleRows.map((module) => ({
        id: module.id,
        code: module.code,
        ...(module.name !== null && { name: module.name }),
      })),
      ...(profile.researchArea !== null && {
        researchArea: profile.researchArea,
      }),
      officeHours: officeHourRows.map((officeHour) => ({
        dayOfWeek: officeHour.dayOfWeek,
        startTime: officeHour.startTime.slice(0, 5),
        endTime: officeHour.endTime.slice(0, 5),
      })),
      office:
        profile.roomNumber === null
          ? null
          : {
              buildingName: profile.buildingName,
              floorLevel: profile.floorLevel,
              roomNumber: profile.roomNumber,
            },
      route:
        profile.routeId === null ||
        profile.buildingName === null ||
        profile.floorLevel === null ||
        profile.floorPlanFileRef === null ||
        profile.entrancePoint === null ||
        profile.svgOverlay === null
          ? null
          : {
              floorPlan: {
                buildingName: profile.buildingName,
                floorLevel: profile.floorLevel,
                fileRef: profile.floorPlanFileRef,
              },
              entrancePoint: profile.entrancePoint,
              svgOverlay: profile.svgOverlay,
            },
    });
  } catch (error) {
    console.error("Failed to load lecturer profile:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "The requested information could not be loaded.",
      },
    });
  }
}
