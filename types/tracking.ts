import { TrackerType } from '@/enums/TrackerType';

export type TrackerTypeOption = {
  value: TrackerType;
  label: string;
};

export interface TrackedItem {
  id: string;
  name: string;
  startedAt: string;
  type: TrackerType;
  notifiedMilestones?: number[];
  resetHistory?: ColdTurkeyResetEntry[];
}

export interface ColdTurkeyResetEntry {
  startedAt: string;
  resetAt: string;
}

export interface ColdTurkeyTrackedItem extends TrackedItem {
  type: TrackerType.ColdTurkey;
}

export type DosageUnit = 'mg' | 'g';

export interface DoseLogEntry {
  at: string; // ISO timestamp of intake
  value: number; // amount taken at that time
  unit: DosageUnit; // unit of the amount
  note?: string; // optional note entered by the user
}

export interface DoseDecreaseTrackedItem extends TrackedItem {
  type: TrackerType.SlowLoweringTheDosage;
  currentUsageValue: number;
  currentUsageUnit: DosageUnit;
  defaultDose?: number; // configured default amount for quick add
  doseLogs?: DoseLogEntry[]; // individual intakes; summed per day for totals
}

export type TrackerItem = ColdTurkeyTrackedItem | DoseDecreaseTrackedItem;
