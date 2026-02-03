import {
  COLD_TURKEY_MILESTONES,
  type ColdTurkeyMilestone,
} from '@/constants/coldTurkeyMilestones';
import { TrackerType } from '@/enums/TrackerType';
import type { ColdTurkeyResetEntry, DoseDecreaseTrackedItem, DosageUnit } from '@/types/tracking';

type TimeUnit = {
  label: string;
  shortLabel: string;
  durationMs: number;
};

const TIME_UNITS: TimeUnit[] = [
  { label: 'year', shortLabel: 'y', durationMs: 1000 * 60 * 60 * 24 * 365 },
  { label: 'month', shortLabel: 'mo', durationMs: 1000 * 60 * 60 * 24 * 30 },
  { label: 'week', shortLabel: 'w', durationMs: 1000 * 60 * 60 * 24 * 7 },
  { label: 'day', shortLabel: 'd', durationMs: 1000 * 60 * 60 * 24 },
  { label: 'hour', shortLabel: 'h', durationMs: 1000 * 60 * 60 },
  { label: 'minute', shortLabel: 'm', durationMs: 1000 * 60 },
  { label: 'second', shortLabel: 's', durationMs: 1000 },
];

export const getTrackerIcon = (type: TrackerType) => {
  if (type === TrackerType.SlowLoweringTheDosage) {
    return { name: 'arrow-trend-down' as const, color: '#fb923c' };
  }

  return { name: 'hand-back-fist' as const, color: '#34d399' };
};

const convertAmount = (value: number, from: DosageUnit, to: DosageUnit): number => {
  if (from === to) return value;
  // mg <-> g conversion
  return from === 'mg' && to === 'g' ? value / 1000 : value * 1000;
};

export const getTodaysDoseTotal = (
  item: DoseDecreaseTrackedItem
): { value: number; unit: DosageUnit } => {
  const logs = item.doseLogs ?? [];
  if (logs.length === 0) return { value: 0, unit: item.currentUsageUnit };

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  // Accumulate in mg as a base unit
  let totalMg = 0;
  for (const log of logs) {
    const at = new Date(log.at);
    if (Number.isNaN(at.getTime())) continue;
    if (at >= startOfDay && at < endOfDay) {
      const asMg = convertAmount(log.value, log.unit, 'mg');
      totalMg += asMg;
    }
  }

  // Convert to the tracker's display unit
  const displayUnit = item.currentUsageUnit;
  const value = convertAmount(totalMg, 'mg', displayUnit);
  return { value, unit: displayUnit };
};

export type ColdTurkeyStreakTarget = ColdTurkeyResetEntry & {
  durationMs: number;
};

export type ColdTurkeyStreakTargets = {
  last?: ColdTurkeyStreakTarget;
  record?: ColdTurkeyStreakTarget;
};

export const getColdTurkeyStreakTargets = (resetHistory?: ColdTurkeyResetEntry[]): ColdTurkeyStreakTargets => {
  if (!resetHistory || resetHistory.length === 0) {
    return {};
  }

  const entries = resetHistory
    .map((entry) => {
      const started = new Date(entry.startedAt).getTime();
      const reset = new Date(entry.resetAt).getTime();
      if (!Number.isFinite(started) || !Number.isFinite(reset) || reset <= started) {
        return null;
      }
      return { ...entry, durationMs: reset - started };
    })
    .filter((entry): entry is ColdTurkeyStreakTarget => entry !== null)
    .sort((a, b) => new Date(a.resetAt).getTime() - new Date(b.resetAt).getTime());

  if (entries.length === 0) {
    return {};
  }

  const last = entries[entries.length - 1];
  let record = entries[0];
  for (const entry of entries) {
    if (entry.durationMs > record.durationMs) {
      record = entry;
    }
  }

  return { last, record };
};

export type TrackingResetStats = {
  totalTrackedMs: number | null;
  resetCount: number;
  averageBetweenResetsMs: number | null;
  maxBetweenResetsMs: number | null;
};

