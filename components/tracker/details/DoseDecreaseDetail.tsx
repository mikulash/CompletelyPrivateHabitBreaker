import { FontAwesome6 } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/Themed';
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

  useEffect(() => {
    setDefaultDoseInput(item.defaultDose ? String(item.defaultDose) : '');
  }, [item.defaultDose]);

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
    return `${fmt(slice[0].date)}  ${fmt(slice[slice.length - 1].date)}`; // en dash separator
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

  return (
    <TrackerDetailTemplate
      {...props}
      extraEditFields={
        <View style={{ marginTop: 16 }}>
          <Text style={styles.inputLabel}>Default Dose Amount ({item.currentUsageUnit})</Text>
          <View style={styles.inlineInputRow}>
            <TextInput
              value={defaultDoseInput}
              onChangeText={setDefaultDoseInput}
              placeholder="e.g. 3"
              placeholderTextColor="#666"
              style={[styles.input, { flex: 1 }]}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveDefaultDose}>
              <Text style={styles.saveButtonText}>Set Default</Text>
            </TouchableOpacity>
          </View>
        </View>
      }
      renderSummary={(item) => {
        const icon = getTrackerIcon(item.type);
        const daysTracked = calculateDaysTracked(item.startedAt);
        const slice = currentWeekSlice;
        const maxInSlice = Math.max(1, ...slice.map((d) => d.value));
        return (
          <>
            <TrackingStatsCard
              startedAt={item.startedAt}
              resetHistory={item.resetHistory}
              accentColor={icon.color}
            />
            <View style={[styles.summaryCard, styles.doseSummary]}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>{item.name}</Text>
                <View style={[styles.summaryIcon, styles.doseIcon]}>
                  <FontAwesome6 color={icon.color} name={icon.name} size={32} />
                </View>
              </View>
              <Text style={styles.summarySubtitle}>Steady dosage decrease</Text>
              <Text style={styles.summaryMeta}>Started {formatDateForDisplay(item.startedAt)}</Text>
              {daysTracked !== null ? (
                <Text style={[styles.summaryHighlight, styles.doseHighlight]}>
                  {daysTracked} {daysTracked === 1 ? 'day' : 'days'} trimming dosage
                </Text>
              ) : null}
            </View>



            {/* Weekly graph */}
            <View style={[styles.summaryCard, styles.doseSummary]}>
              <View style={styles.navRow}>
                <Text style={styles.sectionTitle}>Daily totals</Text>
                <View style={styles.navControls}>
                  <TouchableOpacity
                    onPress={() => setWeekIndex((i) => Math.min(maxWeekIndex, i + 1))}
                    style={[styles.navButton, weekIndex >= maxWeekIndex && styles.navButtonDisabled]}
                    disabled={weekIndex >= maxWeekIndex}
                    accessibilityLabel="Previous week"
                  >
                    <FontAwesome6 name="chevron-left" color="#fb923c" size={14} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setWeekIndex((i) => Math.max(0, i - 1))}
                    style={[styles.navButton, weekIndex === 0 && styles.navButtonDisabled]}
                    disabled={weekIndex === 0}
                    accessibilityLabel="Next week"
                  >
                    <FontAwesome6 name="chevron-right" color="#fb923c" size={14} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.rangeLabel}>{rangeLabel}</Text>

              {slice.length === 0 ? (
                <Text style={styles.emptyText}>No dose logs yet</Text>
              ) : (
                <View style={styles.chartRow}>
                  {slice.map((entry, idx) => {
                    const heightPct = Math.max(0, Math.min(1, entry.value / maxInSlice));
                    const barHeight = 90 * heightPct + 6; // min height 6
                    const dayLabel = entry.date.toLocaleDateString(undefined, { weekday: 'short' });
                    const valueLabel = Number.isInteger(entry.value) ? `${entry.value}` : entry.value.toFixed(1);
                    return (
                      <View key={`${entry.date.toISOString()}-${idx}`} style={styles.barContainer} accessibilityLabel={`${dayLabel}: ${valueLabel} ${item.currentUsageUnit}`}>
                        <Text style={styles.barValueLabel}>{valueLabel} {item.currentUsageUnit}</Text>
                        <View style={[styles.bar, { height: barHeight }]} />
                        <Text style={styles.barDayLabel}>{dayLabel}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Today's timeline */}
            <View style={[styles.summaryCard, styles.doseSummary]}>
              <Text style={styles.sectionTitle}>Today’s timeline</Text>
              {todaysLogs.length === 0 ? (
                <Text style={styles.emptyText}>No doses logged today</Text>
              ) : (
                <View style={styles.timelineContainer}>
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
                        <View style={styles.timelineDot} />
                        <View style={styles.timelineContent}>
                          <View style={styles.timelineInfoRow}>
                            <Text style={styles.timelineText}>{time}</Text>
                            <Text style={styles.timelineValue}>{val} {item.currentUsageUnit}</Text>
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

            {/* Edit modal */}
            <Modal transparent visible={!!editAt} onRequestClose={() => setEditAt(null)} animationType="fade">
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.sectionTitle}>Edit dose</Text>
                  <Text style={styles.inputLabel}>Amount ({item.currentUsageUnit})</Text>
                  <TextInput
                    value={editValue}
                    onChangeText={setEditValue}
                    placeholder="Amount"
                    placeholderTextColor="#888"
                    style={styles.input}
                    keyboardType="decimal-pad"
                    inputMode="decimal"
                    autoFocus
                  />
                  <View style={styles.modalActions}>
                    <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setEditAt(null)}>
                      <Text style={styles.modalButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveEdit}>
                      <Text style={[styles.modalButtonText, styles.saveButtonText]}>Save</Text>
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
  summaryCard: {
    backgroundColor: '#18181f',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  doseSummary: {
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.5)',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    flexShrink: 1,
    marginRight: 16,
  },
  summaryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2f2f3b',
  },
  doseIcon: {
    backgroundColor: 'rgba(251, 146, 60, 0.15)',
  },
  summarySubtitle: {
    color: '#fb923c',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryMeta: {
    color: '#bbb',
    marginTop: 6,
    fontSize: 14,
  },
  summaryHighlight: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
  },
  doseHighlight: {
    color: '#fb923c',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navControls: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.6)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  rangeLabel: {
    marginTop: 8,
    color: '#bbb',
    fontSize: 12,
    fontWeight: '600',
  },
  chartRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  bar: {
    width: 16,
    backgroundColor: '#fb923c',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  barDayLabel: {
    marginTop: 6,
    color: '#ccc',
    fontSize: 12,
    fontWeight: '600',
  },
  barValueLabel: {
    color: '#fb923c',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyText: {
    marginTop: 8,
    color: '#bbb',
  },
  timelineContainer: {
    marginTop: 8,
    gap: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fb923c',
  },
  timelineContent: {
    flex: 1,
  },
  timelineInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineText: {
    color: '#fff',
    fontWeight: '600',
  },
  timelineValue: {
    marginLeft: 'auto',
    color: '#fb923c',
    fontWeight: '700',
  },
  timelineNote: {
    marginTop: 2,
    color: '#bbb',
    fontSize: 12,
  },
  // Modal + input styles (match app theme)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1f1f29',
    borderRadius: 20,
    width: '100%',
    padding: 24,
  },
  inputLabel: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#2a2a35',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  modalActions: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: '#2a2a35',
  },
  saveButton: {
    backgroundColor: '#4c6ef5',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
  },
  inlineInputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
});
