# Plan: Play Area & Unit Movement

## TL;DR

Migrate the app from the old tile/grid-based model to a continuous 2D meter-based play area. Units are placed at meter coordinates and move by clicking on the canvas. The backend validates straight-line Euclidean distance against each unit's `moveRange`. The frontend renders a scaled canvas with rotated unit rectangles and handles click-to-move interaction.

---

## Current State (what needs to change)

- `shared/types.ts` — old tile/grid schemas (`TileSchema`, `Tile`, `map: Tile[]`), only 2 unit types (`soldier`, `archer`), no `heading`, no `PlayArea`
- `shared/logic.ts` — Manhattan distance, tile-occupancy/terrain checks, old unit stats
- `frontend/TileMap.tsx` — renders tile grid, no longer relevant
- `frontend/UnitLayer.tsx` — uses `tileSize` grid multiplier, no rotation
- `frontend/Game.tsx` — renders TileMap, no move interaction, hardcodes 8×8 tile stage
- `frontend/store.ts` — no socket or action submission
- `backend/index.ts` — calls `createInitialState` with tile-based state

---

## Steps

### Phase 1 — Shared types & logic *(no dependencies between these two)*

1. **`packages/shared/src/types.ts`** — Replace entirely:
   - Remove `TileSchema` / `Tile`
   - Add `PlayAreaSchema` `{ width: number, height: number }` (meters)
   - Add `UnitTypeSchema` enum: `infantry | archer | cavalry | cannon`
   - Update `UnitSchema`: position x/y in meters (center of rectangle), add `heading: number` (degrees), use new unit types
   - Update `GameStateSchema`: replace `map` with `playArea: PlayAreaSchema`
   - Export `UNIT_STATS` constant as defined in `copilot-instructions.md`
   - Export `PlayArea`, `UnitType`, and all inferred types

2. **`packages/shared/src/logic.ts`** — Rewrite to match new model:
   - `createInitialState(playerIds)`: place 4 units per player at meter coords near opposite corners of a 400m×400m default play area (one of each type per player)
   - `validateAction` move: Euclidean distance `√(dx²+dy²)` ≤ `UNIT_STATS[unit.type].moveRange`; no tile or occupancy checks
   - `applyAction` move: update `x`, `y`, set `moved: true`, compute heading `= Math.atan2(dx, -dy) * (180/Math.PI)` (0°=up, clockwise positive)
   - Keep attack / end-turn logic (will be properly updated in a later milestone)

### Phase 2 — Backend *(depends on Phase 1)*

3. **`packages/backend/src/index.ts`** — Verify `createInitialState` call still compiles after type changes. No logic changes needed if the function signature stays `(playerIds: [string, string]): GameState`.

### Phase 3 — Frontend *(depends on Phase 1; steps 4–7 are independent of each other)*

4. **Delete `packages/frontend/src/components/TileMap.tsx`** — no longer needed.

5. **`packages/frontend/src/components/UnitLayer.tsx`** — Rewrite:
   - Accept `scale: number` (pixels per meter) instead of `tileSize`
   - Use `UNIT_STATS[unit.type].widthM * scale` and `heightM * scale` for rect dimensions
   - Render each unit as a `<Group>` centered on `unit.x * scale, unit.y * scale`
   - Apply `rotation={unit.heading}` on the Group
   - Highlight selected unit with gold stroke
   - Show HP label

6. **`packages/frontend/src/store.ts`** — Add:
   - `socket: Socket | null` field and `setSocket(socket)` action
   - `submitAction(action: Action) => void` — calls `socket.emit("submit-action", action)`
   - `moveRangeCircle: { x, y, radius } | null` for rendering the move range preview

7. **`packages/frontend/src/pages/Game.tsx`** — Rewrite:
   - Fixed scale: `SCALE = 2` px/m → 400m play area renders as 800×800 canvas
   - Create and store the socket in `useEffect`; listen on `game-state`, `turn-start`, `game-over`
   - Render `<Stage>` sized to `playArea.width * SCALE × playArea.height * SCALE`
   - Replace `<TileMap>` with a plain `<Rect>` background (green fill, gray border)
   - Add `<UnitLayer scale={SCALE} />` inside a `<Layer>`
   - Handle Stage `onClick`: if a unit is selected and click is within move range → `submitAction({ type: "move", unitId, to: { x, y } })`; otherwise deselect
   - Render move-range indicator as a `<Circle>` around the selected unit (dashed stroke)
   - HUD: turn number, current player label, End Turn button

---

## Affected Files

| File | Change |
|------|--------|
| `packages/shared/src/types.ts` | Full rewrite |
| `packages/shared/src/logic.ts` | Full rewrite |
| `packages/backend/src/index.ts` | Minor — verify compile |
| `packages/frontend/src/components/TileMap.tsx` | Delete |
| `packages/frontend/src/components/UnitLayer.tsx` | Full rewrite |
| `packages/frontend/src/store.ts` | Add socket + submitAction |
| `packages/frontend/src/pages/Game.tsx` | Full rewrite |

---

## Verification Checklist

1. `pnpm --filter shared build` — compiles clean
2. `pnpm --filter backend typecheck` — passes clean
3. `pnpm --filter frontend typecheck` — passes clean
4. `pnpm dev` — both servers start; open two browser tabs
5. Tab 1: Create Game → copy game ID; Tab 2: Join with ID → both show the play area with 8 units near opposite corners
6. Tab 1 (player 1's turn): click a unit → move-range circle appears; click within range → unit moves, heading updates visually
7. Click outside move range → no move sent
8. Click End Turn → Tab 2 becomes the active player

---

## Decisions

- **Scale**: 2 px/m fixed for now (400m × 400m → 800×800 canvas). Pan/zoom deferred to a future milestone.
- **No terrain**: play area is a plain open field in this iteration.
- **Attack interaction**: deferred to a later milestone — only movement is in scope here.