export const getTrackingResetStats = (
  startedAt: string,
  resetHistory?: ColdTurkeyResetEntry[]
): TrackingResetStats => {
  const now = Date.now();
  const startedMs = new Date(startedAt).getTime();
  const hasStarted = Number.isFinite(startedMs);

  const validResets = (resetHistory ?? [])
    .map((entry) => {
      const start = new Date(entry.startedAt).getTime();
      const reset = new Date(entry.resetAt).getTime();
      if (!Number.isFinite(start) || !Number.isFinite(reset) || reset < start) {
        return null;
      }
      return { start, reset };
    })
    .filter((entry): entry is { start: number; reset: number } => entry !== null);

  const intervals: number[] = validResets.map((entry) => entry.reset - entry.start);
  if (hasStarted) {
    intervals.push(Math.max(0, now - startedMs));
  }

  const resetCount = validResets.length;
  const totalTrackedMs = (() => {
    let earliest = hasStarted ? startedMs : null;
    for (const entry of validResets) {
      if (earliest === null || entry.start < earliest) {
        earliest = entry.start;
      }
    }
    return earliest === null ? null : Math.max(0, now - earliest);
  })();

  if (intervals.length === 0) {
    return {
      totalTrackedMs,
      resetCount,
      averageBetweenResetsMs: null,
      maxBetweenResetsMs: null,
    };
  }

  const sum = intervals.reduce((acc, value) => acc + value, 0);
  const averageBetweenResetsMs = Math.round(sum / intervals.length);
  const maxBetweenResetsMs = Math.max(...intervals);

  return {
    totalTrackedMs,
    resetCount,
    averageBetweenResetsMs,
    maxBetweenResetsMs,
  };
};

export type ColdTurkeyProgress = {
  achieved: ColdTurkeyMilestone[];
  elapsedMs: number;
  next: ColdTurkeyMilestone | null;
  progressToNext: number;
  previousDurationMs: number;
};

export const getColdTurkeyProgress = (startedAt: string): ColdTurkeyProgress => {
  const now = Date.now();
  const started = new Date(startedAt).getTime();
  const elapsedMs = Math.max(0, now - started);

  const achieved = COLD_TURKEY_MILESTONES.filter((milestone) => elapsedMs >= milestone.durationMs);
  const next = COLD_TURKEY_MILESTONES.find((milestone) => elapsedMs < milestone.durationMs) ?? null;
  const previousDurationMs = achieved.length ? achieved[achieved.length - 1].durationMs : 0;

  const progressToNext = next ? Math.min(1, Math.max(0, elapsedMs / next.durationMs)) : 1;

  return {
    achieved,
    elapsedMs,
    next,
    progressToNext,
    previousDurationMs,
  };
};

export const formatElapsedDurationLabel = (elapsedMs: number, parts: number = 2): string => {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) {
    return 'Less than a second';
  }

  const breakdown = getElapsedBreakdown(elapsedMs, parts);
  if (!breakdown.length) {
    return 'Less than a second';
  }

  return breakdown.map((entry) => `${entry.value} ${entry.unit}`).join(' ');
};

export type ElapsedBreakdownEntry = {
  value: number;
  unit: string;
};

export const getElapsedBreakdown = (
    elapsedMs: number,
    parts: number = 3
): ElapsedBreakdownEntry[] => {
    const result: ElapsedBreakdownEntry[] = [];
    let remainder = Math.max(0, elapsedMs);
    let lastAddedIndex = -1; // index into TIME_UNITS for the last non-zero unit we added

    for (let i = 0; i < TIME_UNITS.length; i++) {
        if (result.length >= parts) break;
        const unit = TIME_UNITS[i];
        const count = Math.floor(remainder / unit.durationMs);
        if (count > 0) {
            result.push({
                value: count,
                unit: count === 1 ? unit.label : `${unit.label}s`,
            });
            remainder -= count * unit.durationMs;
            lastAddedIndex = i;
        }
    }

    // If everything was < 1s, show a single "0 seconds" so UI isn't empty
    if (result.length === 0) {
        const sec = TIME_UNITS[TIME_UNITS.length - 1]; // seconds
        const count = Math.floor(remainder / sec.durationMs); // 0 for <1s
        result.push({ value: count, unit: 'seconds' });
    } else if (result.length < parts) {
        // Also show the next smaller unit even if it's 0 (e.g., "5 minutes 0 seconds")
        const nextIndex = lastAddedIndex + 1;
        if (nextIndex > lastAddedIndex && nextIndex < TIME_UNITS.length) {
            const nextUnit = TIME_UNITS[nextIndex];
            const nextCount = Math.floor(remainder / nextUnit.durationMs); // likely 0
            result.push({
                value: nextCount,
                unit: nextCount === 1 ? nextUnit.label : `${nextUnit.label}s`,
            });
        }
    }

    return result;
};
