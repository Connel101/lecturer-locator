import { and, eq } from "drizzle-orm";
import type { Request, Response } from "express";

import {
  lecturerModules,
  lecturers,
  modules,
  offices,
} from "../db/schema.ts";
import { db } from "../lib/db.ts";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sendLecturerNotFound(res: Response): void {
  res.status(404).json({
    error: {
      code: "LECTURER_NOT_FOUND",
      message: "Lecturer could not be found.",
    },
  });
}

function isValidId(id: unknown): id is string {
  return typeof id === "string" && UUID_PATTERN.test(id);
}

/**
 * GET /api/admin/lecturers
 * Lists every lecturer, including inactive ones.
 */
export async function listLecturers(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const rows = await db
      .select({
        id: lecturers.id,
        fullName: lecturers.fullName,
        title: lecturers.title,
        department: lecturers.department,
        researchArea: lecturers.researchArea,
        active: lecturers.active,
        officeId: lecturers.officeId,
      })
      .from(lecturers)
      .orderBy(lecturers.fullName);

    res.status(200).json({ lecturers: rows });
  } catch (error) {
    console.error("Failed to list lecturers:", error);
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Lecturers could not be loaded." },
    });
  }
}

/**
 * POST /api/admin/lecturers
 * Creates a new lecturer.
 */
export async function createLecturer(
  req: Request,
  res: Response,
): Promise<void> {
  const { fullName, title, department, researchArea } = req.body ?? {};

  if (typeof fullName !== "string" || fullName.trim() === "") {
    res.status(400).json({
      error: { code: "INVALID_FULL_NAME", message: "fullName is required." },
    });
    return;
  }

  try {
    const [created] = await db
      .insert(lecturers)
      .values({
        fullName: fullName.trim(),
        title: typeof title === "string" ? title : null,
        department: typeof department === "string" ? department : null,
        researchArea: typeof researchArea === "string" ? researchArea : null,
      })
      .returning();

    res.status(201).json(created);
  } catch (error) {
    console.error("Failed to create lecturer:", error);
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "The lecturer could not be created." },
    });
  }
}

/**
 * PATCH /api/admin/lecturers/:id
 * Updates a lecturer's details (not office or active status — those have
 * their own endpoints below).
 */
export async function updateLecturer(
  req: Request,
  res: Response,
): Promise<void> {
  const lecturerId = req.params.id;

  if (!isValidId(lecturerId)) {
    sendLecturerNotFound(res);
    return;
  }

  const { fullName, title, department, researchArea } = req.body ?? {};

  const updates: Record<string, unknown> = {};

  if (fullName !== undefined) {
    if (typeof fullName !== "string" || fullName.trim() === "") {
      res.status(400).json({
        error: { code: "INVALID_FULL_NAME", message: "fullName must be a non-empty string." },
      });
      return;
    }
    updates.fullName = fullName.trim();
  }

  if (title !== undefined) updates.title = title === null ? null : String(title);
  if (department !== undefined) updates.department = department === null ? null : String(department);
  if (researchArea !== undefined) updates.researchArea = researchArea === null ? null : String(researchArea);

  if (Object.keys(updates).length === 0) {
    res.status(400).json({
      error: { code: "NO_UPDATES_PROVIDED", message: "At least one field must be provided to update." },
    });
    return;
  }

  updates.updatedAt = new Date();

  try {
    const [updated] = await db
      .update(lecturers)
      .set(updates)
      .where(eq(lecturers.id, lecturerId))
      .returning();

    if (!updated) {
      sendLecturerNotFound(res);
      return;
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("Failed to update lecturer:", error);
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "The lecturer could not be updated." },
    });
  }
}

/**
 * PATCH /api/admin/lecturers/:id/active
 * Activates or deactivates a lecturer.
 */
export async function setLecturerActive(
  req: Request,
  res: Response,
): Promise<void> {
  const lecturerId = req.params.id;

  if (!isValidId(lecturerId)) {
    sendLecturerNotFound(res);
    return;
  }

  const { active } = req.body ?? {};

  if (typeof active !== "boolean") {
    res.status(400).json({
      error: { code: "INVALID_ACTIVE", message: "active must be true or false." },
    });
    return;
  }

  try {
    const [updated] = await db
      .update(lecturers)
      .set({ active, updatedAt: new Date() })
      .where(eq(lecturers.id, lecturerId))
      .returning();

    if (!updated) {
      sendLecturerNotFound(res);
      return;
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("Failed to update lecturer active status:", error);
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "The lecturer's status could not be updated." },
    });
  }
}

