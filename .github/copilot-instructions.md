# Battleforge — Copilot Instructions

## Project Overview

Battleforge is a turn-based strategy game with simple 2D top-down graphics. It is a TypeScript monorepo with three packages:

- `packages/shared` — shared game types, Zod schemas, and pure game logic
- `packages/backend` — Node.js + Express + Socket.IO game server
- `packages/frontend` — React + Vite + react-konva client

---

## Game Design

### Play Area

- The play area is a **continuous 2D space** — it is **not grid-based**.
- All distances are measured in **meters**.
- Play areas can vary in size (e.g. 200m × 200m for a small skirmish, up to 1000m × 1000m for large battles).
- The frontend renders the play area as a top-down canvas using react-konva, with a camera/viewport that can pan and zoom.

### Army & Units

- Each player commands an **army** made up of one or more **units**.
- Units are represented on the play area as **rectangles** (reflecting their physical footprint).
  - Different unit types have different rectangle dimensions (width × height in meters).
  - Each unit type may have an optional **icon** rendered inside its rectangle.
- Every unit has:
  - **Position** — a point `{ x: number, y: number }` in play-area meters, measured at the rectangle's center.
  - **Heading** — an angle in degrees (0° = facing up / north, clockwise positive). The rectangle is rendered rotated to match the heading.
  - **HP** — current hit points.
  - **Owner** — the player ID who controls this unit.
  - **Type** — determines stats, rectangle size, and icon.
  - **Moved** — whether the unit has already acted this turn.

### Unit Types (initial set)

| Type | Width | Height | HP | Move Range | Attack Range | Attack Damage |
|------|-------|--------|----|------------|--------------|---------------|
| `infantry` | 4m | 8m | 10 | 80m | 2m | 3 |
| `archer` | 4m | 8m | 7 | 60m | 60m | 4 |
| `cavalry` | 6m | 10m | 12 | 150m | 3m | 5 |
| `cannon` | 8m | 12m | 8 | 20m | 200m | 10 |

### Turn Structure

1. **Active player** selects a unit.
2. Player may **move** the unit up to its move range (straight-line distance in meters). The unit's heading updates to face its direction of travel.
3. Player may **attack** a target unit within attack range (measured center to center).
4. Each unit may move and attack once per turn.
5. Player clicks **End Turn** to pass to the opponent.
6. Game ends when one player has no units remaining — that player loses.

### Coordinate System

- Origin `(0, 0)` is the **top-left** corner of the play area.
- X increases to the right, Y increases downward (matches canvas conventions).
- Heading `0°` = facing up (negative Y direction), increasing clockwise.

---

## Monorepo Structure

```
battleforge/
├── packages/
│   ├── shared/
│   │   ├── src/
│   │   │   ├── types.ts        # Zod schemas and inferred TS types
│   │   │   └── logic.ts        # Pure game logic: applyAction(), validateAction()
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── backend/
│   │   ├── src/
│   │   │   ├── index.ts        # Express + Socket.IO entry point
│   │   │   ├── rooms.ts        # In-memory game room manager
│   │   │   └── handlers.ts     # Socket event handlers
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── frontend/
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── pages/
│       │   │   ├── Lobby.tsx
│       │   │   └── Game.tsx
│       │   ├── components/
│       │   │   ├── TileMap.tsx  # react-konva tile grid
│       │   │   └── UnitLayer.tsx
│       │   └── store.ts        # Zustand client state
│       ├── vite.config.ts
│       ├── tsconfig.json
│       └── package.json
├── tsconfig.base.json
└── package.json                # pnpm workspace root
```

---

## Tech Stack

| Layer | Libraries |
|-------|-----------|
| Monorepo | pnpm workspaces |
| Language | TypeScript (strict) |
| Shared | `zod` |
| Frontend | `vite`, `react`, `react-dom`, `react-konva`, `konva`, `zustand`, `socket.io-client`, `react-router-dom`, `tailwindcss` |
| Backend | `express`, `socket.io`, `uuid`, `zod` |
| Tooling | `eslint`, `prettier`, `concurrently` |

---

## Build & Development Commands

All commands are run from the **repo root** unless otherwise noted.

### Install dependencies

```bash
pnpm install
```

### Run all packages in development mode

```bash
pnpm dev
```

This uses `concurrently` to start both the frontend (Vite, port 5173) and backend (port 3000) simultaneously.

### Run a single package in dev mode

```bash
pnpm --filter frontend dev
pnpm --filter backend dev
pnpm --filter shared dev    # tsc --watch
```

