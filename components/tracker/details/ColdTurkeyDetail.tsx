import { FontAwesome6 } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { hexToRgba, M3Colors, M3Radius, M3Spacing, M3Typography } from '@/constants/theme';
import { useElapsedBreakdown } from '@/hooks/useElapsedBreakdown';
import { ColdTurkeyTrackedItem } from '@/types/tracking';
import { formatDateForDisplay, formatTimeLeft } from '@/utils/date';
import {
    formatElapsedDurationLabel,
    getColdTurkeyProgress,
    getTrackerIcon
} from '@/utils/tracker';

import { TrackerDetailTemplate } from './TrackerDetailTemplate';
import { TrackingStatsCard } from './TrackingStatsCard';

type ColdTurkeyDetailProps = {
    item: ColdTurkeyTrackedItem;
    nameInput: string;
    onNameChange: (value: string) => void;
    startDateDisplay: string;
    disableSave: boolean;
    onSave: () => void;
    onResetDate: () => void;
    onDelete: () => void;
};

export function ColdTurkeyDetail(props: ColdTurkeyDetailProps) {
    const { item } = props;
    const breakdown = useElapsedBreakdown(item.startedAt);
    const progress = getColdTurkeyProgress(item.startedAt);

    // Using simplified progress logic for the timeline
    const progressPercent = progress.next ? progress.progressToNext : 1;
    const tintColor = M3Colors.vibrantTeal;

    return (
        <TrackerDetailTemplate
            {...props}
            renderSummary={(item) => {
                const icon = getTrackerIcon(item.type);
                const nextLabel = progress.next ? progress.next.label : 'Maximum Achievement';

                return (
                    <>
                        {/* HER LAYOUT: Giant Timer Header */}
                        <View style={styles.heroContainer}>
                            <View style={styles.heroHeaderRow}>
                                <View style={[styles.heroIconContainer, { backgroundColor: hexToRgba(tintColor, 0.2) }]}>
                                    <FontAwesome6 color={tintColor} name={icon.name} size={24} />
                                </View>
                                <Text style={styles.heroTitle}>{item.name}</Text>
                            </View>

                            <View style={styles.timerDisplay}>
                                {/* Primary Unit (e.g. Days) */}
                                <Text style={[styles.timerValue, { color: tintColor }]}>{breakdown[0].value}</Text>
                                <Text style={[styles.timerUnit, { color: hexToRgba(tintColor, 0.7) }]}>{breakdown[0].unit}</Text>
                            </View>

                            {/* Secondary Units Row */}
                            <View style={styles.secondaryUnitsRow}>
                                {breakdown.slice(1).map((entry, i) => (
                                    <Text key={i} style={styles.secondaryUnitText}>
                                        <Text style={{ color: M3Colors.onSurface }}>{entry.value}</Text> {entry.unit}
                                        {i < breakdown.length - 2 ? ' · ' : ''}
                                    </Text>
                                ))}
                            </View>
                        </View>

                        {/* JOURNEY TIMELINE CARD */}
                        <View style={[styles.card, { borderColor: hexToRgba(tintColor, 0.3) }]}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>Current Journey</Text>
                                <Text style={styles.cardSubtitle}>Next: {nextLabel}</Text>
                            </View>

                            {/* Visual Timeline Bar */}
                            <View style={styles.timelineContainer}>
                                {/* Start Node */}
                                <View style={styles.timelineNode}>
                                    <View style={[styles.nodeDot, { backgroundColor: tintColor }]} />
                                    <Text style={styles.nodeLabel}>Start</Text>
                                </View>

                                {/* Visual Line */}
                                <View style={styles.timelineTrack}>
                                    <View style={[styles.timelineFill, { width: `${Math.round(progressPercent * 100)}%`, backgroundColor: tintColor }]} />
                                </View>

                                {/* Target Node (Star) */}
                                <View style={styles.timelineNode}>
                                    <View style={[styles.nodeIcon, { borderColor: tintColor }]}>
                                        <FontAwesome6 name="star" size={12} color={tintColor} />
                                    </View>
                                    <Text style={styles.nodeLabel}>Goal</Text>
                                </View>
                            </View>

                            <View style={styles.timelineMeta}>
                                <View style={styles.metaBadge}>
                                    <FontAwesome6 name="calendar-days" size={12} color={M3Colors.onSurfaceVariant} />
                                    <Text style={styles.metaText}>{formatDateForDisplay(item.startedAt)}</Text>
                                </View>
                                <View style={styles.metaBadge}>
                                    <FontAwesome6 name="clock" size={12} color={M3Colors.onSurfaceVariant} />
                                    {/* Safe check for progress.next existence */}
                                    <Text style={styles.metaText}>
                                        {progress.next ? formatTimeLeft(Math.max(0, progress.next.durationMs - progress.elapsedMs)) + ' left' : 'Completed'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* STATS BENTO BOX */}
                        <TrackingStatsCard
                            startedAt={item.startedAt}
                            resetHistory={item.resetHistory}
                            accentColor={tintColor}
                        />

                        {/* RESET HISTORY LIST */}
                        {item.resetHistory && item.resetHistory.length > 0 && (
                            <View style={styles.historySection}>
                                <Text style={styles.sectionTitle}>Reset History</Text>
                                <View style={styles.historyList}>
                                    {[...(item.resetHistory ?? [])]
                                        .sort((a, b) => new Date(b.resetAt).getTime() - new Date(a.resetAt).getTime())
                                        .map((entry, index) => {
                                            const durationMs = new Date(entry.resetAt).getTime() - new Date(entry.startedAt).getTime();
                                            const durationLabel = formatElapsedDurationLabel(durationMs);

                                            // Expressive Timeline Row
                                            return (
                                                <View key={index} style={styles.historyRow}>
                                                    {/* Timeline visual */}
                                                    <View style={styles.historyTimelineColumn}>
                                                        <View style={[styles.historyDot, { borderColor: tintColor }]} />
                                                        {index < (item.resetHistory?.length ?? 0) - 1 && <View style={styles.historyLine} />}
                                                    </View>

                                                    {/* Content */}
                                                    <View style={styles.historyContent}>
                                                        <Text style={styles.historyDate}>{formatDateForDisplay(entry.resetAt)}</Text>
                                                        <Text style={styles.historyDuration}>
                                                            Lasted {durationLabel}
                                                        </Text>
                                                    </View>
                                                </View>
                                            );
                                        })}
                                </View>
                            </View>
                        )}
                    </>
                );
            }}
        />
    );
}

