import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

import {
  SEED_CSV_HEADERS,
  floorPlanFileRef,
  parseRouteSvg,
  parseSeedCsv,
  seedLecturers,
  type SeedRow,
  type SeedStore,
} from "../src/lib/seed.ts";

const header = SEED_CSV_HEADERS.join(",");

function routeSvg(roomNumber: string, svgPath = "M 1 2 L 3 4"): string {
  return `<svg><metadata>${JSON.stringify({ officeLabel: roomNumber, svgPath })}</metadata></svg>`;
}

function sampleRow(overrides: Partial<SeedRow> = {}): SeedRow {
  return {
    fullName: "Thabo Nkosi",
    title: "Senior Lecturer",
    department: "Computer Science",
    moduleCodes: ["CMPG111"],
    researchArea: "Software Engineering",
    officeHours: "Mon-Wed 10:00-12:00",
    active: true,
    buildingName: "G3",
    floorLevel: 0,
    roomNumber: "G03",
    entrancePoint: "Main Entrance",
    ...overrides,
  };
}

class MemorySeedStore implements SeedStore {
  nextId = 1;
  floorPlans = new Map<string, { id: number; fileRef: string }>();
  offices = new Map<string, { id: number; floorPlanId: number; roomNumber: string }>();
  lecturers = new Map<
    string,
    {
      id: string;
      title: string | null;
      active: boolean;
      officeId: number;
    }
  >();
  modules = new Map<string, number>();
  lecturerModules = new Set<string>();
  routes = new Map<number, { entrancePoint: string; svgPath: string }>();

  async getOrCreateFloorPlan(input: {
    buildingName: string;
    floorLevel: number;
    fileRef: string;
  }) {
    const key = `${input.buildingName}:${input.floorLevel}`;
    const existing = this.floorPlans.get(key);
    if (existing) return { id: existing.id, inserted: false };
    const created = { id: this.nextId++, fileRef: input.fileRef };
    this.floorPlans.set(key, created);
    return { id: created.id, inserted: true };
  }

  async getOrCreateOffice(input: { floorPlanId: number; roomNumber: string }) {
    const key = `${input.floorPlanId}:${input.roomNumber}`;
    const existing = this.offices.get(key);
    if (existing) return { id: existing.id, inserted: false };
    const created = { id: this.nextId++, ...input };
    this.offices.set(key, created);
    return { id: created.id, inserted: true };
  }

  async getOrCreateLecturer(input: {
    fullName: string;
    title: string | null;
    active: boolean;
    officeId: number;
  }) {
    const existing = this.lecturers.get(input.fullName);
    if (existing) return { id: existing.id, inserted: false };
    const created = {
      id: `lecturer-${this.nextId++}`,
      title: input.title,
      active: input.active,
      officeId: input.officeId,
    };
    this.lecturers.set(input.fullName, created);
    return { id: created.id, inserted: true };
  }

  async getOrCreateModule(code: string) {
    const existing = this.modules.get(code);
    if (existing) return { id: existing, inserted: false };
    const id = this.nextId++;
    this.modules.set(code, id);
    return { id, inserted: true };
  }

  async ensureLecturerModule(lecturerId: string, moduleId: number) {
    const key = `${lecturerId}:${moduleId}`;
    const inserted = !this.lecturerModules.has(key);
    this.lecturerModules.add(key);
    return { inserted };
  }

  async getOrCreateRoute(input: {
    officeId: number;
    entrancePoint: string;
    svgPath: string;
  }) {
    if (this.routes.has(input.officeId)) return { inserted: false };
    this.routes.set(input.officeId, {
      entrancePoint: input.entrancePoint,
      svgPath: input.svgPath,
    });
    return { inserted: true };
  }
}

test("parses quoted CSV fields, escaped quotes, CRLF, modules, and empty values", () => {
  const csv =
    `${header}\r\n` +
    '"Nkosi, Thabo",Senior Lecturer,Computer Science,CMPG111; CMPG222,"Data, systems",,Inactive,G3,-1,B01,Main Entrance,"Says ""hello"""\r\n';

  assert.deepEqual(parseSeedCsv(csv), [
    {
      fullName: "Nkosi, Thabo",
      title: "Senior Lecturer",
      department: "Computer Science",
      moduleCodes: ["CMPG111", "CMPG222"],
      researchArea: "Data, systems",
      officeHours: null,
      active: false,
      buildingName: "G3",
      floorLevel: -1,
      roomNumber: "B01",
      entrancePoint: "Main Entrance",
    },
  ]);
});

