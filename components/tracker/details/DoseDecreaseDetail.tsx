import { FontAwesome6 } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/Themed';
import { hexToRgba, M3Colors, M3Radius, M3Spacing, M3Typography } from '@/constants/theme';
import { useTrackedItems } from '@/contexts/TrackedItemsContext';
import { DosageUnit, DoseDecreaseTrackedItem } from '@/types/tracking';
import { calculateDaysTracked, formatDateForDisplay } from '@/utils/date';
import { getTrackerIcon } from '@/utils/tracker';

import { TrackerDetailTemplate } from './TrackerDetailTemplate';
import { TrackingStatsCard } from './TrackingStatsCard';

type DoseDecreaseDetailProps = {
  item: DoseDecreaseTrackedItem;
  nameInput: string;
  onNameChange: (value: string) => void;
  startDateDisplay: string;
  disableSave: boolean;
  onSave: () => void;
  onResetDate: () => void;
  onDelete: () => void;
};

export function DoseDecreaseDetail(props: DoseDecreaseDetailProps) {
  const { item } = props;
  const { updateItem } = useTrackedItems();

  const [editAt, setEditAt] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const [defaultDoseInput, setDefaultDoseInput] = useState<string>(item.defaultDose ? String(item.defaultDose) : '');
  const [dailyIntakeInput, setDailyIntakeInput] = useState<string>(String(item.currentUsageValue));

  useEffect(() => {
    setDefaultDoseInput(item.defaultDose ? String(item.defaultDose) : '');
  }, [item.defaultDose]);

  useEffect(() => {
    setDailyIntakeInput(String(item.currentUsageValue));
  }, [item.currentUsageValue]);

  const handleSaveDailyIntake = () => {
    const val = Number.parseFloat(dailyIntakeInput);
    if (!Number.isFinite(val) || val <= 0) {
      Alert.alert('Error', 'Please enter a valid positive number');
      return;
    }
    updateItem({ ...item, currentUsageValue: val });
    Alert.alert('Updated', `Current daily intake set to ${val} ${item.currentUsageUnit}`);
  };

  const handleSaveDefaultDose = () => {
    const val = Number.parseFloat(defaultDoseInput);
    if (!defaultDoseInput) {
      updateItem({ ...item, defaultDose: undefined });
      Alert.alert('Updated', 'Default dose removed');
      return;
    }
    if (!Number.isFinite(val) || val <= 0) {
      Alert.alert('Error', 'Please enter a valid positive number');
      return;
    }
    updateItem({ ...item, defaultDose: val });
    Alert.alert('Updated', `Default dose set to ${val} ${item.currentUsageUnit}`);
  };

  // Helpers for daily totals & pagination
  const convertAmount = (value: number, from: DosageUnit, to: DosageUnit): number => {
    if (from === to) return value;
    return from === 'mg' && to === 'g' ? value / 1000 : value * 1000;
  };

  const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const allDailyTotals = useMemo(() => {
    const logs = item.doseLogs ?? [];
    if (logs.length === 0) return [] as { date: Date; value: number }[];

    // Find earliest day
    let first: Date | null = null;
    for (const l of logs) {
      const t = new Date(l.at);
      if (!Number.isNaN(t.getTime())) {
        const s = dayStart(t);
        if (!first || s < first) first = s;
      }
    }
    if (!first) return [] as { date: Date; value: number }[];

    const todaySod = dayStart(new Date());
    // prefill map with 0 for every day
    const totalsMg = new Map<number, number>();
    for (let d = new Date(first); d <= todaySod; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
      totalsMg.set(d.getTime(), 0);
    }

    for (const l of logs) {
      const at = new Date(l.at);
      if (Number.isNaN(at.getTime())) continue;
      const key = dayStart(at).getTime();
      const prev = totalsMg.get(key) ?? 0;
      totalsMg.set(key, prev + convertAmount(l.value, l.unit, 'mg'));
    }

    // Convert to tracker's unit and return sorted array
    const result: { date: Date; value: number }[] = [];
    for (const [k, mg] of totalsMg.entries()) {
      const v = convertAmount(mg, 'mg', item.currentUsageUnit);
      result.push({ date: new Date(k), value: v });
    }
    result.sort((a, b) => a.date.getTime() - b.date.getTime());
    return result;
  }, [item.doseLogs, item.currentUsageUnit]);

  const [weekIndex, setWeekIndex] = useState(0); // 0 = current week, 1 = prev week, ...
  const maxWeekIndex = useMemo(() => {
    if (allDailyTotals.length === 0) return 0;
    return Math.floor((allDailyTotals.length - 1) / 7);
  }, [allDailyTotals.length]);

  const currentWeekSlice = useMemo(() => {
    const totals = allDailyTotals;
    if (totals.length === 0) return [] as { date: Date; value: number }[];
    const endIndex = Math.max(0, totals.length - 1 - weekIndex * 7);
    const startIndex = Math.max(0, endIndex - 6);
    return totals.slice(startIndex, endIndex + 1);
  }, [allDailyTotals, weekIndex]);

  const rangeLabel = useMemo(() => {
    const slice = currentWeekSlice;
    if (slice.length === 0) return 'No data yet';
    const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${fmt(slice[0].date)} – ${fmt(slice[slice.length - 1].date)}`;
  }, [currentWeekSlice]);

  const todaysLogs = useMemo(() => {
    const logs = item.doseLogs ?? [];
    const now = new Date();
    const start = dayStart(now);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return logs
      .map((l) => ({ ...l, atDate: new Date(l.at) }))
      .filter((l) => !Number.isNaN(l.atDate.getTime()) && l.atDate >= start && l.atDate < end)
      .sort((a, b) => a.atDate.getTime() - b.atDate.getTime());
  }, [item.doseLogs]);

  const promptLogActions = (logAt: string, currentVal: number) => {
    Alert.alert('Log entry', 'Choose an action', [
      {
        text: 'Edit value',
        onPress: () => {
          setEditAt(logAt);
          setEditValue(`${currentVal}`);
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const next: DoseDecreaseTrackedItem = {
            ...item,
            doseLogs: (item.doseLogs ?? []).filter((l) => l.at !== logAt),
          };
          updateItem(next);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSaveEdit = () => {
    if (!editAt) return;
    const amount = Number.parseFloat(editValue);
    if (!Number.isFinite(amount) || amount <= 0) return;
    const next: DoseDecreaseTrackedItem = {
      ...item,
      doseLogs: (item.doseLogs ?? []).map((l) =>
        l.at === editAt ? { ...l, value: amount, unit: item.currentUsageUnit } : l
      ),
    };
    updateItem(next);
    setEditAt(null);
    setEditValue('');
  };

  const icon = getTrackerIcon(item.type);
  const tintColor = M3Colors.vibrantOrange;
  const daysTracked = calculateDaysTracked(item.startedAt);

  return (
    <TrackerDetailTemplate
      {...props}
      extraEditFields={
        <View style={styles.extraFieldsContainer}>
          <View>
            <Text style={styles.fieldLabel}>Current Daily Intake ({item.currentUsageUnit})</Text>
            <View style={styles.inlineInputRow}>
              <TextInput
                value={dailyIntakeInput}
                onChangeText={setDailyIntakeInput}
                placeholder="e.g. 5"
                placeholderTextColor={M3Colors.outline}
                style={[styles.fieldInput, { flex: 1 }]}
                keyboardType="decimal-pad"
              />
              <TouchableOpacity style={styles.inlineSetButton} onPress={handleSaveDailyIntake}>
                <Text style={styles.inlineSetButtonText}>Set</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View>
            <Text style={styles.fieldLabel}>Default Dose Amount ({item.currentUsageUnit})</Text>
            <View style={styles.inlineInputRow}>
              <TextInput
                value={defaultDoseInput}
                onChangeText={setDefaultDoseInput}
                placeholder="e.g. 3"
                placeholderTextColor={M3Colors.outline}
                style={[styles.fieldInput, { flex: 1 }]}
                keyboardType="decimal-pad"
              />
              <TouchableOpacity style={styles.inlineSetButton} onPress={handleSaveDefaultDose}>
                <Text style={styles.inlineSetButtonText}>Set Default</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      }
      renderSummary={(item) => {
        const slice = currentWeekSlice;
        const maxDataVal = Math.max(0, ...slice.map((d) => d.value));
        const chartMax = Math.max(1, item.currentUsageValue, maxDataVal);
        const totalInSlice = slice.reduce((acc, curr) => acc + curr.value, 0);
        const avgInSlice = slice.length > 0 ? (totalInSlice / slice.length).toFixed(2) : '0';
        const displayAvg = Number(avgInSlice);

        return (
          <>
            {/* HERO SECTION — mirrors ColdTurkeyDetail */}
            <View style={styles.heroContainer}>
              <View style={styles.heroHeaderRow}>
                <View style={[styles.heroIconContainer, { backgroundColor: hexToRgba(tintColor, 0.2) }]}>
                  <FontAwesome6 color={tintColor} name={icon.name} size={24} />
                </View>
                <Text style={styles.heroTitle}>{item.name}</Text>
              </View>

              <View style={styles.timerDisplay}>
                <Text style={[styles.timerValue, { color: tintColor }]}>
                  {daysTracked ?? 0}
                </Text>
                <Text style={[styles.timerUnit, { color: hexToRgba(tintColor, 0.7) }]}>
                  {daysTracked === 1 ? 'day' : 'days'}
                </Text>
              </View>

              <View style={styles.secondaryInfoRow}>
                <View style={styles.metaBadge}>
                  <FontAwesome6 name="pills" size={12} color={M3Colors.onSurfaceVariant} />
                  <Text style={styles.metaText}>
                    {item.currentUsageValue} {item.currentUsageUnit}/day
                  </Text>
                </View>
                <View style={styles.metaBadge}>
                  <FontAwesome6 name="calendar-days" size={12} color={M3Colors.onSurfaceVariant} />
                  <Text style={styles.metaText}>{formatDateForDisplay(item.startedAt)}</Text>
                </View>
              </View>
            </View>

            {/* TRACKING STATS */}
            <TrackingStatsCard
              startedAt={item.startedAt}
              resetHistory={item.resetHistory}
              accentColor={tintColor}
            />

            {/* DAILY HISTORY CARD */}
            <View style={[styles.card, { borderColor: hexToRgba(tintColor, 0.3) }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Daily History</Text>
                <View style={styles.chartControls}>
                  <TouchableOpacity
                    onPress={() => setWeekIndex((i) => Math.min(maxWeekIndex, i + 1))}
                    style={[styles.chartNavBtn, weekIndex >= maxWeekIndex && styles.disabledNav]}
                    disabled={weekIndex >= maxWeekIndex}
                  >
                    <FontAwesome6 name="chevron-left" color={tintColor} size={12} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setWeekIndex((i) => Math.max(0, i - 1))}
                    style={[styles.chartNavBtn, weekIndex === 0 && styles.disabledNav]}
                    disabled={weekIndex === 0}
                  >
                    <FontAwesome6 name="chevron-right" color={tintColor} size={12} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.chartSummary}>
                <Text style={styles.chartBigNumber}>
                  {displayAvg}{' '}
                  <Text style={styles.chartUnit}>{item.currentUsageUnit} / day (avg)</Text>
                </Text>
                <Text style={styles.chartSubtitle}>{rangeLabel}</Text>
              </View>

              {slice.length === 0 ? (
                <Text style={styles.emptyText}>No dose logs yet</Text>
              ) : (
                <View style={styles.chartBody}>
                  {/* Y Axis */}
                  <View style={styles.yAxis}>
                    <Text style={styles.axisLabel}>{Math.round(chartMax)}</Text>
                    <Text style={styles.axisLabel}>{Math.round(chartMax / 2)}</Text>
                    <Text style={styles.axisLabel}>0</Text>
                  </View>

                  <View style={styles.barsArea}>
                    {/* Starting Dose Reference Line */}
                    {item.currentUsageValue > 0 && (
                      <View
                        style={[
                          styles.referenceLine,
                          { bottom: `${(item.currentUsageValue / chartMax) * 100}%` },
                        ]}
                      />
                    )}

                    {slice.map((entry, idx) => {
                      const heightPct = Math.max(0, Math.min(1, entry.value / chartMax));
                      const pct = Math.round(heightPct * 100);
                      const dayLabel = entry.date.toLocaleDateString(undefined, { weekday: 'narrow' });
                      const valueLabel = Number.isInteger(entry.value) ? `${entry.value}` : entry.value.toFixed(1);

                      return (
                        <View key={`${entry.date.toISOString()}-${idx}`} style={styles.barCol}>
                          <View style={styles.barTrack}>
                            <View style={[styles.barPill, { height: `${pct}%`, backgroundColor: hexToRgba(tintColor, 0.8) }]}>
                              {entry.value > 0 && (
                                <View style={styles.innerBadge}>
                                  <Text style={styles.innerBadgeText}>{valueLabel}</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          <Text style={styles.barDayLabel}>{dayLabel}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* TODAY'S TIMELINE CARD */}
            <View style={[styles.card, { borderColor: hexToRgba(tintColor, 0.3) }]}>
              <Text style={styles.cardTitle}>Today's timeline</Text>
              {todaysLogs.length === 0 ? (
                <Text style={styles.emptyText}>No doses logged today</Text>
              ) : (
                <View style={styles.timelineList}>
                  {todaysLogs.map((log, idx) => {
                    const time = log.atDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                    const val = Number.isInteger(log.value) ? `${log.value}` : log.value.toFixed(2);
                    return (
                      <TouchableOpacity
                        key={`${log.at}-${idx}`}
                        style={styles.timelineItem}
                        onPress={() => promptLogActions(log.at, log.value)}
                        accessibilityRole="button"
                        accessibilityLabel={`Dose at ${time}${log.note ? `. Note: ${log.note}` : ''}. Tap to edit or delete.`}
                      >
                        <View style={[styles.timelineDot, { backgroundColor: tintColor }]} />
                        <View style={styles.timelineContent}>
                          <View style={styles.timelineInfoRow}>
                            <Text style={styles.timelineTime}>{time}</Text>
                            <Text style={[styles.timelineValue, { color: tintColor }]}>
                              {val} {item.currentUsageUnit}
                            </Text>
                          </View>
                          {log.note ? (
                            <Text style={styles.timelineNote}>{log.note}</Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* EDIT MODAL */}
            <Modal transparent visible={!!editAt} onRequestClose={() => setEditAt(null)} animationType="fade">
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Edit dose</Text>
                  <Text style={styles.fieldLabel}>Amount ({item.currentUsageUnit})</Text>
                  <TextInput
                    value={editValue}
                    onChangeText={setEditValue}
                    placeholder="Amount"
                    placeholderTextColor={M3Colors.outline}
                    style={styles.fieldInput}
                    keyboardType="decimal-pad"
                    inputMode="decimal"
                    autoFocus
                  />
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalCancelButton]}
                      onPress={() => setEditAt(null)}
                    >
                      <Text style={styles.modalButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalSaveButton]}
                      onPress={handleSaveEdit}
                    >
                      <Text style={[styles.modalButtonText, { color: M3Colors.onPrimary }]}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  // --- Hero Section ---
  heroContainer: {
    marginBottom: M3Spacing.xxl,
    alignItems: 'center',
    paddingVertical: M3Spacing.lg,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: M3Spacing.sm,
    gap: M3Spacing.md,
  },
  heroIconContainer: {
    width: 48,
    height: 48,
    borderRadius: M3Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    ...M3Typography.headlineSmall,
    color: M3Colors.onSurface,
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  timerValue: {
    ...M3Typography.heroLarge,
    fontVariant: ['tabular-nums'],
  },
  timerUnit: {
    ...M3Typography.displaySmall,
    marginLeft: M3Spacing.sm,
  },
  secondaryInfoRow: {
    flexDirection: 'row',
    marginTop: M3Spacing.sm,
    gap: M3Spacing.md,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: M3Colors.surfaceContainerHigh,
    paddingHorizontal: M3Spacing.md,
    paddingVertical: M3Spacing.xs,
    borderRadius: M3Radius.full,
  },
  metaText: {
    ...M3Typography.labelMedium,
    color: M3Colors.onSurfaceVariant,
  },

  // --- Card Shell ---
  card: {
    backgroundColor: M3Colors.surfaceContainer,
    borderRadius: M3Radius.extraLarge,
    padding: M3Spacing.xl,
    marginBottom: M3Spacing.lg,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    ...M3Typography.titleMedium,
    color: M3Colors.onSurface,
  },

  // --- Chart ---
  chartControls: {
    flexDirection: 'row',
    gap: M3Spacing.sm,
    backgroundColor: M3Colors.surfaceContainerHigh,
    borderRadius: M3Radius.full,
    padding: M3Spacing.xs,
  },
  chartNavBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: M3Colors.surfaceContainer,
  },
  disabledNav: {
    opacity: 0.4,
  },
  chartSummary: {
    marginTop: M3Spacing.md,
    marginBottom: M3Spacing.xxl,
  },
  chartBigNumber: {
    ...M3Typography.headlineMedium,
    color: M3Colors.onSurface,
  },
  chartUnit: {
    ...M3Typography.bodyMedium,
    color: M3Colors.onSurfaceVariant,
  },
  chartSubtitle: {
    ...M3Typography.bodySmall,
    color: M3Colors.onSurfaceVariant,
    marginTop: M3Spacing.xs,
  },
  chartBody: {
    flexDirection: 'row',
    height: 180,
    gap: M3Spacing.md,
  },
  yAxis: {
    justifyContent: 'space-between',
    paddingVertical: M3Spacing.xl,
    alignItems: 'flex-end',
    width: 30,
  },
  axisLabel: {
    ...M3Typography.labelSmall,
    color: M3Colors.onSurfaceVariant,
  },
  barsArea: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: M3Spacing.xl,
  },
  barCol: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: 32,
    height: '100%',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  barPill: {
    width: '100%',
    borderRadius: M3Radius.large,
    alignItems: 'center',
    paddingTop: M3Spacing.xs,
  },
  barDayLabel: {
    ...M3Typography.labelSmall,
    color: M3Colors.onSurfaceVariant,
    marginTop: M3Spacing.sm,
    textAlign: 'center',
  },
  innerBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: M3Radius.medium,
    width: 24,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: M3Spacing.xs,
  },
  innerBadgeText: {
    color: M3Colors.onSurface,
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },
  referenceLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    borderColor: hexToRgba(M3Colors.onSurface, 0.3),
    borderTopWidth: 1,
    borderStyle: 'dashed',
    zIndex: 1,
  },
  emptyText: {
    ...M3Typography.bodyMedium,
    marginTop: M3Spacing.sm,
    color: M3Colors.onSurfaceVariant,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // --- Today's Timeline ---
  timelineList: {
    marginTop: M3Spacing.md,
    gap: M3Spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: M3Spacing.md,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  timelineContent: {
    flex: 1,
  },
  timelineInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineTime: {
    ...M3Typography.titleSmall,
    color: M3Colors.onSurface,
  },
  timelineValue: {
    ...M3Typography.titleSmall,
    marginLeft: 'auto',
  },
  timelineNote: {
    ...M3Typography.bodySmall,
    marginTop: 2,
    color: M3Colors.onSurfaceVariant,
  },

  // --- Modal ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: M3Spacing.xxl,
  },
  modalContent: {
    backgroundColor: M3Colors.surfaceContainerHigh,
    borderRadius: M3Radius.extraLarge,
    width: '100%',
    padding: M3Spacing.xxl,
    gap: M3Spacing.md,
  },
  modalTitle: {
    ...M3Typography.titleLarge,
    color: M3Colors.onSurface,
  },
  modalActions: {
    marginTop: M3Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: M3Spacing.md,
  },
  modalButton: {
    paddingVertical: M3Spacing.md,
    paddingHorizontal: M3Spacing.xl,
    borderRadius: M3Radius.medium,
  },
  modalButtonText: {
    ...M3Typography.labelLarge,
    color: M3Colors.onSurface,
  },
  modalCancelButton: {
    backgroundColor: M3Colors.surfaceContainer,
  },
  modalSaveButton: {
    backgroundColor: M3Colors.primary,
  },

  // --- Extra Edit Fields ---
  extraFieldsContainer: {
    marginTop: M3Spacing.lg,
    gap: M3Spacing.lg,
  },
  fieldLabel: {
    ...M3Typography.labelMedium,
    color: M3Colors.onSurfaceVariant,
    marginBottom: M3Spacing.xs,
  },
  fieldInput: {
    backgroundColor: M3Colors.surfaceContainerHigh,
    color: M3Colors.onSurface,
    borderRadius: M3Radius.medium,
    paddingHorizontal: M3Spacing.lg,
    paddingVertical: M3Spacing.md,
    fontSize: 14,
  },
  inlineInputRow: {
    flexDirection: 'row',
    gap: M3Spacing.md,
    alignItems: 'center',
  },
  inlineSetButton: {
    backgroundColor: M3Colors.primary,
    paddingVertical: M3Spacing.md,
    paddingHorizontal: M3Spacing.xl,
    borderRadius: M3Radius.medium,
  },
  inlineSetButtonText: {
    ...M3Typography.labelLarge,
    color: M3Colors.onPrimary,
  },
});