const styles = StyleSheet.create({
    historySection: {
        marginTop: M3Spacing.xxl,
        paddingTop: M3Spacing.xl,
        borderTopWidth: 1,
        borderTopColor: M3Colors.outlineVariant,
    },
    sectionTitle: {
        ...M3Typography.titleMedium,
        color: M3Colors.onSurface,
        marginBottom: M3Spacing.lg,
    },
    historyList: {
        gap: 0,
    },
    historyRow: {
        flexDirection: 'row',
        minHeight: 56,
    },
    historyTimelineColumn: {
        width: 24,
        alignItems: 'center',
    },
    historyDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        backgroundColor: M3Colors.surface,
        borderColor: M3Colors.primary, // Type safety fallback
        marginTop: 6,
        zIndex: 1,
    },
    historyLine: {
        flex: 1,
        width: 2,
        backgroundColor: M3Colors.surfaceContainerHigh,
        marginVertical: 4,
    },
    historyContent: {
        flex: 1,
        paddingLeft: M3Spacing.md,
        paddingBottom: M3Spacing.lg,
    },
    historyDate: {
        ...M3Typography.labelLarge,
        color: M3Colors.onSurface,
        marginBottom: 2,
    },
    historyDuration: {
        ...M3Typography.bodyMedium,
        color: M3Colors.onSurfaceVariant,
    },

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
    secondaryUnitsRow: {
        flexDirection: 'row',
        marginTop: -M3Spacing.sm,
    },
    secondaryUnitText: {
        ...M3Typography.bodyLarge,
        color: M3Colors.onSurfaceVariant,
    },

    // Card Styles
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
        alignItems: 'baseline',
        marginBottom: M3Spacing.xl,
    },
    cardTitle: {
        ...M3Typography.titleMedium,
        color: M3Colors.onSurface,
    },
    cardSubtitle: {
        ...M3Typography.labelMedium,
        color: M3Colors.onSurfaceVariant,
    },

    // Timeline Visuals
    timelineContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: M3Spacing.lg,
        height: 40,
    },
    timelineTrack: {
        flex: 1,
        height: 4,
        backgroundColor: M3Colors.surfaceContainerHigh,
        marginHorizontal: M3Spacing.sm,
        borderRadius: M3Radius.full,
        overflow: 'hidden',
    },
    timelineFill: {
        height: '100%',
        borderRadius: M3Radius.full,
    },
    timelineNode: {
        alignItems: 'center',
        width: 40,
    },
    nodeDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginBottom: 4,
    },
    nodeIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: M3Colors.surfaceContainer,
        marginBottom: 4,
        top: -6,
    },
    nodeLabel: {
        ...M3Typography.labelSmall,
        color: M3Colors.onSurfaceVariant,
        position: 'absolute',
        bottom: -16,
        width: 60,
        textAlign: 'center',
    },

    timelineMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: M3Spacing.sm,
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
});
