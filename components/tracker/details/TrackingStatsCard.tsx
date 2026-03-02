import { FontAwesome6 } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { COLD_TURKEY_MILESTONES } from '@/constants/coldTurkeyMilestones';
import { M3Colors, M3Radius, M3Spacing, hexToRgba } from '@/constants/theme';
import type { ColdTurkeyResetEntry } from '@/types/tracking';
import { formatElapsedDurationLabel, getTrackingResetStats } from '@/utils/tracker';

type TrackingStatsCardProps = {
  startedAt: string;
  resetHistory?: ColdTurkeyResetEntry[];
  accentColor: string;
};

export function TrackingStatsCard({ startedAt, resetHistory, accentColor }: Readonly<TrackingStatsCardProps>) {
  const stats = getTrackingResetStats(startedAt, resetHistory);

  const trackingLabel =
    stats.totalTrackedMs === null ? 'N/A' : formatElapsedDurationLabel(stats.totalTrackedMs, 2);
  const averageLabel =
    stats.averageBetweenResetsMs === null
        ? 'N/A'
        : formatElapsedDurationLabel(stats.averageBetweenResetsMs, 2);
  const maxLabel =
    stats.maxBetweenResetsMs === null ? 'N/A' : formatElapsedDurationLabel(stats.maxBetweenResetsMs, 2);

  const recordMilestones = COLD_TURKEY_MILESTONES.filter(
    (m) => stats.maxBetweenResetsMs !== null && stats.maxBetweenResetsMs >= m.durationMs
  );

  return (
    <View style={[styles.card, { borderColor: hexToRgba(accentColor, 0.5) }]}>
      <Text style={styles.title}>Tracking stats</Text>

      <View style={styles.grid}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Tracking time</Text>
          <Text style={[styles.statValue, { color: accentColor }]}>{trackingLabel}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Resets</Text>
          <Text style={[styles.statValue, { color: accentColor }]}>{stats.resetCount}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Avg between resets</Text>
          <Text style={[styles.statValue, { color: accentColor }]}>{averageLabel}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Max between resets</Text>
          <Text style={[styles.statValue, { color: accentColor }]}>{maxLabel}</Text>
        </View>
      </View>

      {recordMilestones.length > 0 && (
        <View style={styles.milestonesSection}>
          <Text style={styles.milestonesTitle}>Record Milestones</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.milestonesScroll}>
            {recordMilestones.toReversed().map((m, i) => (
              <View key={m.label} style={[styles.medalBadge, { backgroundColor: m.color.bg, borderColor: m.color.border }]}>
                <View style={[styles.medalIcon, { backgroundColor: m.color.iconBg }]}>
                  <FontAwesome6 name="medal" size={10} color={m.color.text} />
                </View>
                <Text style={[styles.medalText, { color: m.color.text }]}>{m.label}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: M3Colors.surfaceContainer,
    borderRadius: M3Radius.large,
    padding: M3Spacing.lg,
    marginBottom: M3Spacing.xxl,
    borderWidth: 1,
  },
  title: {
    color: M3Colors.onSurface,
    fontSize: 16,
    fontWeight: '500',
  },
  grid: {
    marginTop: M3Spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    paddingRight: M3Spacing.md,
    marginBottom: M3Spacing.md,
  },
  statLabel: {
    color: M3Colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '500',
  },
  statValue: {
    marginTop: M3Spacing.xs,
    fontSize: 16,
    fontWeight: '600',
  },
  milestonesSection: {
    marginTop: M3Spacing.md,
    paddingTop: M3Spacing.md,
    borderTopWidth: 1,
    borderTopColor: M3Colors.surfaceContainerHigh,
  },
  milestonesTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: M3Colors.onSurfaceVariant,
    marginBottom: M3Spacing.sm,
  },
  milestonesScroll: {
    gap: M3Spacing.sm,
    paddingBottom: M3Spacing.xs,
  },
  medalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: M3Radius.full,
    borderWidth: 1,
    gap: 6,
  },
  medalIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

