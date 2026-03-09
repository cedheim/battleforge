import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../store";

export default function Lobby() {
  const [joinId, setJoinId] = useState("");
  const navigate = useNavigate();
  const { setGameId, setPlayerId } = useGameStore();

  async function createGame() {
    const res = await fetch("/api/games", { method: "POST" });
    const { gameId } = await res.json();
    const joinRes = await fetch(`/api/games/${gameId}/join`, { method: "POST" });
    const { playerId } = await joinRes.json();
    setGameId(gameId);
    setPlayerId(playerId);
    navigate(`/game/${gameId}`);
  }

  async function joinGame() {
    const res = await fetch(`/api/games/${joinId}/join`, { method: "POST" });
    if (!res.ok) {
      alert("Could not join game");
      return;
    }
    const { playerId } = await res.json();
    setGameId(joinId);
    setPlayerId(playerId);
    navigate(`/game/${joinId}`);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-gray-900 text-white">
      <h1 className="text-5xl font-bold tracking-wide">Battleforge</h1>
      <div className="flex flex-col gap-4 w-72">
        <button
          onClick={createGame}
          className="bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold"
        >
          Create Game
        </button>
        <div className="flex gap-2">
          <input
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            placeholder="Game ID"
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2"
          />
          <button
            onClick={joinGame}
            className="bg-green-600 hover:bg-green-700 px-4 rounded-lg font-semibold"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
}
