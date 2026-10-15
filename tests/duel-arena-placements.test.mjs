import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

// Run with Node 24+ and HYPERFORGE_ROOT pointing to the consuming checkout.
// Import the real layout contract rather than duplicating its coordinates here.
assert.ok(process.env.HYPERFORGE_ROOT, "Set HYPERFORGE_ROOT to the Hyperforge checkout");
const layout = await import(pathToFileURL(path.resolve(
  process.env.HYPERFORGE_ROOT,
  "packages/shared/src/data/arena-layout.ts",
)).href);
const area = JSON.parse(readFileSync(new URL(
  "../manifests/world-areas.json", import.meta.url,
), "utf8")).specialAreas.duel_arena;

const placements = [
  ["duel_arena_nurse", "HOSPITAL", area.npcs],
  ["duel_arena_scoreboard", "LOBBY", area.npcs],
  ["duel_arena_guide", "LOBBY", area.npcs],
  ["duel_arena_bank", "LOBBY", area.stations],
];

for (const [id, building, entries] of placements) {
  test(`${id} is inside the arena and its ${building.toLowerCase()} floor`, () => {
    const entry = entries.find((candidate) => candidate.id === id);
    assert.ok(entry, `Missing placement: ${id}`);
    const { x, z } = entry.position;
    assert.ok(Number.isFinite(x) && Number.isFinite(z), `${id}: invalid position`);
    assert.ok(x >= area.bounds.minX && x <= area.bounds.maxX &&
      z >= area.bounds.minZ && z <= area.bounds.maxZ, `${id}: outside arena bounds`);
    assert.ok(Math.abs(x - layout[`${building}_CENTER_X`]) < layout[`${building}_WIDTH`] / 2 &&
      Math.abs(z - layout[`${building}_CENTER_Z`]) < layout[`${building}_LENGTH`] / 2,
    `${id}: outside ${building.toLowerCase()} floor`);
  });
}
