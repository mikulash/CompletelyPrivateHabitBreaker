import { FontAwesome6 } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';

import { Text } from '@/components/Themed';
import { hexToRgba, M3Colors, M3Radius, M3Spacing, M3Typography } from '@/constants/theme';
import type { ColdTurkeyResetEntry } from '@/types/tracking';
import { formatDateForDisplay } from '@/utils/date';
import { formatElapsedDurationLabel } from '@/utils/tracker';

type ResetHistoryCalendarProps = {
    resetHistory?: ColdTurkeyResetEntry[];
    accentColor: string;
};

type ResetEntryWithDuration = ColdTurkeyResetEntry & {
    durationMs: number;
};

type GroupedResets = Record<string, ResetEntryWithDuration[]>;

type MultiDotMarking = {
    dots: { key: string; color: string }[];
    selected?: boolean;
    selectedColor?: string;
};
type MultiDotMarkedDates = Record<string, MultiDotMarking>;

/** Converts an ISO timestamp to a YYYY-MM-DD date key. */
const toDateKey = (iso: string): string => {
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const TODAY_KEY = toDateKey(new Date().toISOString());

/** Custom day cell that shows 1-3 dots or a count badge for >3. */
function CustomDay({
    date,
    state,
    marking,
    onPress,
    accentColor,
}: {
    date?: DateData;
    state?: string;
    marking?: MultiDotMarking;
    onPress?: (date: DateData) => void;
    accentColor: string;
}) {
    if (!date) return null;

    const isToday = date.dateString === TODAY_KEY;
    const isDisabled = state === 'disabled';
    const isSelected = marking?.selected;
    const dots = marking?.dots ?? [];
    const count = dots.length;

    return (
        <TouchableOpacity
            onPress={() => onPress?.(date)}
            disabled={isDisabled}
            style={[
                dayStyles.wrapper,
                isSelected && { backgroundColor: hexToRgba(accentColor, 0.25), borderRadius: 20 },
            ]}
            activeOpacity={0.6}
        >
            <Text
                style={[
                    dayStyles.dayText,
                    isToday && { color: accentColor, fontWeight: '700' },
                    isDisabled && { color: hexToRgba(M3Colors.onSurface, 0.3) },
                ]}
            >
                {date.day}
            </Text>

            {count > 0 && count <= 3 && (
                <View style={dayStyles.dotsRow}>
                    {dots.map((dot) => (
                        <View
                            key={dot.key}
                            style={[dayStyles.dot, { backgroundColor: dot.color }]}
                        />
                    ))}
                </View>
            )}

            {count > 3 && (
                <View style={[dayStyles.countBadge, { backgroundColor: hexToRgba(accentColor, 0.25) }]}>
                    <Text style={[dayStyles.countText, { color: accentColor }]}>{count}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const dayStyles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
    },
    dayText: {
        fontSize: 14,
        color: M3Colors.onSurface,
        fontWeight: '400',
    },
    dotsRow: {
        flexDirection: 'row',
        gap: 2,
        marginTop: 1,
        height: 6,
        alignItems: 'center',
    },
    dot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
    countBadge: {
        marginTop: 1,
        borderRadius: 6,
        paddingHorizontal: 4,
        height: 12,
        minWidth: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    countText: {
        fontSize: 8,
        fontWeight: '800',
    },
});

export function ResetHistoryCalendar({ resetHistory, accentColor }: ResetHistoryCalendarProps) {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // Group reset entries by their resetAt date
    const grouped: GroupedResets = useMemo(() => {
        if (!resetHistory || resetHistory.length === 0) return {};

        const map: GroupedResets = {};
        for (const entry of resetHistory) {
            const start = new Date(entry.startedAt).getTime();
            const reset = new Date(entry.resetAt).getTime();
            if (!Number.isFinite(start) || !Number.isFinite(reset) || reset <= start) continue;

            const key = toDateKey(entry.resetAt);
            if (!map[key]) map[key] = [];
            map[key].push({ ...entry, durationMs: reset - start });
        }

        // Sort each day's entries by time (newest first)
        for (const key of Object.keys(map)) {
            map[key].sort((a, b) => new Date(b.resetAt).getTime() - new Date(a.resetAt).getTime());
        }

        return map;
    }, [resetHistory]);

    // Build multi-dot markedDates for the calendar
    const markedDates: MultiDotMarkedDates = useMemo(() => {
        const marks: MultiDotMarkedDates = {};

        for (const [dateKey, entries] of Object.entries(grouped)) {
            const dots = entries.map((_entry, i) => ({
                key: `reset-${dateKey}-${i}`,
                color: accentColor,
            }));
            marks[dateKey] = {
                dots,
                ...(dateKey === selectedDate
                    ? { selected: true, selectedColor: hexToRgba(accentColor, 0.25) }
                    : {}),
            };
        }

        // Highlight selected date even if it has no resets
        if (selectedDate && !marks[selectedDate]) {
            marks[selectedDate] = {
                dots: [],
                selected: true,
                selectedColor: hexToRgba(accentColor, 0.15),
            };
        }

        return marks;
    }, [grouped, selectedDate, accentColor]);

    // Stable custom day renderer bound to the current accent color
    const renderDay = useCallback(
        (props: any) => <CustomDay {...props} accentColor={accentColor} />,
        [accentColor],
    );

    const handleDayPress = useCallback(
        (day: DateData) => {
            const key = day.dateString;
            if (grouped[key]) {
                setSelectedDate(key);
            }
        },
        [grouped],
    );

    const selectedEntries = selectedDate ? grouped[selectedDate] ?? [] : [];

    if (!resetHistory || resetHistory.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Reset History</Text>

            <View style={[styles.calendarCard, { borderColor: hexToRgba(accentColor, 0.3) }]}>
                <Calendar
                    markedDates={markedDates}
                    markingType="multi-dot"
                    onDayPress={handleDayPress}
                    dayComponent={renderDay}
                    enableSwipeMonths
                    theme={{
                        backgroundColor: 'transparent',
                        calendarBackground: 'transparent',
                        textSectionTitleColor: M3Colors.onSurfaceVariant,
                        arrowColor: accentColor,
                        monthTextColor: M3Colors.onSurface,
                        textMonthFontWeight: '600',
                        textMonthFontSize: 16,
                        textDayHeaderFontSize: 12,
                        textDayHeaderFontWeight: '600' as any,
                    }}
                    style={styles.calendar}
                />
            </View>

            {/* Day-tap Detail Modal */}
            <Modal
                transparent
                visible={selectedDate !== null && selectedEntries.length > 0}
                onRequestClose={() => setSelectedDate(null)}
                animationType="fade"
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setSelectedDate(null)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => { /* prevent close when tapping content */ }}
                        style={[styles.modalContent, { borderColor: hexToRgba(accentColor, 0.4) }]}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {selectedDate ? formatDateForDisplay(selectedDate) : ''}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setSelectedDate(null)}
                                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            >
                                <FontAwesome6 name="xmark" size={18} color={M3Colors.onSurfaceVariant} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>
                            {selectedEntries.length} {selectedEntries.length === 1 ? 'reset' : 'resets'} on this day
                        </Text>

                        <View style={styles.entriesList}>
                            {selectedEntries.map((entry, index) => {
                                const durationLabel = formatElapsedDurationLabel(entry.durationMs);
                                return (
                                    <View key={index} style={styles.entryRow}>
                                        {/* Timeline visual */}
                                        <View style={styles.entryTimelineCol}>
                                            <View style={[styles.entryDot, { borderColor: accentColor }]} />
                                            {index < selectedEntries.length - 1 && (
                                                <View style={styles.entryLine} />
                                            )}
                                        </View>

                                        {/* Content */}
                                        <View style={styles.entryContent}>
                                            <Text style={styles.entryDate}>
                                                {formatDateForDisplay(entry.resetAt)}
                                            </Text>
                                            <Text style={styles.entryDuration}>
                                                Lasted {durationLabel}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
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
    calendarCard: {
        backgroundColor: M3Colors.surfaceContainer,
        borderRadius: M3Radius.extraLarge,
        borderWidth: 1,
        overflow: 'hidden',
        paddingBottom: M3Spacing.sm,
    },
    calendar: {
        backgroundColor: 'transparent',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: M3Spacing.xxl,
    },
    modalContent: {
        backgroundColor: M3Colors.surfaceContainer,
        borderRadius: M3Radius.extraLarge,
        borderWidth: 1,
        width: '100%',
        maxHeight: '70%',
        padding: M3Spacing.xl,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: M3Spacing.xs,
    },
    modalTitle: {
        ...M3Typography.titleMedium,
        color: M3Colors.onSurface,
    },
    modalSubtitle: {
        ...M3Typography.bodyMedium,
        color: M3Colors.onSurfaceVariant,
        marginBottom: M3Spacing.xl,
    },

    // Timeline entries (matching the old history list style)
    entriesList: {
        gap: 0,
    },
    entryRow: {
        flexDirection: 'row',
        minHeight: 56,
    },
    entryTimelineCol: {
        width: 24,
        alignItems: 'center',
    },
    entryDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        backgroundColor: M3Colors.surfaceContainer,
        marginTop: 6,
        zIndex: 1,
    },
    entryLine: {
        flex: 1,
        width: 2,
        backgroundColor: M3Colors.surfaceContainerHigh,
        marginVertical: 4,
    },
    entryContent: {
        flex: 1,
        paddingLeft: M3Spacing.md,
        paddingBottom: M3Spacing.lg,
    },
    entryDate: {
        ...M3Typography.labelLarge,
        color: M3Colors.onSurface,
        marginBottom: 2,
    },
    entryDuration: {
        ...M3Typography.bodyMedium,
        color: M3Colors.onSurfaceVariant,
    },
});
