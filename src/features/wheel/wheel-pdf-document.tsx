import type { CSSProperties } from "react";
import { WheelRadar, type WheelRadarAxis } from "./radar";
import { formatPlanTaskCount } from "./labels";
import {
  buildRows,
  sheetCellText,
  sheetScoreText,
} from "./wheel-sheet";
import type { ScoreTriple, WheelSheetSpoke } from "./types";

const page: CSSProperties = {
  width: 1400,
  boxSizing: "border-box",
  padding: 4,
  background: "#ffffff",
  color: "#25221e",
  fontFamily: "-apple-system, Segoe UI, Helvetica, Arial, sans-serif",
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "fixed",
};

const border = "1px solid #ddd6c8";

const th: CSSProperties = {
  border,
  padding: "6px 7px",
  background: "#f4f0ea",
  fontSize: 9,
  fontWeight: 600,
  color: "#5c564c",
  textAlign: "left",
};

const td: CSSProperties = {
  border,
  padding: "6px 7px",
  fontSize: 10,
  lineHeight: 1.35,
  color: "#25221e",
  verticalAlign: "top",
  wordWrap: "break-word",
};

type WheelPdfTableProps = {
  spokes: WheelSheetSpoke[];
  scores: Record<string, ScoreTriple>;
};

export function WheelPdfTable({ spokes, scores }: WheelPdfTableProps) {
  const rows = buildRows(spokes);

  return (
    <div style={page}>
      {rows.length === 0 ? (
        <p style={{ fontSize: 12, color: "#5c564c" }}>No spokes to show in this cycle.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...th, width: 36 }}>No.</th>
              <th style={{ ...th, width: 110 }}>Area</th>
              <th style={{ ...th, width: 44, textAlign: "center" }}>Now</th>
              <th style={{ ...th, width: 52, textAlign: "center" }}>1 year</th>
              <th style={{ ...th, width: 54, textAlign: "center" }}>5 years</th>
              <th style={th}>Current state</th>
              <th style={th}>1 year goal</th>
              <th style={th}>5 year goal</th>
              <th style={th}>Action plan</th>
              <th style={th}>Challenge</th>
              <th style={{ ...th, width: 52, textAlign: "right" }}>Tasks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const score = scores[row.spoke.id];
              return (
                <tr key={row.key}>
                  {row.showSpoke ? (
                    <>
                      <td rowSpan={row.spokeSpan} style={{ ...td, color: "#6e6b68" }}>
                        {row.index + 1}
                      </td>
                      <td rowSpan={row.spokeSpan} style={{ ...td, fontWeight: 600 }}>
                        {row.spoke.name}
                      </td>
                      <td
                        rowSpan={row.spokeSpan}
                        style={{ ...td, textAlign: "center" }}
                      >
                        {sheetScoreText(score?.scoreNow ?? null)}
                      </td>
                      <td
                        rowSpan={row.spokeSpan}
                        style={{ ...td, textAlign: "center" }}
                      >
                        {sheetScoreText(score?.target1y ?? null)}
                      </td>
                      <td
                        rowSpan={row.spokeSpan}
                        style={{ ...td, textAlign: "center" }}
                      >
                        {sheetScoreText(score?.target5y ?? null)}
                      </td>
                    </>
                  ) : null}
                  {row.showFocus ? (
                    <>
                      <td rowSpan={row.focusSpan} style={td}>
                        {sheetCellText(row.focus?.currentIssue)}
                      </td>
                      <td rowSpan={row.focusSpan} style={td}>
                        {sheetCellText(row.focus?.goal1y)}
                      </td>
                      <td rowSpan={row.focusSpan} style={td}>
                        {sheetCellText(row.focus?.goal5y)}
                      </td>
                    </>
                  ) : null}
                  <td style={td}>{sheetCellText(row.plan?.description)}</td>
                  <td style={td}>{sheetCellText(row.plan?.challenge)}</td>
                  <td style={{ ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {formatPlanTaskCount(
                      row.plan?.completedTasks ?? 0,
                      row.plan?.totalTasks ?? 0,
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

type WheelPdfChartProps = {
  axes: WheelRadarAxis[];
};

export function WheelPdfChart({ axes }: WheelPdfChartProps) {
  if (axes.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        ...page,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 48,
        minHeight: 640,
      }}
    >
      <div style={{ width: 640, flex: "0 0 640px" }}>
        <WheelRadar axes={axes} interactive={false} />
      </div>
      <table style={{ ...tableStyle, width: 360, tableLayout: "auto" }}>
        <thead>
          <tr>
            <th style={th}>Area</th>
            <th style={{ ...th, width: 88, textAlign: "center" }}>Current state</th>
            <th style={{ ...th, width: 72, textAlign: "center" }}>1 year</th>
            <th style={{ ...th, width: 72, textAlign: "center" }}>5 years</th>
          </tr>
        </thead>
        <tbody>
          {axes.map((axis) => (
            <tr key={axis.id}>
              <td style={{ ...td, fontWeight: 600 }}>{axis.name}</td>
              <td style={{ ...td, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
                {sheetScoreText(axis.today)}
              </td>
              <td style={{ ...td, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
                {sheetScoreText(axis.oneYear)}
              </td>
              <td style={{ ...td, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
                {sheetScoreText(axis.fiveYears)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
