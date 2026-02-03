import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { M3Colors, M3Radius, M3Spacing, hexToRgba } from '@/constants/theme';
import type { ColdTurkeyResetEntry } from '@/types/tracking';
import { formatElapsedDurationLabel, getTrackingResetStats } from '@/utils/tracker';

type TrackingStatsCardProps = {
  startedAt: string;
  resetHistory?: ColdTurkeyResetEntry[];
  accentColor: string;
};

export function TrackingStatsCard({ startedAt, resetHistory, accentColor }: TrackingStatsCardProps) {
  const stats = getTrackingResetStats(startedAt, resetHistory);

  const trackingLabel =
    stats.totalTrackedMs !== null ? formatElapsedDurationLabel(stats.totalTrackedMs, 2) : 'N/A';
  const averageLabel =
    stats.averageBetweenResetsMs !== null
      ? formatElapsedDurationLabel(stats.averageBetweenResetsMs, 2)
      : 'N/A';
  const maxLabel =
    stats.maxBetweenResetsMs !== null ? formatElapsedDurationLabel(stats.maxBetweenResetsMs, 2) : 'N/A';

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
});

