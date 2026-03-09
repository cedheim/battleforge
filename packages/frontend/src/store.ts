import { create } from "zustand";
import { Socket } from "socket.io-client";
import { GameState, Action } from "@battleforge/shared";

interface GameStore {
  gameId: string | null;
  playerId: string | null;
  gameState: GameState | null;
  selectedUnitId: string | null;
  socket: Socket | null;
  // Meters-space circle shown when a unit is selected
  moveRangeCircle: { x: number; y: number; radius: number } | null;
  setGameId: (id: string) => void;
  setPlayerId: (id: string) => void;
  setGameState: (state: GameState) => void;
  setSelectedUnitId: (id: string | null) => void;
  setSocket: (socket: Socket) => void;
  setMoveRangeCircle: (circle: { x: number; y: number; radius: number } | null) => void;
  submitAction: (action: Action) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameId: null,
  playerId: null,
  gameState: null,
  selectedUnitId: null,
  socket: null,
  moveRangeCircle: null,
  setGameId: (gameId) => set({ gameId }),
  setPlayerId: (playerId) => set({ playerId }),
  setGameState: (gameState) => set({ gameState }),
  setSelectedUnitId: (selectedUnitId) => set({ selectedUnitId }),
  setSocket: (socket) => set({ socket }),
  setMoveRangeCircle: (moveRangeCircle) => set({ moveRangeCircle }),
  submitAction: (action) => {
    const { socket } = get();
    socket?.emit("submit-action", action);
  },
}));