/**
 * PATCH /api/admin/lecturers/:id/office
 * Assigns (or unassigns, with officeId: null) an office.
 */
export async function setLecturerOffice(
  req: Request,
  res: Response,
): Promise<void> {
  const lecturerId = req.params.id;

  if (!isValidId(lecturerId)) {
    sendLecturerNotFound(res);
    return;
  }

  const { officeId } = req.body ?? {};

  if (officeId !== null && typeof officeId !== "number") {
    res.status(400).json({
      error: { code: "INVALID_OFFICE_ID", message: "officeId must be a number or null." },
    });
    return;
  }

  try {
    if (officeId !== null) {
      const [office] = await db
        .select({ id: offices.id })
        .from(offices)
        .where(eq(offices.id, officeId))
        .limit(1);

      if (!office) {
        res.status(404).json({
          error: { code: "OFFICE_NOT_FOUND", message: "No office exists with that id." },
        });
        return;
      }
    }

    const [updated] = await db
      .update(lecturers)
      .set({ officeId, updatedAt: new Date() })
      .where(eq(lecturers.id, lecturerId))
      .returning();

    if (!updated) {
      sendLecturerNotFound(res);
      return;
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("Failed to update lecturer's office:", error);
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "The lecturer's office could not be updated." },
    });
  }
}

/**
 * POST /api/admin/lecturers/:id/modules
 * Assigns a module to a lecturer.
 */
export async function addLecturerModule(
  req: Request,
  res: Response,
): Promise<void> {
  const lecturerId = req.params.id;

  if (!isValidId(lecturerId)) {
    sendLecturerNotFound(res);
    return;
  }

  const { moduleId } = req.body ?? {};

  if (typeof moduleId !== "number") {
    res.status(400).json({
      error: { code: "INVALID_MODULE_ID", message: "moduleId must be a number." },
    });
    return;
  }

  try {
    const [lecturer] = await db
      .select({ id: lecturers.id })
      .from(lecturers)
      .where(eq(lecturers.id, lecturerId))
      .limit(1);

    if (!lecturer) {
      sendLecturerNotFound(res);
      return;
    }

    const [module_] = await db
      .select({ id: modules.id })
      .from(modules)
      .where(eq(modules.id, moduleId))
      .limit(1);

    if (!module_) {
      res.status(404).json({
        error: { code: "MODULE_NOT_FOUND", message: "No module exists with that id." },
      });
      return;
    }

    await db
      .insert(lecturerModules)
      .values({ lecturerId, moduleId })
      .onConflictDoNothing();

    const assignedModules = await db
      .select({ id: modules.id, code: modules.code, name: modules.name })
      .from(lecturerModules)
      .innerJoin(modules, eq(lecturerModules.moduleId, modules.id))
      .where(eq(lecturerModules.lecturerId, lecturerId))
      .orderBy(modules.code);

    res.status(200).json({ modules: assignedModules });
  } catch (error) {
    console.error("Failed to assign module to lecturer:", error);
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "The module could not be assigned." },
    });
  }
}

/**
 * DELETE /api/admin/lecturers/:id/modules/:moduleId
 * Removes a module from a lecturer.
 */
export async function removeLecturerModule(
  req: Request,
  res: Response,
): Promise<void> {
  const lecturerId = req.params.id;
  const moduleId = Number(req.params.moduleId);

  if (!isValidId(lecturerId)) {
    sendLecturerNotFound(res);
    return;
  }

  if (!Number.isInteger(moduleId)) {
    res.status(400).json({
      error: { code: "INVALID_MODULE_ID", message: "moduleId must be a whole number." },
    });
    return;
  }

  try {
    await db
      .delete(lecturerModules)
      .where(
        and(
          eq(lecturerModules.lecturerId, lecturerId),
          eq(lecturerModules.moduleId, moduleId),
        ),
      );

    res.status(204).send();
  } catch (error) {
    console.error("Failed to remove module from lecturer:", error);
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "The module could not be removed." },
    });
  }
}