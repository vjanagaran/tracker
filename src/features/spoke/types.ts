import type { Enums } from "@/lib/database.types";

export type PlanStatus = Enums<"plan_status">;

export type ActionPlan = {
  id: string;
  description: string;
  challenge: string | null;
  status: PlanStatus;
  sortOrder: number;
};

export type FocusArea = {
  id: string;
  currentIssue: string;
  goal1y: string | null;
  goal5y: string | null;
  sortOrder: number;
  plans: ActionPlan[];
};

export type SpokeDetail = {
  id: string;
  name: string;
  wheelType: Enums<"wheel_type">;
  scoreNow: number | null;
  target1y: number | null;
  focusAreas: FocusArea[];
};

export const PLAN_STATUSES: PlanStatus[] = ["Active", "Completed", "Dropped"];
