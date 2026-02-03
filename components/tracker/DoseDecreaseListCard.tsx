import { FontAwesome6 } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/Themed';
import { getTonalSurfaceColor, hexToRgba, M3Colors, M3Radius, M3Spacing, M3Typography } from '@/constants/theme';
import { useTrackedItems } from '@/contexts/TrackedItemsContext';
import { DoseDecreaseTrackedItem } from '@/types/tracking';
import { calculateDaysTracked } from '@/utils/date';
import { getTodaysDoseTotal, getTrackerIcon } from '@/utils/tracker';

type Props = {
  item: DoseDecreaseTrackedItem;
  onPress: () => void;
};

export function DoseDecreaseListCard({ item, onPress }: Props) {
  const { updateItem } = useTrackedItems();
  const [doseInput, setDoseInput] = useState<string>('');

  const daysTracked = calculateDaysTracked(item.startedAt);
  const icon = getTrackerIcon(item.type);
  const todayTotal = getTodaysDoseTotal(item);
  const formattedTotal = Number.isInteger(todayTotal.value)
    ? todayTotal.value.toString()
    : todayTotal.value.toFixed(2);

  const normalizedInput = doseInput.replace(',', '.');

  const canLog =
    normalizedInput.trim().length > 0 && !Number.isNaN(Number(normalizedInput));

  const handleLogClick = () => {
    // If clicking the log button (which is inside the touchable card), 
    // we need to stop propagation or handle interaction carefully.
    // In RN, nested touchables work fine.
    handleLogDose();
  }

  const handleLogDose = () => {
    if (!canLog) return;
    const amount = parseFloat(normalizedInput);
    if (!Number.isFinite(amount) || amount <= 0) return;

    const next = {
      ...item,
      doseLogs: [
        ...(item.doseLogs ?? []),
        {
          at: new Date().toISOString(),
          value: amount,
          unit: item.currentUsageUnit,
        },
      ],
    } as DoseDecreaseTrackedItem;
    updateItem(next);
    setDoseInput('');
  };

  const tintColor = M3Colors.vibrantOrange;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: getTonalSurfaceColor(M3Colors.surface, tintColor, 0.08),
          borderColor: hexToRgba(tintColor, 0.2)
        }
      ]}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
          <View style={[styles.iconContainer, { backgroundColor: hexToRgba(tintColor, 0.15) }]}>
            <FontAwesome6 color={tintColor} name={icon.name} size={18} />
          </View>
        </View>

        {/* Hero Metric: Today's Total Dose */}
        <View style={styles.heroSection}>
          <Text style={[styles.heroNumber, { color: tintColor }]}>{formattedTotal}</Text>
          <View>
            <Text style={[styles.heroUnit, { color: hexToRgba(tintColor, 0.8) }]}>{todayTotal.unit}</Text>
            <Text style={styles.heroLabel}>today</Text>
          </View>
        </View>

        {/* Quick Log Action */}
        <View style={styles.actionSection}>
          <TextInput
            value={doseInput}
            onChangeText={setDoseInput}
            placeholder="Add dose"
            placeholderTextColor={M3Colors.onSurfaceVariant}
            style={styles.inlineInput}
            keyboardType="decimal-pad"
            inputMode="decimal"
            accessibilityLabel="Dose amount"
            maxLength={6}
          />
          <TouchableOpacity
            onPress={handleLogClick}
            style={[styles.miniFab, !canLog && styles.disabledFab, { backgroundColor: tintColor }]}
            disabled={!canLog}
            activeOpacity={0.7}
          >
            <FontAwesome6 name="plus" size={16} color={M3Colors.surface} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: M3Radius.extraLarge,
    marginBottom: M3Spacing.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    padding: M3Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: M3Spacing.sm,
  },
  title: {
    ...M3Typography.titleMedium,
    color: M3Colors.onSurface,
    flex: 1,
    marginRight: M3Spacing.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: M3Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: M3Spacing.xs,
    marginBottom: M3Spacing.lg,
  },
  heroNumber: {
    ...M3Typography.displayMedium,
    fontWeight: '300',
    color: M3Colors.onSurface,
    marginRight: M3Spacing.sm,
    lineHeight: 52,
  },
  heroUnit: {
    ...M3Typography.titleMedium,
    fontWeight: '600',
  },
  heroLabel: {
    ...M3Typography.bodySmall,
    color: M3Colors.onSurfaceVariant,
  },
  actionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: M3Spacing.md,
  },
  inlineInput: {
    flex: 1,
    backgroundColor: M3Colors.surfaceContainerHigh,
    borderRadius: M3Radius.full,
    paddingHorizontal: M3Spacing.lg,
    paddingVertical: M3Spacing.sm,
    color: M3Colors.onSurface,
    fontSize: 14,
    height: 40,
  },
  miniFab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledFab: {
    opacity: 0.5,
    fontWeight: '500',
    fontSize: 14,
    color: M3Colors.onSurfaceVariant,
  },
});

