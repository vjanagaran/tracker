import { radarLabel } from "@/features/wheel/labels";
import {
  RADAR_CX,
  RADAR_CY,
  RADAR_R,
  RADAR_RINGS,
  RADAR_VIEW,
  axisAngle,
  labelPoint,
  polygonPath,
} from "@/features/wheel/radar-geometry";
import type { ComparisonAxis } from "@/features/wheel/types";

const EARLIER = "#aab8c4";
const LATER = "#1f4e79";

type ComparisonRadarProps = {
  axes: ComparisonAxis[];
  earlierLabel: string;
  laterLabel: string;
};

export function ComparisonRadar({
  axes,
  earlierLabel,
  laterLabel,
}: ComparisonRadarProps) {
  const count = axes.length;
  if (count === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        These cycles have no spokes to overlay yet.
      </p>
    );
  }

  const earlierPath = polygonPath(
    axes.map((axis) => axis.earlier),
    count,
  );
  const laterPath = polygonPath(
    axes.map((axis) => axis.later),
    count,
  );

  return (
    <figure className="w-full">
      <svg
        viewBox={`0 0 ${RADAR_VIEW} ${RADAR_VIEW}`}
        className="block h-auto w-full overflow-visible"
        role="group"
        aria-label={`Wheel overlay, ${earlierLabel} to ${laterLabel}`}
      >
        <g aria-hidden="true">
          {RADAR_RINGS.map((fraction) => (
            <circle
              key={fraction}
              cx={RADAR_CX}
              cy={RADAR_CY}
              r={RADAR_R * fraction}
              fill="none"
              stroke={fraction === 1 ? "#eae4dc" : "#f1ebe3"}
            />
          ))}
          {axes.map((axis, index) => {
            const angle = axisAngle(index, count);
            return (
              <line
                key={axis.id}
                x1={RADAR_CX}
                y1={RADAR_CY}
                x2={RADAR_CX + Math.cos(angle) * RADAR_R}
                y2={RADAR_CY + Math.sin(angle) * RADAR_R}
                stroke="#e6ded3"
              />
            );
          })}
          {earlierPath ? (
            <path
              d={earlierPath}
              fill="none"
              stroke={EARLIER}
              strokeWidth="1.5"
              strokeDasharray="3 3"
              strokeLinejoin="round"
            />
          ) : null}
          {laterPath ? (
            <path
              d={laterPath}
              fill={LATER}
              fillOpacity="0.13"
              stroke={LATER}
              strokeWidth="2"
              strokeLinejoin="round"
            />
          ) : null}
        </g>
        {axes.map((axis, index) => {
          const point = labelPoint(index, count);
          return (
            <a
              key={`${axis.id}-label`}
              href={`/spoke/${axis.id}`}
              className="cursor-pointer"
            >
              <title>{axis.name}</title>
              <circle cx={point.x} cy={point.y} r="22" fill="transparent" />
              <text
                x={point.x}
                y={point.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#6b6357"
                fontSize="10"
                fontFamily="-apple-system, Segoe UI, Arial, sans-serif"
              >
                {radarLabel(axis.name)}
              </text>
            </a>
          );
        })}
      </svg>
      <figcaption className="mt-3 flex flex-wrap gap-4 text-xs text-[#6b6357]">
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block w-3.5 border-t-2 border-dashed border-[#aab8c4]" />
          {earlierLabel}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block w-3.5 border-t-2 border-solid border-[#1f4e79]" />
          {laterLabel}
        </span>
      </figcaption>
    </figure>
  );
}
