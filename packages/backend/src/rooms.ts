import { GameState } from "@battleforge/shared";

export interface Room {
  id: string;
  players: string[];
  state: GameState | null;
}

const rooms = new Map<string, Room>();

export function createRoom(id: string): Room {
  const room: Room = { id, players: [], state: null };
  rooms.set(id, room);
  return room;
}

export function getRoom(id: string): Room | undefined {
  return rooms.get(id);
}

export function deleteRoom(id: string): void {
  rooms.delete(id);
}
