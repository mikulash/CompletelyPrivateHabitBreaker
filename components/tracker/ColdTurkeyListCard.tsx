import { FontAwesome6 } from '@expo/vector-icons';
import React from 'react';
import { Text as RNText, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/Themed';
import { hexToRgba, M3Colors, M3Radius, M3Spacing } from '@/constants/theme';
import { useElapsedBreakdown } from '@/hooks/useElapsedBreakdown';
import { ColdTurkeyTrackedItem } from '@/types/tracking';
import { formatDateForDisplay, formatTimeLeft } from '@/utils/date';
import {
    formatElapsedDurationLabel,
    getColdTurkeyProgress,
    getColdTurkeyStreakTargets,
    getTrackerIcon,
} from '@/utils/tracker';

type Props = {
    item: ColdTurkeyTrackedItem;
    onPress: () => void;
};

export function ColdTurkeyListCard({ item, onPress }: Props) {
    const icon = getTrackerIcon(item.type);
    const progress = getColdTurkeyProgress(item.startedAt);
    const breakdown = useElapsedBreakdown(item.startedAt);

    const startedMs = new Date(item.startedAt).getTime();
    const elapsedMs = Math.max(0, Date.now() - startedMs);

    const progressPercent = progress.next ? progress.progressToNext : 1;

    const timeLeft =
        progress.next ? formatTimeLeft(Math.max(0, progress.next.durationMs - elapsedMs)) : null;

    const nextLabel = progress.next
        ? `Next: ${progress.next.label}${timeLeft ? ` (${timeLeft})` : ''}`
        : 'All milestones achieved';

    const { last, record } = getColdTurkeyStreakTargets(item.resetHistory);
    const lastDurationMs = last?.durationMs ?? 0;
    const hasLastTarget = lastDurationMs > 0;
    const lastProgress = hasLastTarget ? Math.min(1, elapsedMs / lastDurationMs) : 0;
    const hasGoneLonger = hasLastTarget && elapsedMs >= lastDurationMs;
    const lastRemainingMs = hasLastTarget ? Math.max(0, lastDurationMs - elapsedMs) : 0;
    const lastTimeLeftLabel = hasLastTarget && lastRemainingMs > 0 ? formatTimeLeft(lastRemainingMs) : '';
    const lastDurationLabel = hasLastTarget ? formatElapsedDurationLabel(lastDurationMs) : '';
    const shouldShowLastProgressBar = hasLastTarget && !hasGoneLonger;

    const recordDurationMs = record?.durationMs ?? 0;
    const hasRecordTarget = recordDurationMs > 0;
    const recordProgress = hasRecordTarget ? Math.min(1, elapsedMs / recordDurationMs) : 0;
    const recordRemainingMs = hasRecordTarget ? Math.max(0, recordDurationMs - elapsedMs) : 0;
    const hasHitRecord = hasRecordTarget && elapsedMs >= recordDurationMs;
    const recordTimeLeftLabel = hasRecordTarget && recordRemainingMs > 0 ? formatTimeLeft(recordRemainingMs) : '';
    const recordDurationLabel = hasRecordTarget ? formatElapsedDurationLabel(recordDurationMs) : '';
    const shouldShowRecordProgress = hasRecordTarget && hasGoneLonger;
    const shouldShowRecordProgressBar = shouldShowRecordProgress && !hasHitRecord;

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
                    <FontAwesome6 color={M3Colors.primary} name={icon.name} size={18} />
                </View>
            </View>

            <Text style={styles.subtitle}>All-in quit since {formatDateForDisplay(item.startedAt)}</Text>

            <RNText style={styles.breakdownText}>
                {breakdown.map((entry, i) => (
                    <React.Fragment key={`${entry.unit}-${i}`}>
                        <RNText style={styles.breakdownNumber}>{entry.value}</RNText>
                        <RNText style={styles.breakdownUnit}>{` ${entry.unit}`}</RNText>
                        {i < breakdown.length - 1 ? <RNText style={styles.breakdownSeparator}>{' · '}</RNText> : null}
                    </React.Fragment>
                ))}
            </RNText>

            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${Math.round(progressPercent * 100)}%` }]} />
                </View>
                <Text style={styles.progressLabel}>{nextLabel}</Text>

                {hasLastTarget ? (
                    <View style={styles.streakSection}>
                        {shouldShowLastProgressBar ? (
                            <View style={[styles.progressBar, styles.lastProgressBar]}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        styles.lastProgressFill,
                                        { width: `${Math.round(Math.min(1, lastProgress) * 100)}%` },
                                    ]}
                                />
                            </View>
                        ) : null}

                        <View style={styles.inlineRow}>
                            <Text style={styles.streakLabel}>
                                {hasGoneLonger
                                    ? `Beat last streak (${lastDurationLabel})`
                                    : `Beat last streak (${lastDurationLabel})${lastTimeLeftLabel ? ` · ${lastTimeLeftLabel} left` : ''
                                    }`}
                            </Text>
                            {hasGoneLonger ? (
                                <FontAwesome6 name="trophy" size={12} color={M3Colors.tertiary} />
                            ) : null}
                        </View>
                    </View>
                ) : null}

                {shouldShowRecordProgress ? (
                    <View style={styles.streakSection}>
                        {shouldShowRecordProgressBar ? (
                            <View style={[styles.progressBar, styles.recordProgressBar]}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        styles.recordProgressFill,
                                        { width: `${Math.round(Math.min(1, recordProgress) * 100)}%` },
                                    ]}
                                />
                            </View>
                        ) : null}

                        <View style={styles.inlineRow}>
                            <Text style={[styles.streakLabel, styles.recordLabel]}>
                                {hasHitRecord
                                    ? `Record streak (${recordDurationLabel})`
                                    : `Record streak (${recordDurationLabel})${recordTimeLeftLabel ? ` · ${recordTimeLeftLabel} left` : ''
                                    }`}
                            </Text>
                            {hasHitRecord ? (
                                <FontAwesome6 name="trophy" size={12} color={M3Colors.tertiary} />
                            ) : null}
                        </View>
                    </View>
                ) : null}
            </View>
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
        borderColor: hexToRgba(M3Colors.primary, 0.3),
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
        backgroundColor: hexToRgba(M3Colors.primary, 0.12),
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
    breakdownText: {
        marginTop: M3Spacing.md,
        fontWeight: '500',
        fontSize: 16,
        color: M3Colors.onSurface,
    },
    breakdownNumber: {
        fontWeight: '600',
        fontSize: 18,
        color: M3Colors.primary,
    },
    breakdownUnit: {
        color: M3Colors.onSurfaceVariant,
    },
    breakdownSeparator: {
        color: M3Colors.outline,
    },
    progressContainer: {
        marginTop: M3Spacing.lg,
        gap: M3Spacing.sm,
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        backgroundColor: hexToRgba(M3Colors.primary, 0.2),
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: M3Colors.primary,
        borderRadius: 3,
    },
    progressLabel: {
        color: M3Colors.onPrimaryContainer,
        fontSize: 12,
        fontWeight: '500',
    },
    streakSection: {
        gap: M3Spacing.xs,
        marginTop: M3Spacing.xs,
    },
    lastProgressBar: {
        backgroundColor: hexToRgba(M3Colors.secondary, 0.18),
    },
    lastProgressFill: {
        backgroundColor: M3Colors.secondary,
    },
    recordProgressBar: {
        backgroundColor: hexToRgba(M3Colors.tertiary, 0.18),
    },
    recordProgressFill: {
        backgroundColor: M3Colors.tertiary,
    },
    streakLabel: {
        color: M3Colors.onSecondaryContainer,
        fontSize: 12,
        fontWeight: '500',
    },
    recordLabel: {
        color: M3Colors.onTertiaryContainer,
    },
    inlineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: M3Spacing.xs,
    },
});

