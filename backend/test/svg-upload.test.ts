import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isValidSvgUpload } from "../src/lib/svg-upload.ts";

test("accepts a real floor plan with an XML declaration and editor comment", () => {
  const floorPlan = readFileSync(new URL("../src/data/floorplans/groundfloor.svg", import.meta.url));
  assert.equal(isValidSvgUpload(floorPlan), true);
});

test("accepts an exported route overlay and rejects unsafe or non-SVG files", () => {
  const route = readFileSync(new URL("../src/data/floorplans/G03.svg", import.meta.url));
  assert.equal(isValidSvgUpload(route), true);
  assert.equal(isValidSvgUpload(Buffer.from("not an SVG")), false);
  assert.equal(isValidSvgUpload(Buffer.from('<svg onload="alert(1)"></svg>')), false);
});
