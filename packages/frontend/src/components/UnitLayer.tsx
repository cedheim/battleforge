import { Group, Rect, Text } from "react-konva";
import { Unit, UNIT_STATS } from "@battleforge/shared";
import { useGameStore } from "../store";

const UNIT_COLORS: Record<string, string> = {
  infantry: "#e63946",
  archer:   "#457b9d",
  cavalry:  "#f4a261",
  cannon:   "#6d6875",
};

// Player index → color tint for the selection ring
const OWNER_STROKE: Record<number, string> = {
  0: "#00ff99",
  1: "#ff4466",
};

interface Props {
  units: Unit[];
  scale: number; // pixels per meter
  playerIds: string[];
}

export default function UnitLayer({ units, scale, playerIds }: Props) {
  const { selectedUnitId, setSelectedUnitId } = useGameStore();

  return (
    <>
      {units.map((unit) => {
        const isSelected = unit.id === selectedUnitId;
        const stats = UNIT_STATS[unit.type];
        const w = stats.widthM * scale;
        const h = stats.heightM * scale;
        const cx = unit.x * scale;
        const cy = unit.y * scale;
        const ownerIdx = playerIds.indexOf(unit.owner);

        return (
          // Group is centered on (cx, cy) and rotated by heading
          <Group
            key={unit.id}
            x={cx}
            y={cy}
            rotation={unit.heading}
            onClick={(e) => {
              e.cancelBubble = true;
              setSelectedUnitId(isSelected ? null : unit.id);
            }}
          >
            <Rect
              x={-w / 2}
              y={-h / 2}
              width={w}
              height={h}
              fill={UNIT_COLORS[unit.type]}
              stroke={isSelected ? "#FFD700" : (OWNER_STROKE[ownerIdx] ?? "#111")}
              strokeWidth={isSelected ? 3 : 1}
              cornerRadius={3}
            />
            {/* HP label — counter-rotated so text is always upright */}
            <Text
              x={-w / 2}
              y={-6}
              width={w}
              align="center"
              text={`${unit.hp}hp`}
              fontSize={Math.max(9, scale * 0.8)}
              fill="white"
              listening={false}
              rotation={-unit.heading}
            />
          </Group>
        );
      })}
    </>
  );
}