### Build all packages (in dependency order)

```bash
pnpm build
```

Build order is: `shared` → `backend` → `frontend`. This is defined in the root `package.json` build script.

### Build a specific package

```bash
pnpm --filter shared build
pnpm --filter backend build
pnpm --filter frontend build
```

### Type-check all packages

```bash
pnpm typecheck
```

### Lint

```bash
pnpm lint
```

---

## Architecture: Frontend ↔ Backend Communication

The backend is **authoritative** — it holds the real game state, validates all actions, applies game logic, and broadcasts state updates.

### REST (HTTP)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/games` | Create a new game room, returns `gameId` |
| `POST` | `/games/:id/join` | Join an existing game room |

### WebSocket (Socket.IO)

| Direction | Event | Payload |
|-----------|-------|---------|
| client → server | `submit-action` | `Action` (move, attack, end-turn) |
| server → client | `game-state` | Full `GameState` after each action |
| server → client | `turn-start` | Notify player their turn has begun |
| server → client | `game-over` | Final result |

---

## Shared Types (defined via Zod in `packages/shared`)

All types are defined as Zod schemas and exported as inferred TypeScript types. Both frontend and backend import from `@battleforge/shared`.

```typescript
// Play area dimensions in meters
export const PlayAreaSchema = z.object({
  width: z.number(),
  height: z.number(),
});

export const UnitTypeSchema = z.enum(["infantry", "archer", "cavalry", "cannon"]);

export const UnitSchema = z.object({
  id: z.string(),
  owner: z.string(),
  type: UnitTypeSchema,
  // Position in meters (center of the unit rectangle)
  x: z.number(),
  y: z.number(),
  // Heading in degrees: 0° = north (up), clockwise positive
  heading: z.number(),
  hp: z.number(),
  moved: z.boolean(),
});

export const GameStateSchema = z.object({
  turn: z.number(),
  currentPlayer: z.string(),
  playArea: PlayAreaSchema,
  units: z.array(UnitSchema),
});

export const ActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("move"),
    unitId: z.string(),
    // Destination in meters
    to: z.object({ x: z.number(), y: z.number() }),
  }),
  z.object({
    type: z.literal("attack"),
    unitId: z.string(),
    targetId: z.string(),
  }),
  z.object({ type: z.literal("end-turn") }),
]);

export type PlayArea = z.infer<typeof PlayAreaSchema>;
export type UnitType = z.infer<typeof UnitTypeSchema>;
export type Unit = z.infer<typeof UnitSchema>;
export type GameState = z.infer<typeof GameStateSchema>;
export type Action = z.infer<typeof ActionSchema>;

// Per-type stats used by game logic
export const UNIT_STATS: Record<UnitType, {
  widthM: number;   // rectangle width in meters
  heightM: number;  // rectangle height in meters
  hp: number;
  moveRange: number;  // meters
  attackRange: number; // meters (center to center)
  attackDamage: number;
}> = {
  infantry: { widthM: 4, heightM: 8,  hp: 10, moveRange: 80,  attackRange: 2,   attackDamage: 3  },
  archer:   { widthM: 4, heightM: 8,  hp: 7,  moveRange: 60,  attackRange: 60,  attackDamage: 4  },
  cavalry:  { widthM: 6, heightM: 10, hp: 12, moveRange: 150, attackRange: 3,   attackDamage: 5  },
  cannon:   { widthM: 8, heightM: 12, hp: 8,  moveRange: 20,  attackRange: 200, attackDamage: 10 },
};
```

---

## Coding Conventions

- Use strict TypeScript (`"strict": true` in all tsconfigs, extending `tsconfig.base.json`).
- Game logic lives exclusively in `packages/shared/src/logic.ts` as **pure functions** — no side effects, no I/O. This makes it testable in isolation.
- The backend applies logic by calling `applyAction(state, action)` from `shared` and persists the result in-memory.
- The frontend never modifies game state directly — it only renders the `GameState` received from the server via Socket.IO.
- Canvas rendering uses `react-konva`. Tiles and units are React components. No raw canvas manipulation.
- Client UI state (selected unit, hovering, etc.) lives in a Zustand store (`packages/frontend/src/store.ts`) and is kept separate from server game state.

---

## Vite Proxy (Development)

To avoid CORS issues in development, Vite proxies API and Socket.IO requests to the backend. Configure in `packages/frontend/vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    proxy: {
      "/api": "http://localhost:3000",
      "/socket.io": { target: "http://localhost:3000", ws: true },
    },
  },
});
```
