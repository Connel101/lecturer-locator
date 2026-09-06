import { and, asc, eq, ilike } from "drizzle-orm";
import type { Request, Response } from "express";

import { floorPlans, lecturers, offices } from "../db/schema.ts";
import { db } from "../lib/db.ts";

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
