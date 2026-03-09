import { GameState, Action, UNIT_STATS } from "./types";

const PLAY_AREA_WIDTH = 400;
const PLAY_AREA_HEIGHT = 400;

export function createInitialState(playerIds: [string, string]): GameState {
  const playArea = { width: PLAY_AREA_WIDTH, height: PLAY_AREA_HEIGHT };

  const units = [
    // Player 1 — top-left corner area, facing south (180°)
    { id: "u1", owner: playerIds[0], type: "infantry" as const, x: 40,  y: 40,  heading: 180, hp: UNIT_STATS.infantry.hp, moved: false },
    { id: "u2", owner: playerIds[0], type: "archer"   as const, x: 60,  y: 40,  heading: 180, hp: UNIT_STATS.archer.hp,   moved: false },
    { id: "u3", owner: playerIds[0], type: "cavalry"  as const, x: 40,  y: 60,  heading: 180, hp: UNIT_STATS.cavalry.hp,  moved: false },
    { id: "u4", owner: playerIds[0], type: "cannon"   as const, x: 60,  y: 60,  heading: 180, hp: UNIT_STATS.cannon.hp,   moved: false },
    // Player 2 — bottom-right corner area, facing north (0°)
    { id: "u5", owner: playerIds[1], type: "infantry" as const, x: 360, y: 360, heading: 0,   hp: UNIT_STATS.infantry.hp, moved: false },
    { id: "u6", owner: playerIds[1], type: "archer"   as const, x: 340, y: 360, heading: 0,   hp: UNIT_STATS.archer.hp,   moved: false },
    { id: "u7", owner: playerIds[1], type: "cavalry"  as const, x: 360, y: 340, heading: 0,   hp: UNIT_STATS.cavalry.hp,  moved: false },
    { id: "u8", owner: playerIds[1], type: "cannon"   as const, x: 340, y: 340, heading: 0,   hp: UNIT_STATS.cannon.hp,   moved: false },
  ];

  return { turn: 1, currentPlayer: playerIds[0], playArea, units };
}

export function validateAction(state: GameState, action: Action, playerId: string): string | null {
  if (state.currentPlayer !== playerId) return "Not your turn";
  if (action.type === "end-turn") return null;

  const unit = state.units.find((u) => u.id === action.unitId);
  if (!unit) return "Unit not found";
  if (unit.owner !== playerId) return "Not your unit";

  if (action.type === "move") {
    if (unit.moved) return "Unit already moved";
    const stats = UNIT_STATS[unit.type];
    const dx = action.to.x - unit.x;
    const dy = action.to.y - unit.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > stats.moveRange) return "Out of move range";
    if (action.to.x < 0 || action.to.y < 0 || action.to.x > state.playArea.width || action.to.y > state.playArea.height) {
      return "Destination outside play area";
    }
  }

  if (action.type === "attack") {
    const target = state.units.find((u) => u.id === action.targetId);
    if (!target) return "Target not found";
    if (target.owner === playerId) return "Cannot attack own unit";
    const stats = UNIT_STATS[unit.type];
    const dx = target.x - unit.x;
    const dy = target.y - unit.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > stats.attackRange) return "Target out of range";
  }

  return null;
}

export function applyAction(state: GameState, action: Action): GameState {
  if (action.type === "end-turn") {
    const players = [...new Set(state.units.map((u) => u.owner))];
    const idx = players.indexOf(state.currentPlayer);
    const nextPlayer = players[(idx + 1) % players.length];
    const units = state.units.map((u) => ({ ...u, moved: false }));
    return { ...state, turn: state.turn + 1, currentPlayer: nextPlayer, units };
  }

  if (action.type === "move") {
    const units = state.units.map((u) => {
      if (u.id !== action.unitId) return u;
      const dx = action.to.x - u.x;
      const dy = action.to.y - u.y;
      // 0° = north (up), clockwise positive
      const heading = Math.atan2(dx, -dy) * (180 / Math.PI);
      return { ...u, x: action.to.x, y: action.to.y, heading, moved: true };
    });
    return { ...state, units };
  }

  if (action.type === "attack") {
    const attacker = state.units.find((u) => u.id === action.unitId)!;
    const stats = UNIT_STATS[attacker.type];
    const units = state.units
      .map((u) => (u.id === action.targetId ? { ...u, hp: u.hp - stats.attackDamage } : u))
      .filter((u) => u.hp > 0);
    return { ...state, units };
  }

  return state;
}

export function checkWinner(state: GameState): string | null {
  const players = [...new Set(state.units.map((u) => u.owner))];
  if (players.length === 1) return players[0];
  if (players.length === 0) return "draw";
  return null;
}
