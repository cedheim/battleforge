import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { createInitialState } from "@battleforge/shared";
import { createRoom, getRoom } from "./rooms";
import { registerHandlers } from "./handlers";

const app = express();
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] },
});

app.post("/api/games", (_req, res) => {
  const gameId = uuidv4();
  createRoom(gameId);
  res.json({ gameId });
});

app.post("/api/games/:id/join", (req, res) => {
  const room = getRoom(req.params.id);
  if (!room) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  if (room.players.length >= 2) {
    res.status(400).json({ error: "Game is full" });
    return;
  }
  const playerId = uuidv4();
  room.players.push(playerId);
  res.json({ playerId });
});

io.on("connection", (socket) => {
  const playerId = socket.handshake.auth.playerId as string;
  if (!playerId) {
    socket.disconnect();
    return;
  }

  socket.on("join-room", (roomId: string) => {
    const room = getRoom(roomId);
    if (!room || !room.players.includes(playerId)) {
      socket.emit("error", { message: "Cannot join room" });
      return;
    }

    socket.join(roomId);

    if (room.players.length === 2 && !room.state) {
      room.state = createInitialState([room.players[0], room.players[1]]);
      io.to(roomId).emit("game-state", room.state);
      io.to(roomId).emit("turn-start", { currentPlayer: room.state.currentPlayer });
    } else if (room.state) {
      socket.emit("game-state", room.state);
    }
  });

  registerHandlers(io, socket, playerId);
});

const PORT = process.env.PORT ?? 3000;
httpServer.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
