import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const npcs = JSON.parse(readFileSync(new URL("manifests/npcs.json", root), "utf8"));
const arena = JSON.parse(readFileSync(new URL("manifests/world-areas.json", root), "utf8")).specialAreas.duel_arena;
const id = "duel_arena_guide";

test("arena guide placement resolves to one noncombat, stationary NPC definition", () => {
  assert.equal(arena.npcs.filter(npc => npc.id === id).length, 1);
  const definitions = npcs.filter(npc => npc.id === id);
  assert.equal(definitions.length, 1, "Spawner skips a guide missing from npcs.json");
  const guide = definitions[0];
  assert.equal(guide.name, arena.npcs.find(npc => npc.id === id).name);
  assert.equal(guide.category, "neutral");
  assert.equal(guide.combat.attackable, false);
  assert.equal(guide.movement.type, "stationary");
  assert.equal(guide.movement.speed, 0);
  assert.deepEqual(guide.services.types, [], "Guidance must not advertise unimplemented services");
});

test("guide reuses a tracked humanoid model rather than the missing human fallback", () => {
  const guide = npcs.find(npc => npc.id === id);
  assert.ok(guide, "Missing guide definition");
  const model = guide.appearance.modelPath;
  assert.equal(model, npcs.find(npc => npc.id === "captain_rowan").appearance.modelPath);
  assert.ok(model.startsWith("asset://"));
  assert.ok(existsSync(new URL(model.slice("asset://".length), root)), "Model must be tracked in assets");
  assert.equal(guide.appearance.scale, 1);
});

test("all guide dialogue choices reach valid terminal nodes without unsupported effects", () => {
  const guide = npcs.find(npc => npc.id === id);
  assert.ok(guide?.dialogue, "Missing server dialogue tree");
  const { entryNodeId, nodes } = guide.dialogue;
  const byId = new Map(nodes.map(node => [node.id, node]));
  assert.equal(byId.size, nodes.length, "Duplicate dialogue IDs");
  const seen = new Set();
  function visit(id, ancestors = new Set()) {
    assert.ok(!ancestors.has(id), "Dialogue should terminate without a cycle");
    const node = byId.get(id);
    assert.ok(node, `Broken dialogue destination: ${id}`);
    assert.ok(node.text.trim());
    assert.equal(node.effect, undefined);
    seen.add(id);
    for (const response of node.responses ?? []) {
      assert.ok(response.text.trim());
      assert.equal(response.effect, undefined);
      assert.equal(response.condition, undefined);
      visit(response.nextNodeId, new Set([...ancestors, id]));
    }
  }
  visit(entryNodeId);
  assert.equal(seen.size, nodes.length, "Unreachable guide dialogue");
  assert.ok(byId.get(entryNodeId).responses.length >= 2);
  assert.match(nodes.map(node => node.text).join(" "), /right-click.*Challenge/);
});
