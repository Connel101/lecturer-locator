import {
  check,
  pgTable,
  uuid,
  serial,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  time,
  primaryKey,
  unique,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Floor Plans
 *
 * Represents one floor of a building.
 * The actual SVG file is stored separately; svgFileRef stores its location.
 */
export const floorPlans = pgTable(
  "floor_plans",
  {
    id: serial("id").primaryKey(),

    buildingName: varchar("building_name", { length: 255 }).notNull(),

    // Ground floor = 0, first floor = 1, etc.
    floorLevel: integer("floor_level").notNull(),

    fileRef: text("file_ref").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("floor_plans_building_floor_unique").on(
      table.buildingName,
      table.floorLevel,
    ),
  ],
);

/**
 * Offices
 *
 * Represents a room/office located on a particular floor plan.
 */
export const offices = pgTable(
  "offices",
  {
    id: serial("id").primaryKey(),

    floorPlanId: integer("floor_plan_id")
      .notNull()
      .references(() => floorPlans.id),

    roomNumber: varchar("room_number", { length: 50 }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("offices_floor_room_unique").on(
      table.floorPlanId,
      table.roomNumber,
    ),
  ],
);

/**
 * Lecturers
 *
 * The lecturer UUID is permanent and is what the QR-linked profile
 * ultimately identifies.
 *
 * Changing officeId therefore does not change the lecturer's QR code.
 */
export const lecturers = pgTable("lecturers", {
  id: uuid("id").defaultRandom().primaryKey(),

  fullName: varchar("full_name", { length: 255 }).notNull(),

  title: varchar("title", { length: 100 }),

  department: varchar("department", { length: 255 }),

  researchArea: text("research_area"),

  active: boolean("active").default(true).notNull(),

  officeId: integer("office_id").references(() => offices.id, {
    onDelete: "set null",
  }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Lecturer Office Hours
 *
 * Stores recurring weekly availability. Days use ISO numbering:
 * Monday = 1 through Sunday = 7.
 */
export const lecturerOfficeHours = pgTable(
  "lecturer_office_hours",
  {
    lecturerId: uuid("lecturer_id")
      .notNull()
      .references(() => lecturers.id, {
        onDelete: "cascade",
      }),

    dayOfWeek: integer("day_of_week").notNull(),

    startTime: time("start_time").notNull(),

    endTime: time("end_time").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [
        table.lecturerId,
        table.dayOfWeek,
        table.startTime,
        table.endTime,
      ],
    }),
    check(
      "lecturer_office_hours_day_of_week_check",
      sql`${table.dayOfWeek} between 1 and 7`,
    ),
    check(
      "lecturer_office_hours_time_range_check",
      sql`${table.endTime} > ${table.startTime}`,
    ),
  ],
);

/**
 * Modules
 */
export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),

  code: varchar("code", { length: 50 }).notNull().unique(),

  name: varchar("name", { length: 255 }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Lecturer ↔ Module many-to-many relationship
 */
export const lecturerModules = pgTable(
  "lecturer_modules",
  {
    lecturerId: uuid("lecturer_id")
      .notNull()
      .references(() => lecturers.id, {
        onDelete: "cascade",
      }),

    moduleId: integer("module_id")
      .notNull()
      .references(() => modules.id, {
        onDelete: "cascade",
      }),
  },
  (table) => [
    primaryKey({
      columns: [table.lecturerId, table.moduleId],
    }),
  ],
);

/**
 * Routes
 *
 * Stores the predefined route overlay only.
 * It does NOT store the complete floor-plan SVG.
 */
export const routes = pgTable("routes", {
  id: serial("id").primaryKey(),

  officeId: integer("office_id")
    .notNull()
    .references(() => offices.id, {
      onDelete: "cascade",
    }),

  // For example: "Main Entrance"
  entrancePoint: varchar("entrance_point", { length: 255 }).notNull(),

  // Complete exported overlay, including artwork and editable metadata.
  svgOverlay: text("svg_overlay"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
