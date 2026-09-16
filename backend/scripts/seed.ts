import "dotenv/config";

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { and, eq, notInArray } from "drizzle-orm";

import {
  floorPlans,
  lecturerModules,
  lecturers,
  modules,
  offices,
  routes,
} from "../src/db/schema.ts";
import { db } from "../src/lib/db.ts";
import {
  parseSeedCsv,
  seedLecturers,
  type SeedStore,
  type SeedSummary,
} from "../src/lib/seed.ts";

const csvPath = fileURLToPath(new URL("../data/sample-lecturers.csv", import.meta.url));
const routeDirectory = new URL("../src/data/floorplans/", import.meta.url);

function formatCounts(summary: SeedSummary): string[] {
  const labels = {
    floorPlans: "floor plans",
    offices: "offices",
    lecturers: "lecturers",
    modules: "modules",
    lecturerModules: "module links",
    routes: "routes",
  } as const;

  return Object.entries(labels).map(([entity, label]) => {
    const key = entity as keyof typeof labels;
    const action = ["floorPlans", "lecturers", "routes"].includes(key) ? "refreshed" : "reused";
    return `  ${label}: ${summary.inserted[key]} inserted, ${summary.reused[key]} ${action}`;
  });
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("The development seed command cannot run when NODE_ENV=production.");
  }

  const rows = parseSeedCsv(await readFile(csvPath, "utf8"));

  const summary = await db.transaction(async (tx) => {
    const store: SeedStore = {
      async saveFloorPlan(input) {
        const [existing] = await tx
          .select({ id: floorPlans.id })
          .from(floorPlans)
          .where(
            and(
              eq(floorPlans.buildingName, input.buildingName),
              eq(floorPlans.floorLevel, input.floorLevel),
            ),
          )
          .limit(1);
        if (existing) {
          await tx.update(floorPlans).set({ fileRef: input.fileRef, updatedAt: new Date() })
            .where(eq(floorPlans.id, existing.id));
          return { id: existing.id, inserted: false };
        }

        const [created] = await tx.insert(floorPlans).values(input).returning({ id: floorPlans.id });
        return { id: created.id, inserted: true };
      },

      async getOrCreateOffice(input) {
        const [existing] = await tx
          .select({ id: offices.id })
          .from(offices)
          .where(
            and(
              eq(offices.floorPlanId, input.floorPlanId),
              eq(offices.roomNumber, input.roomNumber),
            ),
          )
          .limit(1);
        if (existing) return { id: existing.id, inserted: false };

        const [created] = await tx.insert(offices).values(input).returning({ id: offices.id });
        return { id: created.id, inserted: true };
      },

      async saveLecturer(input) {
        const [existing] = await tx
          .select({ id: lecturers.id })
          .from(lecturers)
          .where(eq(lecturers.fullName, input.fullName))
          .limit(1);
        if (existing) {
          await tx.update(lecturers).set({ ...input, updatedAt: new Date() })
            .where(eq(lecturers.id, existing.id));
          return { id: existing.id, inserted: false };
        }

        const [created] = await tx.insert(lecturers).values(input).returning({ id: lecturers.id });
        return { id: created.id, inserted: true };
      },

      async getOrCreateModule(code) {
        const [existing] = await tx
          .select({ id: modules.id })
          .from(modules)
          .where(eq(modules.code, code))
          .limit(1);
        if (existing) return { id: existing.id, inserted: false };

        const [created] = await tx.insert(modules).values({ code }).returning({ id: modules.id });
        return { id: created.id, inserted: true };
      },

      async removeOtherLecturerModules(lecturerId, moduleIds) {
        const removed = await tx.delete(lecturerModules).where(and(
          eq(lecturerModules.lecturerId, lecturerId),
          moduleIds.length ? notInArray(lecturerModules.moduleId, moduleIds) : undefined,
        )).returning({ moduleId: lecturerModules.moduleId });
        return removed.length;
      },

      async ensureLecturerModule(lecturerId, moduleId) {
        const [created] = await tx
          .insert(lecturerModules)
          .values({ lecturerId, moduleId })
          .onConflictDoNothing()
          .returning({ lecturerId: lecturerModules.lecturerId });
        return { inserted: Boolean(created) };
      },

      async saveRoute(input) {
        const [existing] = await tx
          .select()
          .from(routes)
          .where(eq(routes.officeId, input.officeId))
          .orderBy(routes.id)
          .limit(1);
        if (existing) {
          await tx.update(routes).set({
            entrancePoint: input.entrancePoint, svgOverlay: input.svgOverlay, updatedAt: new Date(),
          }).where(eq(routes.id, existing.id));
          return { inserted: false };
        }

        await tx.insert(routes).values(input);
        return { inserted: true };
      },
    };

    return seedLecturers(rows, store, async (roomNumber) => {
      try {
        return await readFile(new URL(`${roomNumber}.svg`, routeDirectory), "utf8");
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw error;
      }
    });
  });

  console.log("Development seed complete.");
  console.log(formatCounts(summary).join("\n"));
  console.log(`  obsolete module links removed: ${summary.moduleLinksRemoved}`);
  if (summary.routesSkipped.length > 0) {
    console.warn(`  routes skipped (missing SVG): ${summary.routesSkipped.join(", ")}`);
  }
}

main().catch((error) => {
  console.error("Development seed failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