test("rejects incorrect headers and malformed row widths", () => {
  assert.throws(() => parseSeedCsv("Name,Status\nThabo,Active"), /Invalid seed CSV headers/);
  assert.throws(() => parseSeedCsv(`${header}\nThabo`), /has 1 columns/);
});

test("rejects malformed quoting, statuses, and floor levels", () => {
  assert.throws(() => parseSeedCsv(`${header}\n"Thabo`), /Unclosed quoted value/);
  assert.throws(
    () =>
      parseSeedCsv(
        `${header}\nThabo,Lecturer,Science,CMPG111,AI,,Unknown,G3,0,G03,Main Entrance,Text`,
      ),
    /Status must be Active or Inactive/,
  );
  assert.throws(
    () =>
      parseSeedCsv(
        `${header}\nThabo,Lecturer,Science,CMPG111,AI,,Active,G3,ground,G03,Main Entrance,Text`,
      ),
    /Floor Level must be an integer/,
  );
});

test("maps the supported floor-plan files and rejects unknown floors", () => {
  assert.equal(floorPlanFileRef("g3", 0), "/data/floorplans/groundfloor.svg");
  assert.equal(floorPlanFileRef("G3", -1), "/data/floorplans/basement.svg");
  assert.throws(() => floorPlanFileRef("G3", 1), /No floor-plan file mapping/);
});

test("extracts route metadata and validates the office label and path", () => {
  assert.equal(parseRouteSvg(routeSvg("G03"), "G03"), "M 1 2 L 3 4");
  assert.throws(() => parseRouteSvg("<svg />", "G03"), /does not contain metadata/);
  assert.throws(() => parseRouteSvg("<svg><metadata>nope</metadata></svg>", "G03"), /invalid metadata JSON/);
  assert.throws(() => parseRouteSvg(routeSvg("G04"), "G03"), /does not match room G03/);
  assert.throws(() => parseRouteSvg(routeSvg("G03", ""), "G03"), /does not contain an SVG path/);
});

test("repeated seeds preserve existing values while adding missing links and routes", async () => {
  const store = new MemorySeedStore();

  const first = await seedLecturers([sampleRow()], store, async () => null);
  assert.equal(first.inserted.lecturers, 1);
  assert.deepEqual(first.routesSkipped, ["G03"]);

  const second = await seedLecturers(
    [sampleRow({ title: "Professor", active: false, moduleCodes: ["CMPG111", "CMPG222"] })],
    store,
    async () => routeSvg("G03"),
  );
  assert.equal(second.reused.lecturers, 1);
  assert.equal(second.inserted.modules, 1);
  assert.equal(second.inserted.lecturerModules, 1);
  assert.equal(second.inserted.routes, 1);
  assert.equal(store.lecturers.get("Thabo Nkosi")?.title, "Senior Lecturer");
  assert.equal(store.lecturers.get("Thabo Nkosi")?.active, true);

  const third = await seedLecturers(
    [sampleRow({ moduleCodes: ["CMPG111", "CMPG222"] })],
    store,
    async () => routeSvg("G03", "M changed"),
  );
  assert.equal(third.inserted.floorPlans, 0);
  assert.equal(third.inserted.offices, 0);
  assert.equal(third.inserted.lecturers, 0);
  assert.equal(third.inserted.modules, 0);
  assert.equal(third.inserted.lecturerModules, 0);
  assert.equal(third.inserted.routes, 0);
  assert.equal(store.routes.values().next().value?.svgPath, "M 1 2 L 3 4");
});

test("fails instead of silently skipping a malformed route asset", async () => {
  await assert.rejects(
    seedLecturers([sampleRow()], new MemorySeedStore(), async () => "<svg />"),
    /does not contain metadata/,
  );
});

test("the checked-in sample CSV and available room route assets are valid", () => {
  const csvPath = new URL("../data/sample-lecturers.csv", import.meta.url);
  const routeDirectory = new URL("../src/data/floorplans/", import.meta.url);
  const rows = parseSeedCsv(readFileSync(csvPath, "utf8"));
  const missingRoutes: string[] = [];

  for (const row of rows) {
    const routeUrl = new URL(`${row.roomNumber}.svg`, routeDirectory);
    if (!existsSync(routeUrl)) {
      missingRoutes.push(row.roomNumber);
      continue;
    }
    assert.ok(parseRouteSvg(readFileSync(routeUrl, "utf8"), row.roomNumber));
  }

  assert.equal(rows.length, 11);
  assert.deepEqual(missingRoutes, ["B01"]);
});
