import { FontAwesome6 } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/Themed';
import { M3Colors, M3Radius, M3Spacing, hexToRgba } from '@/constants/theme';
import { useTrackedItems } from '@/contexts/TrackedItemsContext';
import { DoseDecreaseTrackedItem } from '@/types/tracking';
import { calculateDaysTracked, formatDateForDisplay } from '@/utils/date';
import { getTodaysDoseTotal, getTrackerIcon } from '@/utils/tracker';

type Props = {
  item: DoseDecreaseTrackedItem;
  onPress: () => void;
};

export function DoseDecreaseListCard({ item, onPress }: Props) {
  const { updateItem } = useTrackedItems();
  const [doseInput, setDoseInput] = useState<string>('');
  const [noteInput, setNoteInput] = useState<string>('');
  const daysTracked = calculateDaysTracked(item.startedAt);
  const icon = getTrackerIcon(item.type);
  const todayTotal = getTodaysDoseTotal(item);
  const formattedTotal = Number.isInteger(todayTotal.value)
    ? todayTotal.value.toString()
    : todayTotal.value.toFixed(2);

  const normalizedInput = doseInput.replace(',', '.');

  const canLog =
    normalizedInput.trim().length > 0 && !Number.isNaN(Number(normalizedInput));

  const handleLogDose = () => {
    if (!canLog) return;
    const amount = parseFloat(normalizedInput);
    if (!Number.isFinite(amount) || amount <= 0) return;
    const trimmedNote = noteInput.trim();

    const next = {
      ...item,
      doseLogs: [
        ...(item.doseLogs ?? []),
        {
          at: new Date().toISOString(),
          value: amount,
          unit: item.currentUsageUnit,
          ...(trimmedNote ? { note: trimmedNote } : {}),
        },
      ],
    } as DoseDecreaseTrackedItem;
    updateItem(next);
    setDoseInput('');
    setNoteInput('');
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      style={styles.card}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{item.name}</Text>
        <View style={styles.iconContainer} accessible={false}>
          <FontAwesome6 color={M3Colors.tertiary} name={icon.name} size={18} />
        </View>
      </View>
      <Text style={styles.subtitle}>Gradually reducing since {formatDateForDisplay(item.startedAt)}</Text>
      <Text style={styles.metaText}>
        {`Today's total: ${formattedTotal} ${todayTotal.unit}`}
      </Text>
      <View style={styles.inputRow}>
        <TextInput
          value={doseInput}
          onChangeText={setDoseInput}
          placeholder={`Amount (${item.currentUsageUnit})`}
          placeholderTextColor={M3Colors.outline}
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
          keyboardType="decimal-pad"
          inputMode="decimal"
          accessibilityLabel="Dose amount"
        />
        <TouchableOpacity
          onPress={handleLogDose}
          style={[styles.logButton, !canLog && styles.disabledButton]}
          disabled={!canLog}
          accessibilityRole="button"
          accessibilityLabel={`Log dose in ${item.currentUsageUnit}`}
          activeOpacity={0.8}
        >
          <Text style={styles.logButtonText}>Log</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        value={noteInput}
        onChangeText={setNoteInput}
        placeholder="Note (optional)"
        placeholderTextColor={M3Colors.outline}
        style={[styles.input, { marginTop: M3Spacing.sm }]}
        accessibilityLabel="Optional note for this dose"
        returnKeyType="done"
      />
      {daysTracked !== null ? (
        <Text style={styles.daysText}>
          {daysTracked} {daysTracked === 1 ? 'day' : 'days'} of progress
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: M3Colors.surfaceContainer,
    borderRadius: M3Radius.large,
    padding: M3Spacing.lg,
    marginBottom: M3Spacing.md,
    borderWidth: 1,
    borderColor: hexToRgba(M3Colors.tertiary, 0.3),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: M3Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: M3Colors.onSurface,
    flexShrink: 1,
    marginRight: M3Spacing.lg,
  },
  iconContainer: {
    backgroundColor: hexToRgba(M3Colors.tertiary, 0.12),
    width: 40,
    height: 40,
    borderRadius: M3Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    color: M3Colors.onSurfaceVariant,
    fontSize: 14,
  },
  metaText: {
    marginTop: M3Spacing.md,
    fontWeight: '500',
    fontSize: 16,
    color: M3Colors.tertiary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: M3Spacing.md,
    marginTop: M3Spacing.md,
  },
  input: {
    backgroundColor: M3Colors.surfaceContainerHigh,
    color: M3Colors.onSurface,
    borderRadius: M3Radius.medium,
    paddingHorizontal: M3Spacing.lg,
    paddingVertical: M3Spacing.md,
    fontSize: 14,
  },
  logButton: {
    backgroundColor: M3Colors.tertiary,
    paddingHorizontal: M3Spacing.lg,
    paddingVertical: M3Spacing.md,
    borderRadius: M3Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logButtonText: {
    color: M3Colors.onTertiary,
    fontWeight: '500',
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.5,
  },
  daysText: {
    marginTop: M3Spacing.md,
    fontWeight: '500',
    fontSize: 14,
    color: M3Colors.onSurfaceVariant,
  },
});

