import { eq } from "drizzle-orm";
import type { Request, Response } from "express";

import { floorPlans, offices, routes } from "../db/schema.ts";
import { db } from "../lib/db.ts";

/**
 * Converts a route parameter into a valid positive integer ID.
 * Returns null when the supplied value is missing, repeated, or invalid.
 */
function parseId(value: string | string[] | undefined): number | null {
  if (typeof value !== "string") {
    return null;
  }

  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

/**
 * Sends the standard response used when a floor-plan record cannot be found.
 */
function sendFloorPlanNotFound(res: Response): void {
  res.status(404).json({
    error: {
      code: "FLOOR_PLAN_NOT_FOUND",
      message: "Floor plan could not be found.",
    },
  });
}

/**
 * GET /api/admin/floor-plans
 * Lists all configured floor plans.
 */
export async function listFloorPlans(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const rows = await db
      .select({
        id: floorPlans.id,
        buildingName: floorPlans.buildingName,
        floorLevel: floorPlans.floorLevel,
        fileRef: floorPlans.fileRef,
        createdAt: floorPlans.createdAt,
        updatedAt: floorPlans.updatedAt,
      })
      .from(floorPlans)
      .orderBy(floorPlans.buildingName, floorPlans.floorLevel);

    res.status(200).json({ floorPlans: rows });
  } catch (error) {
    console.error("Failed to list floor plans:", error);

    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Floor plans could not be loaded.",
      },
    });
  }
}

/**
 * POST /api/admin/floor-plans
 * Creates a new floor-plan record.
 */
export async function createFloorPlan(
  req: Request,
  res: Response,
): Promise<void> {
  const { buildingName, floorLevel, fileRef } = req.body ?? {};

  if (typeof buildingName !== "string" || buildingName.trim() === "") {
    res.status(400).json({
      error: {
        code: "INVALID_BUILDING_NAME",
        message: "buildingName is required.",
      },
    });
    return;
  }

  if (!Number.isInteger(floorLevel)) {
    res.status(400).json({
      error: {
        code: "INVALID_FLOOR_LEVEL",
        message: "floorLevel must be a whole number.",
      },
    });
    return;
  }

  if (typeof fileRef !== "string" || fileRef.trim() === "") {
    res.status(400).json({
      error: {
        code: "INVALID_FILE_REF",
        message: "fileRef is required.",
      },
    });
    return;
  }

  try {
    const [created] = await db
      .insert(floorPlans)
      .values({
        buildingName: buildingName.trim(),
        floorLevel,
        fileRef: fileRef.trim(),
      })
      .returning();

    res.status(201).json(created);
  } catch (error) {
    console.error("Failed to create floor plan:", error);

    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "The floor plan could not be created.",
      },
    });
  }
}

/**
 * PATCH /api/admin/floor-plans/:id
 * Updates an existing floor-plan record.
 */
export async function updateFloorPlan(
  req: Request,
  res: Response,
): Promise<void> {
  const floorPlanId = parseId(req.params.id);

  if (floorPlanId === null) {
    sendFloorPlanNotFound(res);
    return;
  }

  const { buildingName, floorLevel, fileRef } = req.body ?? {};
  const updates: Record<string, unknown> = {};

  if (buildingName !== undefined) {
    if (typeof buildingName !== "string" || buildingName.trim() === "") {
      res.status(400).json({
        error: {
          code: "INVALID_BUILDING_NAME",
          message: "buildingName must be a non-empty string.",
        },
      });
      return;
    }

    updates.buildingName = buildingName.trim();
  }

  if (floorLevel !== undefined) {
    if (!Number.isInteger(floorLevel)) {
      res.status(400).json({
        error: {
          code: "INVALID_FLOOR_LEVEL",
          message: "floorLevel must be a whole number.",
        },
      });
      return;
    }

    updates.floorLevel = floorLevel;
  }

  if (fileRef !== undefined) {
    if (typeof fileRef !== "string" || fileRef.trim() === "") {
      res.status(400).json({
        error: {
          code: "INVALID_FILE_REF",
          message: "fileRef must be a non-empty string.",
        },
      });
      return;
    }

    updates.fileRef = fileRef.trim();
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({
      error: {
        code: "NO_UPDATES_PROVIDED",
        message: "At least one field must be provided to update.",
      },
    });
    return;
  }

  updates.updatedAt = new Date();

  try {
    const [updated] = await db
      .update(floorPlans)
      .set(updates)
      .where(eq(floorPlans.id, floorPlanId))
      .returning();

    if (!updated) {
      sendFloorPlanNotFound(res);
      return;
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("Failed to update floor plan:", error);

    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "The floor plan could not be updated.",
      },
    });
  }
}

/**
 * Deletes a floor plan when no offices are assigned to it.
 */
