# Duel arena guide verification

The arena's `duel_arena_guide` placement now has a matching entry in
`manifests/npcs.json`. Hyperforge's `MobNPCSpawnerSystem` skips placements without
that entry. Its normal NPC talk interaction loads the manifest dialogue through
`DialogueSystem`; no new packets or dialogue effects are needed.

Marcus deliberately reuses the existing Captain Rowan humanoid model. This is
shared art, not a newly generated Marcus model. The exact dependency is
`models/npcs/captain-rowan/captain-rowan.vrm`, tracked by Git LFS (31,756,260 bytes;
SHA-256 `3c8094c6434ce235f15da1e6e561cecc9979aa70447df172ac8cc0f7ddd87d87`).
Runtime testing needs the materialized VRM, not the Git LFS pointer text.

## Source/data checks

Run from the assets checkout with Node 24+:

```sh
node --test tests/duel-arena-guide.test.mjs
HYPERFORGE_ROOT=/path/to/hyperforge node --test tests/*.test.mjs
```

These validate placement-to-definition identity, noncombat configuration, a
tracked shared model reference, and every dialogue branch/terminal. They do not
load the model or exercise rendering, network packets, or the game server.

## Game verification (still outstanding)

1. Materialize this assets checkout's Git LFS files and serve it as the consuming
   Hyperforge checkout's configured assets source. Restart the game server so
   DataManager reloads the manifest. Follow that checkout's startup instructions;
   use a WebGPU-capable browser, never a WebGL fallback.
2. Enter the duel arena lobby at X=385, Z=381. Confirm Marcus appears using the
   shared humanoid art and does not spawn as an attackable mob.
3. Choose Talk-to. Confirm the greeting offers challenge instructions, rule
   guidance, and Goodbye. Each choice must show its matching terminal text;
   Continue must close the conversation.
4. Reopen the conversation, close it with X, and reopen again. Move out of
   interaction range and verify the normal range/session behavior still applies.
5. Verify no bank, heal, quest, reward, or scoreboard action is offered by Marcus.

The nurse and scoreboard still lack definitions and implemented services. This
slice does not restore health/prayer, display rankings, change duel rules, or
perform stake/payment actions. The earlier four-coordinate repair is unchanged.
