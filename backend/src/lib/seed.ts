export const SEED_CSV_HEADERS = [
  "Full Name",
  "Academic Title",
  "Department or Faculty",
  "Modules Taught",
  "Research Area",
  "Office Hours",
  "Status",
  "Building Name",
  "Floor Level",
  "Room Number",
  "Designated Entrance",
  "Short Description",
] as const;

export interface SeedRow {
  fullName: string;
  title: string | null;
  department: string | null;
  moduleCodes: string[];
  researchArea: string | null;
  officeHours: string | null;
  active: boolean;
  buildingName: string;
  floorLevel: number;
  roomNumber: string;
  entrancePoint: string;
}

export interface SeedStore {
  saveFloorPlan(input: {
    buildingName: string;
    floorLevel: number;
    fileRef: string;
  }): Promise<{ id: number; inserted: boolean }>;
  getOrCreateOffice(input: {
    floorPlanId: number;
    roomNumber: string;
  }): Promise<{ id: number; inserted: boolean }>;
  saveLecturer(input: {
    fullName: string;
    title: string | null;
    department: string | null;
    researchArea: string | null;
    officeHours: string | null;
    active: boolean;
    officeId: number;
  }): Promise<{ id: string; inserted: boolean }>;
  getOrCreateModule(code: string): Promise<{ id: number; inserted: boolean }>;
  removeOtherLecturerModules(lecturerId: string, moduleIds: number[]): Promise<number>;
  ensureLecturerModule(
    lecturerId: string,
    moduleId: number,
  ): Promise<{ inserted: boolean }>;
  saveRoute(input: {
    officeId: number;
    entrancePoint: string;
    svgOverlay: string;
  }): Promise<{ inserted: boolean }>;
}

type SeedEntity =
  | "floorPlans"
  | "offices"
  | "lecturers"
  | "modules"
  | "lecturerModules"
  | "routes";

export interface SeedSummary {
  inserted: Record<SeedEntity, number>;
  reused: Record<SeedEntity, number>;
  moduleLinksRemoved: number;
  routesSkipped: string[];
}

interface CsvRow {
  line: number;
  values: string[];
}

function parseCsvRows(csv: string): CsvRow[] {
  const rows: CsvRow[] = [];
  let values: string[] = [];
  let value = "";
  let inQuotes = false;
  let closedQuote = false;
  let line = 1;
  let rowLine = 1;

  const finishValue = () => {
    values.push(value);
    value = "";
    closedQuote = false;
  };

  const finishRow = () => {
    finishValue();
    if (values.some((item) => item.length > 0)) {
      rows.push({ line: rowLine, values });
    }
    values = [];
    rowLine = line + 1;
  };

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];

    if (inQuotes) {
      if (character === '"') {
        if (csv[index + 1] === '"') {
          value += '"';
          index += 1;
        } else {
          inQuotes = false;
          closedQuote = true;
        }
      } else if (character === "\r" || character === "\n") {
        if (character === "\r" && csv[index + 1] === "\n") {
          index += 1;
        }
        value += "\n";
        line += 1;
      } else {
        value += character;
      }
      continue;
    }

    if (closedQuote && character !== "," && character !== "\r" && character !== "\n") {
      throw new Error(`Unexpected character after a closing quote on CSV line ${line}.`);
    }

    if (character === '"') {
      if (value.length > 0) {
        throw new Error(`Unexpected quote in an unquoted value on CSV line ${line}.`);
      }
      inQuotes = true;
    } else if (character === ",") {
      finishValue();
    } else if (character === "\r" || character === "\n") {
      if (character === "\r" && csv[index + 1] === "\n") {
        index += 1;
      }
      finishRow();
      line += 1;
    } else {
      value += character;
    }
  }

  if (inQuotes) {
    throw new Error(`Unclosed quoted value starting on CSV line ${rowLine}.`);
  }

  if (value.length > 0 || values.length > 0) {
    finishRow();
  }

  return rows;
}