export async function deleteFloorPlan(req: Request, res: Response) {
  const id = parseId(req.params.id);

  if (id === null) {
    return res.status(400).json({
      error: {
        code: "INVALID_FLOOR_PLAN_ID",
        message: "Floor plan ID must be a positive integer.",
      },
    });
  }

  try {
    const assignedOffice = await db
      .select({ id: offices.id })
      .from(offices)
      .where(eq(offices.floorPlanId, id))
      .limit(1);

    if (assignedOffice.length > 0) {
      return res.status(409).json({
        error: {
          code: "FLOOR_PLAN_IN_USE",
          message: "The floor plan cannot be deleted while offices are assigned to it.",
        },
      });
    }

    const [deletedFloorPlan] = await db
      .delete(floorPlans)
      .where(eq(floorPlans.id, id))
      .returning({ id: floorPlans.id });

    if (!deletedFloorPlan) {
      return sendFloorPlanNotFound(res);
    }

    return res.status(204).send();
  } catch (error) {
    console.error("Failed to delete floor plan:", error);

    return res.status(500).json({
      error: {
        code: "FLOOR_PLAN_DELETE_FAILED",
        message: "Failed to delete floor plan.",
      },
    });
  }
}

/**
 * Sends the standard response used when an office record cannot be found.
 */
function sendOfficeNotFound(res: Response): void {
  res.status(404).json({
    error: {
      code: "OFFICE_NOT_FOUND",
      message: "Office could not be found.",
    },
  });
}

/**
 * GET /api/admin/offices
 * Lists all offices together with their assigned floor-plan details.
 */
export async function listOffices(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const rows = await db
      .select({
        id: offices.id,
        roomNumber: offices.roomNumber,
        floorPlanId: offices.floorPlanId,
        buildingName: floorPlans.buildingName,
        floorLevel: floorPlans.floorLevel,
        createdAt: offices.createdAt,
        updatedAt: offices.updatedAt,
      })
      .from(offices)
      .innerJoin(floorPlans, eq(offices.floorPlanId, floorPlans.id))
      .orderBy(
        floorPlans.buildingName,
        floorPlans.floorLevel,
        offices.roomNumber,
      );

    res.status(200).json({ offices: rows });
  } catch (error) {
    console.error("Failed to list offices:", error);

    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Offices could not be loaded.",
      },
    });
  }
}

/**
 * POST /api/admin/offices
 * Creates an office and assigns it to an existing floor plan.
 */
export async function createOffice(
  req: Request,
  res: Response,
): Promise<void> {
  const { floorPlanId, roomNumber } = req.body ?? {};

  if (!Number.isInteger(floorPlanId) || floorPlanId <= 0) {
    res.status(400).json({
      error: {
        code: "INVALID_FLOOR_PLAN_ID",
        message: "floorPlanId must be a positive whole number.",
      },
    });
    return;
  }

  if (typeof roomNumber !== "string" || roomNumber.trim() === "") {
    res.status(400).json({
      error: {
        code: "INVALID_ROOM_NUMBER",
        message: "roomNumber is required.",
      },
    });
    return;
  }

  try {
    // An office cannot be created against a floor plan that does not exist.
    const [floorPlan] = await db
      .select({ id: floorPlans.id })
      .from(floorPlans)
      .where(eq(floorPlans.id, floorPlanId))
      .limit(1);

    if (!floorPlan) {
      res.status(404).json({
        error: {
          code: "FLOOR_PLAN_NOT_FOUND",
          message: "No floor plan exists with that id.",
        },
      });
      return;
    }

    const [created] = await db
      .insert(offices)
      .values({
        floorPlanId,
        roomNumber: roomNumber.trim(),
      })
      .returning();

    res.status(201).json(created);
  } catch (error) {
    console.error("Failed to create office:", error);

    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "The office could not be created.",
      },
    });
  }
}

/**
 * PATCH /api/admin/offices/:id
 * Updates an office's room number or floor-plan assignment.
 */
