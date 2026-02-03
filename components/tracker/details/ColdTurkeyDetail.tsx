import { FontAwesome6 } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { useElapsedBreakdown } from '@/hooks/useElapsedBreakdown';
import { ColdTurkeyTrackedItem } from '@/types/tracking';
import { formatDateForDisplay, formatTimeLeft } from '@/utils/date';
import {
    formatElapsedDurationLabel,
    getColdTurkeyProgress,
    getColdTurkeyStreakTargets,
    getTrackerIcon,
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
    const progressPercent = progress.next ? progress.progressToNext : 1;

    return (
        <TrackerDetailTemplate
            {...props}
            renderSummary={(item) => {
                const icon = getTrackerIcon(item.type);
                const { last, record } = getColdTurkeyStreakTargets(item.resetHistory);

                const lastDurationMs = last?.durationMs ?? 0;
                const hasLastTarget = lastDurationMs > 0;
                const lastProgress = hasLastTarget ? Math.min(1, progress.elapsedMs / lastDurationMs) : 0;
                const hasGoneLonger = hasLastTarget && progress.elapsedMs >= lastDurationMs;
                const lastRemainingMs = hasLastTarget ? Math.max(0, lastDurationMs - progress.elapsedMs) : 0;
                const lastTimeLeftLabel = hasLastTarget && lastRemainingMs > 0 ? formatTimeLeft(lastRemainingMs) : '';
                const lastDurationLabel = hasLastTarget ? formatElapsedDurationLabel(lastDurationMs) : '';

                const recordDurationMs = record?.durationMs ?? 0;
                const hasRecordTarget = recordDurationMs > 0;
                const recordProgress = hasRecordTarget ? Math.min(1, progress.elapsedMs / recordDurationMs) : 0;
                const recordRemainingMs = hasRecordTarget ? Math.max(0, recordDurationMs - progress.elapsedMs) : 0;
                const hasHitRecord = hasRecordTarget && progress.elapsedMs >= recordDurationMs;
                const recordTimeLeftLabel = hasRecordTarget && recordRemainingMs > 0 ? formatTimeLeft(recordRemainingMs) : '';
                const recordDurationLabel = hasRecordTarget ? formatElapsedDurationLabel(recordDurationMs) : '';
                const shouldShowRecordProgress = hasRecordTarget && hasGoneLonger;
                const shouldShowLastProgressBar = hasLastTarget && !hasGoneLonger;
                const shouldShowRecordProgressBar = shouldShowRecordProgress && !hasHitRecord;

                const milestoneChips = [...progress.achieved];
                if (hasGoneLonger) {
                    milestoneChips.push({
                        label: 'Going longer than last time',
                        durationMs: lastDurationMs || progress.elapsedMs,
                        color: {
                            border: '#facc15',
                            bg: 'rgba(250, 204, 21, 0.16)',
                            iconBg: 'rgba(250, 204, 21, 0.22)',
                            text: '#fef3c7',
                        },
                    });
                }
                if (hasHitRecord) {
                    milestoneChips.push({
                        label: 'Record time',
                        durationMs: recordDurationMs || progress.elapsedMs,
                        color: {
                            border: '#fbbf24',
                            bg: 'rgba(251, 191, 36, 0.18)',
                            iconBg: 'rgba(251, 191, 36, 0.24)',
                            text: '#fef9c3',
                        },
                    });
                }
                const hasMilestones = milestoneChips.length > 0;

                const resetHistory = [...(item.resetHistory ?? [])]
                    .filter((entry) => {
                        const start = new Date(entry.startedAt).getTime();
                        const reset = new Date(entry.resetAt).getTime();
                        return Number.isFinite(start) && Number.isFinite(reset) && reset >= start;
                    })
                    .sort((a, b) => new Date(b.resetAt).getTime() - new Date(a.resetAt).getTime());

                const resetRows = resetHistory.map((entry, index) => {
                    const rangeLabel = `${formatDateForDisplay(entry.startedAt)} - ${formatDateForDisplay(entry.resetAt)}`;
                    const durationMs = new Date(entry.resetAt).getTime() - new Date(entry.startedAt).getTime();
                    const durationLabel = formatElapsedDurationLabel(durationMs);
                    const subtitle = `${rangeLabel}${durationLabel ? ` - ${durationLabel}` : ''}`;

                    return (
                        <View key={`${entry.resetAt}-${index}`} style={styles.resetRow}>
                            <View style={styles.resetRowBullet} />
                            <View style={styles.resetRowContent}>
                                <Text style={styles.resetRowTitle}>{`Reset on ${formatDateForDisplay(entry.resetAt)}`}</Text>
                                <Text style={styles.resetRowSubtitle}>{subtitle}</Text>
                            </View>
                        </View>
                    );
                });

                const currentDuration = formatElapsedDurationLabel(progress.elapsedMs);
                const currentSubtitle = `${formatDateForDisplay(item.startedAt)} - Present${
                    currentDuration ? ` - ${currentDuration}${currentDuration === 'Less than a second' ? '' : ' so far'}` : ''
                }`;

                return (
                    <>
                        <TrackingStatsCard
                            startedAt={item.startedAt}
                            resetHistory={item.resetHistory}
                            accentColor={icon.color}
                        />
                        <View style={[styles.summaryCard, styles.coldSummary]}>
                        <View style={styles.summaryHeader}>
                            <Text style={styles.summaryTitle}>{item.name}</Text>
                            <View style={[styles.summaryIcon, styles.coldIcon]}>
                                <FontAwesome6 color={icon.color} name={icon.name} size={32} />
                            </View>
                        </View>

                        <Text style={styles.summarySubtitle}>Cold turkey commitment</Text>

                        <View style={styles.breakdownStack}>
                            {breakdown.map((entry, index) => (
                                <Text key={`${entry.unit}-${index}`} style={[styles.breakdownRow, styles.coldHighlight]}>
                                    {entry.value} {entry.unit}
                                </Text>
                            ))}
                        </View>

                        {/* Stepper-style progress */}
                        <View style={styles.stepperContainer} accessibilityLabel="Progress timeline">
                            <View style={styles.stepperLine} />
                            <View style={[styles.stepperFillLine, { width: `${Math.round(progressPercent * 100)}%` }]} />
                            <View style={[styles.stepperDot, styles.stepperDotLeft]}>
                                <View style={styles.stepperDotInner} />
                            </View>
                            <View style={[styles.stepperDot, styles.stepperDotRight]}>
                                <View style={styles.stepperDotInner} />
                            </View>
                        </View>
                        <View style={styles.stepperLabels}>
                            <Text style={styles.stepperLabel}>{formatDateForDisplay(item.startedAt)}</Text>
                            <Text style={[styles.stepperLabel, styles.stepperLabelRight]}>
                                {progress.next ? progress.next.label : 'All milestones achieved'}
                            </Text>
                        </View>

                        {hasLastTarget ? (
                            <View style={styles.streakProgressSection}>
                                {shouldShowLastProgressBar ? (
                                    <View style={[styles.streakProgressBar, styles.lastProgressBar]}>
                                        <View
                                            style={[
                                                styles.streakProgressFill,
                                                styles.lastProgressFill,
                                                { width: `${Math.round(Math.min(1, lastProgress) * 100)}%` },
                                            ]}
                                        />
                                    </View>
                                ) : null}

                                {/* Inline label + trophy when beaten */}
                                <View style={styles.inlineRow}>
                                    <Text style={styles.streakProgressLabel}>
                                        {hasGoneLonger
                                            ? `Beat last streak (${lastDurationLabel})`
                                            : `Beat last streak (${lastDurationLabel})${
                                                lastTimeLeftLabel ? ` | ${lastTimeLeftLabel} left` : ''
                                            }`}
                                    </Text>
                                    {hasGoneLonger ? <FontAwesome6 name="trophy" size={14} color="#facc15" /> : null}
                                </View>
                            </View>
                        ) : null}

                        {shouldShowRecordProgress ? (
                            <View style={styles.streakProgressSection}>
                                {shouldShowRecordProgressBar ? (
                                    <View style={[styles.streakProgressBar, styles.recordProgressBar]}>
                                        <View
                                            style={[
                                                styles.streakProgressFill,
                                                styles.recordProgressFill,
                                                { width: `${Math.round(Math.min(1, recordProgress) * 100)}%` },
                                            ]}
                                        />
                                    </View>
                                ) : null}

                                {/* Inline label + trophy when record hit */}
                                <View style={styles.inlineRow}>
                                    <Text style={[styles.streakProgressLabel, styles.recordProgressLabel]}>
                                        {hasHitRecord
                                            ? `Record streak (${recordDurationLabel})`
                                            : `Record streak (${recordDurationLabel})${
                                                recordTimeLeftLabel ? ` | ${recordTimeLeftLabel} left` : ''
                                            }`}
                                    </Text>
                                    {hasHitRecord ? <FontAwesome6 name="trophy" size={14} color="#fde047" /> : null}
                                </View>
                            </View>
                        ) : null}

                        {hasMilestones ? (
                            <View style={styles.milestonesSection}>
                                <View style={styles.milestonesTitleRow}>
                                    <Text style={styles.milestonesTitle}>Milestones achieved</Text>
                                    <FontAwesome6 name="trophy" size={14} color="#60a5fa" />
                                </View>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.milestonesList}
                                >
                                    {milestoneChips.map((milestone, idx) => {
                                        const isLatest = idx === milestoneChips.length - 1;
                                        const iconName = milestone.label === 'Record time' ? 'medal' : 'trophy';
                                        const c =
                                            milestone.color ??
                                            {
                                                border: '#60a5fa',
                                                bg: 'rgba(96, 165, 250, 0.16)',
                                                iconBg: 'rgba(96, 165, 250, 0.22)',
                                                text: '#dbeafe',
                                            };
                                        return (
                                            <View
                                                key={`${milestone.label}-${idx}`}
                                                style={[
                                                    styles.milestoneChip,
                                                    isLatest && styles.milestoneChipLatest,
                                                    { backgroundColor: c.bg, borderColor: c.border, shadowColor: c.border },
                                                ]}
                                                accessibilityLabel={`Achieved milestone: ${milestone.label}`}
                                            >
                                                <View
                                                    style={[
                                                        styles.milestoneIconWrap,
                                                        { backgroundColor: c.iconBg, borderColor: c.border },
                                                    ]}
                                                >
                                                    <FontAwesome6 name={iconName} size={12} color={c.border} />
                                                </View>
                                                <Text style={[styles.milestoneChipText, { color: c.text }]}>{milestone.label}</Text>
                                            </View>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        ) : null}

                        <View style={styles.resetHistorySection}>
                            <View style={styles.resetHistoryHeader}>
                                <FontAwesome6 name="clock-rotate-left" size={14} color="#6ee7b7" />
                                <Text style={styles.resetHistoryTitle}>Reset timeline</Text>
                            </View>

                            <View style={styles.resetTimeline}>
                                <View style={styles.resetRow}>
                                    <View style={[styles.resetRowBullet, styles.resetRowBulletCurrent]} />
                                    <View style={styles.resetRowContent}>
                                        <Text style={styles.resetRowTitle}>Current streak</Text>
                                        <Text style={styles.resetRowSubtitle}>{currentSubtitle}</Text>
                                    </View>
                                </View>
                                {resetRows}
                            </View>

                            {resetRows.length === 0 ? (
                                <Text style={styles.resetHistoryEmptyText}>No previous resets logged yet.</Text>
                            ) : null}
                        </View>
                        </View>
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
    coldSummary: {
        borderWidth: 1,
        borderColor: 'rgba(52, 211, 153, 0.5)',
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
    coldIcon: {
        backgroundColor: 'rgba(52, 211, 153, 0.15)',
    },
    summarySubtitle: {
        color: '#6ee7b7',
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
    coldHighlight: {
        color: '#34d399',
    },
    breakdownStack: {
        marginTop: 12,
        gap: 4,
    },
    breakdownRow: {
        fontSize: 16,
        fontWeight: '600',
    },
    progressContainer: {
        marginTop: 16,
        gap: 8,
    },
    progressBar: {
        height: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(52, 211, 153, 0.2)',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#34d399',
    },
    progressLabel: {
        color: '#a7f3d0',
        fontSize: 13,
        fontWeight: '600',
    },
    // Stepper styles
    stepperContainer: {
        marginTop: 16,
        height: 38,
        justifyContent: 'center',
    },
    stepperLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 18,
        height: 4,
        backgroundColor: 'rgba(52, 211, 153, 0.25)',
        borderRadius: 2,
    },
    stepperFillLine: {
        position: 'absolute',
        left: 0,
        top: 18,
        height: 4,
        backgroundColor: '#34d399',
        borderRadius: 2,
    },
    stepperDot: {
        position: 'absolute',
        top: 7,
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 3,
        borderColor: '#34d399',
        backgroundColor: '#18181f',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperDotInner: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#34d399',
    },
    stepperDotLeft: {
        left: 0,
    },
    stepperDotRight: {
        right: 0,
    },
    stepperLabels: {
        marginTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    stepperLabel: {
        color: '#a7f3d0',
        fontSize: 12,
        fontWeight: '700',
    },
    stepperLabelRight: {
        textAlign: 'right',
    },
    streakProgressSection: {
        marginTop: 16,
        gap: 8,
    },
    streakProgressBar: {
        height: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(52, 211, 153, 0.16)',
        overflow: 'hidden',
    },
    streakProgressFill: {
        height: '100%',
        backgroundColor: '#34d399',
    },
    lastProgressBar: {
        backgroundColor: 'rgba(96, 165, 250, 0.18)',
    },
    lastProgressFill: {
        backgroundColor: '#60a5fa',
    },
    recordProgressBar: {
        backgroundColor: 'rgba(59, 130, 246, 0.18)',
    },
    recordProgressFill: {
        backgroundColor: '#38bdf8',
    },
    streakProgressLabel: {
        color: '#bfdbfe',
        fontSize: 13,
        fontWeight: '600',
    },
    recordProgressLabel: {
        color: '#a5f3fc',
    },
    // Removed separate achievement rows; keeping styles in case reused elsewhere
    streakAchievement: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    streakAchievementText: {
        color: '#fef3c7',
        fontWeight: '600',
        fontSize: 13,
    },
    // New: inline row for label + icon
    inlineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    milestonesSection: {
        marginTop: 18,
        gap: 10,
    },
    milestonesTitle: {
        color: '#6ee7b7',
        fontWeight: '700',
        fontSize: 14,
    },
    milestonesTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    milestonesList: {
        flexDirection: 'row',
        gap: 10,
        paddingRight: 6,
    },
    milestoneChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        shadowOpacity: 0.25,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    milestoneChipLatest: {
        borderWidth: 1.5,
        shadowRadius: 8,
    },
    milestoneIconWrap: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    milestoneChipText: {
        color: '#e5e7eb',
        fontWeight: '600',
        fontSize: 13,
    },
    resetHistorySection: {
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(110, 231, 183, 0.2)',
        gap: 12,
    },
    resetHistoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    resetHistoryTitle: {
        color: '#6ee7b7',
        fontWeight: '700',
        fontSize: 14,
    },
    resetTimeline: {
        marginTop: 8,
        gap: 12,
    },
    resetRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    resetRowBullet: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginTop: 6,
        backgroundColor: 'rgba(110, 231, 183, 0.3)',
    },
    resetRowBulletCurrent: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#34d399',
    },
    resetRowContent: {
        flex: 1,
    },
    resetRowTitle: {
        color: '#e5e7eb',
        fontWeight: '600',
        fontSize: 13,
    },
    resetRowSubtitle: {
        color: '#9ca3af',
        marginTop: 4,
        fontSize: 12,
    },
    resetHistoryEmptyText: {
        color: '#6b7280',
        fontSize: 12,
        marginTop: 8,
    },
});
