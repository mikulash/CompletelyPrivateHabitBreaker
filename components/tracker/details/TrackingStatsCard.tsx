import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
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
    <View style={[styles.card, { borderColor: accentColor }]}>
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
    backgroundColor: '#18181f',
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  grid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    paddingRight: 12,
    marginBottom: 12,
  },
  statLabel: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '700',
  },
});