export async function updateOffice(
  req: Request,
  res: Response,
): Promise<void> {
  const officeId = parseId(req.params.id);

  if (officeId === null) {
    sendOfficeNotFound(res);
    return;
  }

  const { floorPlanId, roomNumber } = req.body ?? {};
  const updates: Record<string, unknown> = {};

  if (floorPlanId !== undefined) {
    if (!Number.isInteger(floorPlanId) || floorPlanId <= 0) {
      res.status(400).json({
        error: {
          code: "INVALID_FLOOR_PLAN_ID",
          message: "floorPlanId must be a positive whole number.",
        },
      });
      return;
    }

    try {
      // Validate the new floor-plan assignment before updating the office.
      const [floorPlan] = await db
        .select({ id: floorPlans.id })
        .from(floorPlans)
        .where(eq(floorPlans.id, floorPlanId))
        .limit(1);

      if (!floorPlan) {
        res.status(404).json({
          error: {
            code: "FLOOR_PLAN_NOT_FOUND",
            message: "No floor plan exists with that id.",
          },
        });
        return;
      }
    } catch (error) {
      console.error("Failed to validate floor plan:", error);

      res.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          message: "The floor-plan assignment could not be validated.",
        },
      });
      return;
    }

    updates.floorPlanId = floorPlanId;
  }

  if (roomNumber !== undefined) {
    if (typeof roomNumber !== "string" || roomNumber.trim() === "") {
      res.status(400).json({
        error: {
          code: "INVALID_ROOM_NUMBER",
          message: "roomNumber must be a non-empty string.",
        },
      });
      return;
    }

    updates.roomNumber = roomNumber.trim();
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({
      error: {
        code: "NO_UPDATES_PROVIDED",
        message: "At least one field must be provided to update.",
      },
    });
    return;
  }

  updates.updatedAt = new Date();

  try {
    const [updated] = await db
      .update(offices)
      .set(updates)
      .where(eq(offices.id, officeId))
      .returning();

    if (!updated) {
      sendOfficeNotFound(res);
      return;
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("Failed to update office:", error);

    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "The office could not be updated.",
      },
    });
  }
}

/**
 * DELETE /api/admin/offices/:id
 * Removes an office.
 *
 * Database constraints automatically unassign lecturers from the deleted
 * office and remove route records belonging to it.
 */
export async function deleteOffice(
  req: Request,
  res: Response,
): Promise<void> {
  const officeId = parseId(req.params.id);

  if (officeId === null) {
    sendOfficeNotFound(res);
    return;
  }

  try {
    const [deleted] = await db
      .delete(offices)
      .where(eq(offices.id, officeId))
      .returning({ id: offices.id });

    if (!deleted) {
      sendOfficeNotFound(res);
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete office:", error);

    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "The office could not be deleted.",
      },
    });
  }
}

/**
 * Sends the standard response used when a route record cannot be found.
 */
function sendRouteNotFound(res: Response): void {
  res.status(404).json({
    error: {
      code: "ROUTE_NOT_FOUND",
      message: "Route could not be found.",
    },
  });
}

/**
 * GET /api/admin/routes
 * Lists all configured routes together with their office and floor-plan details.
 */
export async function listRoutes(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const rows = await db
      .select({
        id: routes.id,
        officeId: routes.officeId,
        entrancePoint: routes.entrancePoint,
        svgOverlay: routes.svgOverlay,
        roomNumber: offices.roomNumber,
        floorPlanId: offices.floorPlanId,
        buildingName: floorPlans.buildingName,
        floorLevel: floorPlans.floorLevel,
        createdAt: routes.createdAt,
        updatedAt: routes.updatedAt,
      })
      .from(routes)
      .innerJoin(offices, eq(routes.officeId, offices.id))
      .innerJoin(floorPlans, eq(offices.floorPlanId, floorPlans.id))
      .orderBy(
        floorPlans.buildingName,
        floorPlans.floorLevel,
        offices.roomNumber,
      );

    res.status(200).json({ routes: rows });
  } catch (error) {
    console.error("Failed to list routes:", error);

    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Routes could not be loaded.",
      },
    });
  }
}

/**
 * POST /api/admin/routes
 * Creates one route for an existing office.
 *
 * The MVP supports a single route per office. A second route for the same
 * office is rejected rather than silently replacing the existing route.
 */
export async function createRoute(
  req: Request,
  res: Response,
): Promise<void> {
  const { officeId, entrancePoint, svgOverlay } = req.body ?? {};

  if (!Number.isInteger(officeId) || officeId <= 0) {
    res.status(400).json({
      error: {
        code: "INVALID_OFFICE_ID",
        message: "officeId must be a positive whole number.",
      },
    });
    return;
  }

  if (typeof entrancePoint !== "string" || entrancePoint.trim() === "") {
    res.status(400).json({
      error: {
        code: "INVALID_ENTRANCE_POINT",
        message: "entrancePoint is required.",
      },
    });
    return;
  }

  if (
    svgOverlay !== undefined &&
    svgOverlay !== null &&
    (typeof svgOverlay !== "string" || svgOverlay.trim() === "")
  ) {
    res.status(400).json({
      error: {
        code: "INVALID_SVG_OVERLAY",
        message: "svgOverlay must be a non-empty string or null.",
      },
    });
    return;
  }

  try {
    // A route must belong to an office that already exists.
    const [office] = await db
      .select({ id: offices.id })
      .from(offices)
      .where(eq(offices.id, officeId))
      .limit(1);

    if (!office) {
      res.status(404).json({
        error: {
          code: "OFFICE_NOT_FOUND",
          message: "No office exists with that id.",
        },
      });
      return;
    }

    // The MVP permits only one route record for each office.
    const [existingRoute] = await db
      .select({ id: routes.id })
      .from(routes)
      .where(eq(routes.officeId, officeId))
      .limit(1);

    if (existingRoute) {
      res.status(409).json({
        error: {
          code: "ROUTE_ALREADY_EXISTS",
          message: "A route already exists for this office.",
        },
      });
      return;
    }

    const [created] = await db
      .insert(routes)
      .values({
        officeId,
        entrancePoint: entrancePoint.trim(),
        // Preserve the exported SVG exactly as supplied, including metadata.
        svgOverlay: svgOverlay ?? null,
      })
      .returning();

    res.status(201).json(created);
  } catch (error) {
    console.error("Failed to create route:", error);

    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "The route could not be created.",
      },
    });
  }
}

