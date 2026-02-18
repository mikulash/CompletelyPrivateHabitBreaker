import { FontAwesome6 } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/Themed';
import { getTonalSurfaceColor, hexToRgba, M3Colors, M3Radius, M3Spacing, M3Typography } from '@/constants/theme';
import { useElapsedBreakdown } from '@/hooks/useElapsedBreakdown';
import { ColdTurkeyTrackedItem } from '@/types/tracking';
import { formatTimeLeft } from '@/utils/date';
import {
    formatElapsedDurationLabel,
    getColdTurkeyProgress,
    getColdTurkeyStreakTargets,
    getTrackerIcon,
} from '@/utils/tracker';

const GOLD = '#FFD700';
const GOLD_BORDER = 'rgba(255, 215, 0, 0.55)';

type Props = {
    item: ColdTurkeyTrackedItem;
    onPress: () => void;
};

export function ColdTurkeyListCard({ item, onPress }: Props) {
    const icon = getTrackerIcon(item.type);
    const progress = getColdTurkeyProgress(item.startedAt);
    const breakdown = useElapsedBreakdown(item.startedAt);

    // Hero metric: The largest unit (Days, Months, Years)
    const primaryUnit = breakdown[0];
    const heroValue = primaryUnit.value;
    const heroLabel = primaryUnit.unit;

    const secondaryStats = breakdown.slice(1).map(b => `${b.value} ${b.unit} `).join(' · ');

    const progressPercent = progress.next ? progress.progressToNext : 1;
    const timeLeft = progress.next ? formatTimeLeft(Math.max(0, progress.next.durationMs - progress.elapsedMs)) : null;
    const nextLabel = progress.next
        ? `${progress.next.label}${timeLeft ? ` (${timeLeft})` : ''} `
        : 'All milestones achieved';

    const tintColor = M3Colors.vibrantTeal;

    // --- Record / personal best logic ---
    const streakTargets = getColdTurkeyStreakTargets(item.resetHistory);
    const recordMs = streakTargets.record?.durationMs ?? null;
    const isNewRecord = recordMs !== null && progress.elapsedMs > recordMs;
    const showRecordBadge = recordMs !== null && !isNewRecord;
    const recordLabel = recordMs !== null ? formatElapsedDurationLabel(recordMs, 2) : '';

    // Dynamic border for "new record" state
    const borderColor = isNewRecord ? GOLD_BORDER : hexToRgba(tintColor, 0.2);

    return (
        <TouchableOpacity
            accessibilityRole="button"
            onPress={onPress}
            style={[
                styles.card,
                {
                    backgroundColor: getTonalSurfaceColor(M3Colors.surface, tintColor, 0.08),
                    borderColor,
                },
            ]}
            activeOpacity={0.8}
        >
            <View style={styles.content}>
                {/* Header with Title and Icon */}
                <View style={styles.header}>
                    <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
                    <View style={[styles.iconContainer, { backgroundColor: hexToRgba(isNewRecord ? GOLD : tintColor, 0.15) }]}>
                        <FontAwesome6 color={isNewRecord ? GOLD : tintColor} name={icon.name} size={20} />
                    </View>
                    {isNewRecord && (
                        <View style={[styles.iconContainer, { backgroundColor: hexToRgba(GOLD, 0.15), marginLeft: M3Spacing.sm }]}>
                            <FontAwesome6 color={GOLD} name="trophy" size={20} />
                        </View>
                    )}
                </View>

                {/* Hero Metric Section */}
                <View style={styles.heroSection}>
                    <Text style={[styles.heroNumber, { color: tintColor }]}>{heroValue}</Text>
                    <Text style={[styles.heroLabel, { color: hexToRgba(tintColor, 0.8) }]}>{heroLabel}</Text>
                </View>

                {/* Secondary Stats & Progress */}
                <View style={styles.footer}>
                    {secondaryStats ? (
                        <Text style={styles.secondaryStats}>{secondaryStats}</Text>
                    ) : <View style={{ height: 20 }} />}

                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { backgroundColor: hexToRgba(tintColor, 0.2) }]}>
                            <View style={[styles.progressFill, { width: `${Math.round(progressPercent * 100)}%` as any, backgroundColor: tintColor }]} />
                        </View>
                        <View style={styles.progressRow}>
                            <Text style={styles.progressLabel}>{nextLabel}</Text>
                            {showRecordBadge && (
                                <View style={styles.recordBadge}>
                                    <FontAwesome6 name="trophy" size={10} color={GOLD} style={{ opacity: 0.85 }} />
                                    <Text style={styles.recordText}>{recordLabel}</Text>
                                </View>
                            )}
                        </View>
                    </View>
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
        width: 40,
        height: 40,
        borderRadius: M3Radius.medium,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroSection: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: M3Spacing.xs,
        marginBottom: M3Spacing.md,
    },
    heroNumber: {
        ...M3Typography.displayLarge,
        fontWeight: '300',
        lineHeight: 64,
    },
    heroLabel: {
        ...M3Typography.headlineSmall,
        marginLeft: M3Spacing.sm,
        marginBottom: 6,
    },
    footer: {
        gap: M3Spacing.md,
    },
    secondaryStats: {
        ...M3Typography.bodyMedium,
        color: M3Colors.onSurfaceVariant,
    },
    progressContainer: {
        gap: 6,
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressLabel: {
        ...M3Typography.labelSmall,
        color: M3Colors.onSurfaceVariant,
        opacity: 0.8,
        flexShrink: 1,
    },
    recordBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: M3Radius.full,
        backgroundColor: 'rgba(255, 215, 0, 0.10)',
    },
    recordText: {
        ...M3Typography.labelSmall,
        color: GOLD,
        opacity: 0.85,
        fontSize: 10,
    },
});
