"use client";

import { useRef, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveWheelPdf } from "./save-wheel-pdf";
import { wheelPdfFilename, wheelPdfSubtitle, wheelPdfTitle } from "./pdf-title";
import { WheelPdfChart, WheelPdfTable } from "./wheel-pdf-document";
import type { WheelRadarAxis } from "./radar";
import type { ScoreTriple, WheelKind, WheelSheetSpoke } from "./types";

type WheelPdfButtonProps = {
  ownerName: string;
  kind: WheelKind;
  period: string | null;
  spokes: WheelSheetSpoke[];
  scores: Record<string, ScoreTriple>;
  axes: WheelRadarAxis[];
  disabled?: boolean;
};

export function WheelPdfButton({
  ownerName,
  kind,
  period,
  spokes,
  scores,
  axes,
  disabled = false,
}: WheelPdfButtonProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const tableNode = tableRef.current;
      if (!tableNode) {
        throw new Error("missing pdf table");
      }
      const now = new Date();
      await saveWheelPdf({
        tableNode,
        chartNode: axes.length > 0 ? chartRef.current : null,
        filename: wheelPdfFilename(kind, period),
        title: wheelPdfTitle(ownerName, kind),
        subtitle: wheelPdfSubtitle(period, now),
      });
    } catch {
      toast.error("The PDF could not be prepared. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="min-h-11 px-4"
        disabled={disabled || busy}
        onClick={() => void download()}
      >
        <Download className="size-4" aria-hidden="true" />
        {busy ? "Preparing PDF" : "Download PDF"}
      </Button>
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: -10000,
          top: 0,
          width: 1400,
          pointerEvents: "none",
        }}
      >
        <div ref={tableRef}>
          <WheelPdfTable spokes={spokes} scores={scores} />
        </div>
        {axes.length > 0 ? (
          <div ref={chartRef}>
            <WheelPdfChart axes={axes} />
          </div>
        ) : null}
      </div>
    </>
  );
}
