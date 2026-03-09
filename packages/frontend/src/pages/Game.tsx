import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { Stage, Layer, Rect, Circle } from "react-konva";
import Konva from "konva";
import { GameState, UNIT_STATS } from "@battleforge/shared";
import { useGameStore } from "../store";
import UnitLayer from "../components/UnitLayer";

// Pixels per meter
const SCALE = 2;

export default function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const {
    playerId,
    gameState,
    selectedUnitId,
    moveRangeCircle,
    setGameState,
    setSocket,
    setSelectedUnitId,
    setMoveRangeCircle,
    submitAction,
  } = useGameStore();

  const playerIdsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!playerId || !gameId) return;

    const socket = io({ auth: { playerId } });
    setSocket(socket);

    socket.on("connect", () => {
      socket.emit("join-room", gameId);
    });

    socket.on("game-state", (state: GameState) => {
      setGameState(state);
      // Track unique player order from state
      const ids = [...new Set(state.units.map((u) => u.owner))];
      if (playerIdsRef.current.length === 0) playerIdsRef.current = ids;
    });

    socket.on("game-over", ({ winner }: { winner: string }) => {
      alert(winner === playerId ? "You win!" : winner === "draw" ? "Draw!" : "You lose!");
    });

    return () => {
      socket.disconnect();
    };
  }, [playerId, gameId, setGameState, setSocket]);

  // Update move range circle whenever selected unit changes
  useEffect(() => {
    if (!selectedUnitId || !gameState) {
      setMoveRangeCircle(null);
      return;
    }
    const unit = gameState.units.find((u) => u.id === selectedUnitId);
    if (!unit) { setMoveRangeCircle(null); return; }
    const stats = UNIT_STATS[unit.type];
    setMoveRangeCircle({ x: unit.x, y: unit.y, radius: stats.moveRange });
  }, [selectedUnitId, gameState, setMoveRangeCircle]);

  function handleStageClick(e: Konva.KonvaEventObject<MouseEvent>) {
    if (!gameState || !selectedUnitId || !playerId) return;
    // Only the active player can move
    if (gameState.currentPlayer !== playerId) return;

    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Convert pixels → meters
    const toX = pos.x / SCALE;
    const toY = pos.y / SCALE;

    const unit = gameState.units.find((u) => u.id === selectedUnitId);
    if (!unit) return;

    const dx = toX - unit.x;
    const dy = toY - unit.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const stats = UNIT_STATS[unit.type];

    if (dist <= stats.moveRange) {
      submitAction({ type: "move", unitId: selectedUnitId, to: { x: toX, y: toY } });
      setSelectedUnitId(null);
    } else {
      // Click outside range — deselect
      setSelectedUnitId(null);
    }
  }

  const isMyTurn = !!playerId && gameState?.currentPlayer === playerId;

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>Waiting for opponent...</p>
      </div>
    );
  }

  const stageW = gameState.playArea.width * SCALE;
  const stageH = gameState.playArea.height * SCALE;
  const playerIds = playerIdsRef.current.length
    ? playerIdsRef.current
    : [...new Set(gameState.units.map((u) => u.owner))];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 gap-4">
      {/* HUD */}
      <div className="flex items-center gap-6 text-white">
        <span>Turn {gameState.turn}</span>
        <span>{isMyTurn ? "Your turn" : "Opponent's turn"}</span>
        {isMyTurn && (
          <button
            className="bg-blue-600 hover:bg-blue-700 px-4 py-1 rounded font-semibold"
            onClick={() => submitAction({ type: "end-turn" })}
          >
            End Turn
          </button>
        )}
      </div>

      {/* Canvas */}
      <Stage
        width={stageW}
        height={stageH}
        onClick={handleStageClick}
        style={{ border: "2px solid #555", cursor: selectedUnitId ? "crosshair" : "default" }}
      >
        {/* Background */}
        <Layer>
          <Rect x={0} y={0} width={stageW} height={stageH} fill="#3d6b45" />
        </Layer>

        {/* Move range indicator */}
        {moveRangeCircle && (
          <Layer listening={false}>
            <Circle
              x={moveRangeCircle.x * SCALE}
              y={moveRangeCircle.y * SCALE}
              radius={moveRangeCircle.radius * SCALE}
              stroke="#FFD700"
              strokeWidth={1}
              dash={[6, 4]}
              fill="rgba(255,215,0,0.05)"
            />
          </Layer>
        )}

        {/* Units */}
        <Layer>
          <UnitLayer units={gameState.units} scale={SCALE} playerIds={playerIds} />
        </Layer>
      </Stage>
    </div>
  );
}