/**
 * PATCH /api/admin/routes/:id
 * Updates a route's office, designated entrance, or SVG overlay.
 */
export async function updateRoute(
  req: Request,
  res: Response,
): Promise<void> {
  const routeId = parseId(req.params.id);

  if (routeId === null) {
    sendRouteNotFound(res);
    return;
  }

  const { officeId, entrancePoint, svgOverlay } = req.body ?? {};
  const updates: Record<string, unknown> = {};

  if (officeId !== undefined) {
    if (!Number.isInteger(officeId) || officeId <= 0) {
      res.status(400).json({
        error: {
          code: "INVALID_OFFICE_ID",
          message: "officeId must be a positive whole number.",
        },
      });
      return;
    }
  }

  if (entrancePoint !== undefined) {
    if (
      typeof entrancePoint !== "string" ||
      entrancePoint.trim() === ""
    ) {
      res.status(400).json({
        error: {
          code: "INVALID_ENTRANCE_POINT",
          message: "entrancePoint must be a non-empty string.",
        },
      });
      return;
    }

    updates.entrancePoint = entrancePoint.trim();
  }

  if (svgOverlay !== undefined) {
    if (
      svgOverlay !== null &&
      (typeof svgOverlay !== "string" || svgOverlay.trim() === "")
    ) {
      res.status(400).json({
        error: {
          code: "INVALID_SVG_OVERLAY",
          message: "svgOverlay must be a non-empty string or null.",
        },
      });
      return;
    }

    // Keep the complete exported SVG unchanged so editor metadata survives.
    updates.svgOverlay = svgOverlay;
  }

  if (
    officeId === undefined &&
    entrancePoint === undefined &&
    svgOverlay === undefined
  ) {
    res.status(400).json({
      error: {
        code: "NO_UPDATES_PROVIDED",
        message: "At least one field must be provided to update.",
      },
    });
    return;
  }

  try {
    // Confirm the route exists before validating any changed associations.
    const [currentRoute] = await db
      .select({
        id: routes.id,
        officeId: routes.officeId,
      })
      .from(routes)
      .where(eq(routes.id, routeId))
      .limit(1);

    if (!currentRoute) {
      sendRouteNotFound(res);
      return;
    }

    if (officeId !== undefined) {
      const [office] = await db
        .select({ id: offices.id })
        .from(offices)
        .where(eq(offices.id, officeId))
        .limit(1);

      if (!office) {
        res.status(404).json({
          error: {
            code: "OFFICE_NOT_FOUND",
            message: "No office exists with that id.",
          },
        });
        return;
      }

      // Moving a route must not give an office a second route.
      const [routeForOffice] = await db
        .select({ id: routes.id })
        .from(routes)
        .where(eq(routes.officeId, officeId))
        .limit(1);

      if (routeForOffice && routeForOffice.id !== routeId) {
        res.status(409).json({
          error: {
            code: "ROUTE_ALREADY_EXISTS",
            message: "A route already exists for this office.",
          },
        });
        return;
      }

      updates.officeId = officeId;
    }

    updates.updatedAt = new Date();

    const [updated] = await db
      .update(routes)
      .set(updates)
      .where(eq(routes.id, routeId))
      .returning();

    res.status(200).json(updated);
  } catch (error) {
    console.error("Failed to update route:", error);

    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "The route could not be updated.",
      },
    });
  }
}

/**
 * DELETE /api/admin/routes/:id
 * Removes a route without deleting its associated office.
 */
export async function deleteRoute(
  req: Request,
  res: Response,
): Promise<void> {
  const routeId = parseId(req.params.id);

  if (routeId === null) {
    sendRouteNotFound(res);
    return;
  }

  try {
    const [deleted] = await db
      .delete(routes)
      .where(eq(routes.id, routeId))
      .returning({ id: routes.id });

    if (!deleted) {
      sendRouteNotFound(res);
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete route:", error);

    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "The route could not be deleted.",
      },
    });
  }
}