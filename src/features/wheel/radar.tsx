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

export type WheelRadarAxis = {
  id: string;
  name: string;
  today: number | null;
  oneYear: number | null;
  fiveYears: number | null;
};

type WheelRadarProps = {
  axes: WheelRadarAxis[];
  /**
   * Mini drops the spoke labels and the legend. At dashboard size the text
   * would be unreadable, and the shape alone is the point. The sr-only table
   * still carries every score.
   */
  variant?: "full" | "mini";
};

const TODAY = "#1f4e79";
const YEAR = "#6b93b8";
const FIVE = "#aab8c4";

export function WheelRadar({ axes, variant = "full" }: WheelRadarProps) {
  const mini = variant === "mini";
  const count = axes.length;
  if (count === 0) {
    return null;
  }

  const todayPath = polygonPath(
    axes.map((axis) => axis.today),
    count,
  );
  const yearPath = polygonPath(
    axes.map((axis) => axis.oneYear),
    count,
  );
  const fivePath = polygonPath(
    axes.map((axis) => axis.fiveYears),
    count,
  );

  return (
    <figure className={mini ? "relative w-full max-w-full overflow-hidden" : "w-full"}>
      <svg
        viewBox={`0 0 ${RADAR_VIEW} ${RADAR_VIEW}`}
        className={
          mini
            ? "block h-auto w-full max-w-full"
            : "block h-auto w-full overflow-visible"
        }
        role="group"
        aria-label="Wheel"
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
          {fivePath ? (
            <path
              d={fivePath}
              fill="none"
              stroke={FIVE}
              strokeWidth="1.5"
              strokeDasharray="3 3"
              strokeLinejoin="round"
            />
          ) : null}
          {yearPath ? (
            <path
              d={yearPath}
              fill="none"
              stroke={YEAR}
              strokeWidth="2"
              strokeLinejoin="round"
            />
          ) : null}
          {todayPath ? (
            <path
              d={todayPath}
              fill={TODAY}
              fillOpacity="0.14"
              stroke={TODAY}
              strokeWidth="2"
              strokeLinejoin="round"
            />
          ) : null}
        </g>
        {(mini ? [] : axes).map((axis, index) => {
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
      {mini ? null : (
        <figcaption className="mt-2 flex flex-wrap gap-4 text-xs text-[#6b6357]">
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block w-3.5 border-t-2 border-solid border-[#1f4e79]" />
            Today
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block w-3.5 border-t-2 border-solid border-[#6b93b8]" />
            One year
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block w-3.5 border-t-2 border-dashed border-[#aab8c4]" />
            Five years
          </span>
        </figcaption>
      )}
      {mini ? null : (
        <table className="sr-only">
          <caption>Wheel scores</caption>
          <thead>
            <tr>
              <th>Spoke</th>
              <th>Today</th>
              <th>One year</th>
              <th>Five years</th>
            </tr>
          </thead>
          <tbody>
            {axes.map((axis) => (
              <tr key={axis.id}>
                <th scope="row">
                  <a href={`/spoke/${axis.id}`}>{axis.name}</a>
                </th>
                <td>{axis.today ?? "Not scored"}</td>
                <td>{axis.oneYear ?? "Not scored"}</td>
                <td>{axis.fiveYears ?? "Not scored"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </figure>
  );
}
