import { z } from "zod";

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
  widthM: number;
  heightM: number;
  hp: number;
  moveRange: number;
  attackRange: number;
  attackDamage: number;
}> = {
  infantry: { widthM: 4,  heightM: 8,  hp: 10, moveRange: 80,  attackRange: 2,   attackDamage: 3  },
  archer:   { widthM: 4,  heightM: 8,  hp: 7,  moveRange: 60,  attackRange: 60,  attackDamage: 4  },
  cavalry:  { widthM: 6,  heightM: 10, hp: 12, moveRange: 150, attackRange: 3,   attackDamage: 5  },
  cannon:   { widthM: 8,  heightM: 12, hp: 8,  moveRange: 20,  attackRange: 200, attackDamage: 10 },
};
