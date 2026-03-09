import { Server, Socket } from "socket.io";
import { ActionSchema, applyAction, validateAction, checkWinner } from "@battleforge/shared";
import { getRoom } from "./rooms";

export function registerHandlers(io: Server, socket: Socket, playerId: string) {
  socket.on("submit-action", (data: unknown) => {
    const parsed = ActionSchema.safeParse(data);
    if (!parsed.success) {
      socket.emit("error", { message: "Invalid action" });
      return;
    }

    const action = parsed.data;
    const roomId = [...socket.rooms].find((r) => r !== socket.id);
    if (!roomId) return;

    const room = getRoom(roomId);
    if (!room?.state) return;

    const error = validateAction(room.state, action, playerId);
    if (error) {
      socket.emit("error", { message: error });
      return;
    }

    room.state = applyAction(room.state, action);
    io.to(roomId).emit("game-state", room.state);

    const winner = checkWinner(room.state);
    if (winner) {
      io.to(roomId).emit("game-over", { winner });
    } else if (action.type === "end-turn") {
      io.to(roomId).emit("turn-start", { currentPlayer: room.state.currentPlayer });
    }
  });
}
