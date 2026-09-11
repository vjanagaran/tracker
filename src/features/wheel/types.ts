export type ScoreTriple = {
  scoreNow: number | null;
  target1y: number | null;
  target5y: number | null;
};

export type WheelSpoke = {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  isPredefined: boolean;
};

export type WheelCycle = {
  id: string;
  period: string;
};

export type WheelSlug = "life" | "business";
export type WheelKind = "WOL" | "WOB";

export type ComparisonAxis = {
  id: string;
  name: string;
  earlier: number | null;
  later: number | null;
};

export type CycleComparison = {
  earlier: WheelCycle;
  later: WheelCycle;
  axes: ComparisonAxis[];
};