function required(value: string, header: string, line: number): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${header} is required on CSV line ${line}.`);
  }
  return normalized;
}

function optional(value: string): string | null {
  const normalized = value.trim();
  return normalized || null;
}

export function parseSeedCsv(csv: string): SeedRow[] {
  const rows = parseCsvRows(csv.replace(/^\uFEFF/, ""));
  const headerRow = rows.shift();

  if (!headerRow) {
    throw new Error("The seed CSV is empty.");
  }

  const actualHeaders = headerRow.values.map((header) => header.trim());
  if (
    actualHeaders.length !== SEED_CSV_HEADERS.length ||
    actualHeaders.some((header, index) => header !== SEED_CSV_HEADERS[index])
  ) {
    throw new Error(
      `Invalid seed CSV headers. Expected: ${SEED_CSV_HEADERS.join(", ")}.`,
    );
  }

  return rows.map(({ line: rowLine, values }) => {
    if (values.length !== SEED_CSV_HEADERS.length) {
      throw new Error(
        `CSV line ${rowLine} has ${values.length} columns; expected ${SEED_CSV_HEADERS.length}.`,
      );
    }

    const status = required(values[6], "Status", rowLine).toLowerCase();
    if (status !== "active" && status !== "inactive") {
      throw new Error(`Status must be Active or Inactive on CSV line ${rowLine}.`);
    }

    const floorValue = required(values[8], "Floor Level", rowLine);
    if (!/^-?\d+$/.test(floorValue)) {
      throw new Error(`Floor Level must be an integer on CSV line ${rowLine}.`);
    }

    return {
      fullName: required(values[0], "Full Name", rowLine),
      title: optional(values[1]),
      department: optional(values[2]),
      moduleCodes: [
        ...new Set(
          values[3]
            .split(";")
            .map((code) => code.trim())
            .filter(Boolean),
        ),
      ],
      researchArea: optional(values[4]),
      officeHours: optional(values[5]),
      active: status === "active",
      buildingName: required(values[7], "Building Name", rowLine),
      floorLevel: Number.parseInt(floorValue, 10),
      roomNumber: required(values[9], "Room Number", rowLine),
      entrancePoint: required(values[10], "Designated Entrance", rowLine),
    };
  });
}

export function floorPlanFileRef(buildingName: string, floorLevel: number): string {
  const key = `${buildingName.trim().toUpperCase()}:${floorLevel}`;
  const refs: Record<string, string> = {
    "G3:0": "/data/floorplans/groundfloor.svg",
    "G3:-1": "/data/floorplans/basement.svg",
  };
  const fileRef = refs[key];

  if (!fileRef) {
    throw new Error(
      `No floor-plan file mapping exists for building ${buildingName}, floor ${floorLevel}.`,
    );
  }

  return fileRef;
}

function decodeXmlText(value: string): string {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

export function parseRouteSvg(svg: string, expectedRoom: string): string {
  const metadataMatch = svg.match(/<metadata>([\s\S]*?)<\/metadata>/i);
  if (!metadataMatch) {
    throw new Error(`Route SVG for ${expectedRoom} does not contain metadata.`);
  }

  let metadata: unknown;
  try {
    metadata = JSON.parse(decodeXmlText(metadataMatch[1].trim()));
  } catch {
    throw new Error(`Route SVG for ${expectedRoom} contains invalid metadata JSON.`);
  }

  if (!metadata || typeof metadata !== "object") {
    throw new Error(`Route SVG for ${expectedRoom} contains invalid metadata.`);
  }

  const route = metadata as { officeLabel?: unknown; svgPath?: unknown };
  if (typeof route.officeLabel !== "string" || route.officeLabel.trim() !== expectedRoom) {
    throw new Error(`Route SVG office label does not match room ${expectedRoom}.`);
  }
  if (typeof route.svgPath !== "string" || !route.svgPath.trim()) {
    throw new Error(`Route SVG for ${expectedRoom} does not contain an SVG path.`);
  }

  return svg;
}

function emptyCounts(): Record<SeedEntity, number> {
  return {
    floorPlans: 0,
    offices: 0,
    lecturers: 0,
    modules: 0,
    lecturerModules: 0,
    routes: 0,
  };
}

function recordResult(
  summary: SeedSummary,
  entity: SeedEntity,
  inserted: boolean,
): void {
  summary[inserted ? "inserted" : "reused"][entity] += 1;
}

export async function seedLecturers(
  rows: SeedRow[],
  store: SeedStore,
  loadRouteSvg: (roomNumber: string) => Promise<string | null>,
): Promise<SeedSummary> {
  const summary: SeedSummary = {
    inserted: emptyCounts(),
    reused: emptyCounts(),
    moduleLinksRemoved: 0,
    routesSkipped: [],
  };
  const floorPlanIds = new Map<string, number>();
  const officeIds = new Map<string, number>();
  const lecturerIds = new Map<string, string>();
  const moduleIds = new Map<string, number>();

  for (const row of rows) {
    const key = `${row.buildingName.trim().toUpperCase()}:${row.floorLevel}`;
    if (floorPlanIds.has(key)) continue;

    const result = await store.saveFloorPlan({
      buildingName: row.buildingName,
      floorLevel: row.floorLevel,
      fileRef: floorPlanFileRef(row.buildingName, row.floorLevel),
    });
    floorPlanIds.set(key, result.id);
    recordResult(summary, "floorPlans", result.inserted);
  }

  for (const row of rows) {
    const floorKey = `${row.buildingName.trim().toUpperCase()}:${row.floorLevel}`;
    const officeKey = `${floorKey}:${row.roomNumber}`;
    if (officeIds.has(officeKey)) continue;

    const result = await store.getOrCreateOffice({
      floorPlanId: floorPlanIds.get(floorKey)!,
      roomNumber: row.roomNumber,
    });
    officeIds.set(officeKey, result.id);
    recordResult(summary, "offices", result.inserted);
  }

  for (const row of rows) {
    if (lecturerIds.has(row.fullName)) continue;
    const floorKey = `${row.buildingName.trim().toUpperCase()}:${row.floorLevel}`;
    const officeKey = `${floorKey}:${row.roomNumber}`;
    const result = await store.saveLecturer({
      fullName: row.fullName,
      title: row.title,
      department: row.department,
      researchArea: row.researchArea,
      officeHours: row.officeHours,
      active: row.active,
      officeId: officeIds.get(officeKey)!,
    });
    lecturerIds.set(row.fullName, result.id);
    recordResult(summary, "lecturers", result.inserted);
  }

  for (const code of new Set(rows.flatMap((row) => row.moduleCodes))) {
    const result = await store.getOrCreateModule(code);
    moduleIds.set(code, result.id);
    recordResult(summary, "modules", result.inserted);
  }

  for (const [name, lecturerId] of lecturerIds) {
    const desiredIds = [...new Set(rows.filter((row) => row.fullName === name)
      .flatMap((row) => row.moduleCodes).map((code) => moduleIds.get(code)!))];
    summary.moduleLinksRemoved += await store.removeOtherLecturerModules(lecturerId, desiredIds);
    for (const moduleId of desiredIds) {
      const result = await store.ensureLecturerModule(lecturerId, moduleId);
      recordResult(summary, "lecturerModules", result.inserted);
    }
  }

  const seenOffices = new Set<number>();
  for (const row of rows) {
    const floorKey = `${row.buildingName.trim().toUpperCase()}:${row.floorLevel}`;
    const officeKey = `${floorKey}:${row.roomNumber}`;
    const officeId = officeIds.get(officeKey)!;
    if (seenOffices.has(officeId)) continue;
    seenOffices.add(officeId);

    const svg = await loadRouteSvg(row.roomNumber);
    if (svg === null) {
      summary.routesSkipped.push(row.roomNumber);
      continue;
    }

    const result = await store.saveRoute({
      officeId,
      entrancePoint: row.entrancePoint,
      svgOverlay: parseRouteSvg(svg, row.roomNumber),
    });
    recordResult(summary, "routes", result.inserted);
  }

  return summary;
}
