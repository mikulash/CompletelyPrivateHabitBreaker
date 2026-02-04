import {
    DateTimePickerAndroid,
    type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Modal,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { Text } from '@/components/Themed';
import { M3Colors, M3Radius, M3Spacing, hexToRgba } from '@/constants/theme';
import { TRACKER_TYPES } from '@/constants/trackerTypes';
import { useTrackedItems } from '@/contexts/TrackedItemsContext';
import { TrackerType } from '@/enums/TrackerType';
import { ColdTurkeyTrackedItem, DosageUnit, DoseDecreaseTrackedItem } from '@/types/tracking';
import { formatDateForDisplay } from '@/utils/date';

type CreateTrackerModalProps = {
    visible: boolean;
    onClose: () => void;
};

export function CreateTrackerModal({ visible, onClose }: CreateTrackerModalProps) {
    const { addItem } = useTrackedItems();

    const [name, setName] = useState('');
    const [date, setDate] = useState<Date>(new Date());
    const [selectedType, setSelectedType] = useState<TrackerType>(TrackerType.ColdTurkey);
    const [dosageValue, setDosageValue] = useState<string>('');
    const [dosageUnit, setDosageUnit] = useState<DosageUnit>('mg');
    const [defaultDoseValue, setDefaultDoseValue] = useState<string>('');

    useEffect(() => {
        if (visible) {
            const now = new Date();
            setName('');
            setDate(now);
            setSelectedType(TrackerType.ColdTurkey);
            setDosageValue('');
            setDosageUnit('g');
            setDefaultDoseValue('');
        }
    }, [visible]);

    const isDosage = selectedType === TrackerType.SlowLoweringTheDosage;
    const isAmountValid = !isDosage || (dosageValue.trim().length > 0 && !Number.isNaN(Number(dosageValue)));
    const isSaveDisabled = !name.trim() || !isAmountValid;

    // Formatters
    const formattedDate = useMemo(
        () => formatDateForDisplay(date.toISOString()),
        [date]
    );
    const formattedTime = useMemo(() => {
        const h = String(date.getHours()).padStart(2, '0');
        const m = String(date.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
    }, [date]);

    const openAndroidDatePicker = () => {
        DateTimePickerAndroid.open({
            value: date,
            mode: 'date',
            onChange: (event: DateTimePickerEvent, selectedDate?: Date) => {
                if (event.type !== 'set' || !selectedDate) return;
                // preserve time from current state
                const next = new Date(selectedDate);
                next.setHours(date.getHours(), date.getMinutes(), 0, 0);
                setDate(next);
            },
        });
    };

    const openAndroidTimePicker = () => {
        DateTimePickerAndroid.open({
            value: date,
            mode: 'time',
            onChange: (event: DateTimePickerEvent, selectedTime?: Date) => {
                if (event.type !== 'set' || !selectedTime) return;
                // preserve date from current state
                const next = new Date(date);
                next.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
                setDate(next);
            },
        });
    };

    const handleSave = () => {
        const trimmedName = name.trim();
        if (!trimmedName) return;

        if (selectedType === TrackerType.SlowLoweringTheDosage) {
            const amount = Number.parseFloat(dosageValue);
            const defDose = defaultDoseValue ? Number.parseFloat(defaultDoseValue) : undefined;

            const item: DoseDecreaseTrackedItem = {
                id: `${Date.now()}`,
                name: trimmedName,
                startedAt: date.toISOString(),
                notifiedMilestones: [],
                resetHistory: [],
                type: TrackerType.SlowLoweringTheDosage,
                currentUsageValue: Number.isFinite(amount) ? amount : 0,
                currentUsageUnit: dosageUnit,
                defaultDose: (defDose && Number.isFinite(defDose)) ? defDose : undefined,
            };
            addItem(item);
        } else {
            const item: ColdTurkeyTrackedItem = {
                id: `${Date.now()}`,
                name: trimmedName,
                startedAt: date.toISOString(),
                notifiedMilestones: [],
                type: TrackerType.ColdTurkey,
                resetHistory: [],
            };
            addItem(item);
        }
        onClose();
    };

    return (
        <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Create a tracker</Text>

                    <Text style={styles.inputLabel}>Name</Text>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="What are you tracking?"
                        placeholderTextColor="#888"
                        style={styles.input}
                    />

                    <Text style={styles.inputLabel}>Start date</Text>
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                        <TouchableOpacity style={[styles.dateButton, { flex: 1 }]} onPress={openAndroidDatePicker}>
                            <Text style={styles.dateButtonText}>{formattedDate}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.dateButton, { width: 110 }]} onPress={openAndroidTimePicker}>
                            <Text style={styles.dateButtonText}>{formattedTime}</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.inputLabel}>Type</Text>
                    <View style={styles.typeSelector}>
                        {TRACKER_TYPES.map((type, index) => {
                            const isSelected = selectedType === type.value;
                            return (
                                <TouchableOpacity
                                    key={type.value}
                                    onPress={() => setSelectedType(type.value)}
                                    style={[
                                        styles.typeOption,
                                        index === TRACKER_TYPES.length - 1 && styles.typeOptionLast,
                                        isSelected && styles.typeOptionSelected,
                                    ]}
                                >
                                    <Text style={[styles.typeOptionText, isSelected && styles.typeOptionTextSelected]}>
                                        {type.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {selectedType === TrackerType.SlowLoweringTheDosage ? (
                        <>
                            <Text style={styles.inputLabel}>Current daily input/intake</Text>
                            <View style={styles.usageRow}>
                                <TextInput
                                    value={dosageValue}
                                    onChangeText={setDosageValue}
                                    placeholder="Amount"
                                    placeholderTextColor="#888"
                                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                    keyboardType="decimal-pad"
                                    inputMode="decimal"
                                />
                                <View style={styles.unitSelector}>
                                    <TouchableOpacity
                                        style={[styles.unitOption, dosageUnit === 'mg' && styles.unitOptionSelected]}
                                        onPress={() => setDosageUnit('mg')}
                                    >
                                        <Text style={[styles.unitOptionText, dosageUnit === 'mg' && styles.unitOptionTextSelected]}>mg</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.unitOption, dosageUnit === 'g' && styles.unitOptionSelected]}
                                        onPress={() => setDosageUnit('g')}
                                    >
                                        <Text style={[styles.unitOptionText, dosageUnit === 'g' && styles.unitOptionTextSelected]}>g</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <Text style={styles.inputLabel}>Default quick log amount (optional)</Text>
                            <TextInput
                                value={defaultDoseValue}
                                onChangeText={setDefaultDoseValue}
                                placeholder={`e.g. 3 (${dosageUnit})`}
                                placeholderTextColor="#888"
                                style={styles.input}
                                keyboardType="decimal-pad"
                            />
                        </>
                    ) : null}

                    <View style={styles.modalActions}>
                        <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={onClose}>
                            <Text style={styles.modalButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.saveButton, isSaveDisabled && styles.disabledButton]}
                            onPress={handleSave}
                            disabled={isSaveDisabled}
                        >
                            <Text style={[styles.modalButtonText, styles.saveButtonText]}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: hexToRgba(M3Colors.scrim, 0.6),
        alignItems: 'center',
        justifyContent: 'center',
        padding: M3Spacing.xxl,
    },
    modalContent: {
        backgroundColor: M3Colors.surfaceContainerHigh,
        borderRadius: M3Radius.extraLarge,
        width: '100%',
        padding: M3Spacing.xxl,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '500',
        color: M3Colors.onSurface,
        marginBottom: M3Spacing.xl,
    },
    inputLabel: {
        color: M3Colors.onSurfaceVariant,
        fontSize: 12,
        fontWeight: '500',
        marginBottom: M3Spacing.xs,
    },
    input: {
        backgroundColor: M3Colors.surfaceContainer,
        color: M3Colors.onSurface,
        borderRadius: M3Radius.medium,
        paddingHorizontal: M3Spacing.lg,
        paddingVertical: M3Spacing.md,
        marginBottom: M3Spacing.lg,
        fontSize: 14,
    },
    dateButton: {
        backgroundColor: M3Colors.surfaceContainer,
        borderRadius: M3Radius.medium,
        paddingHorizontal: M3Spacing.lg,
        paddingVertical: M3Spacing.md,
    },
    dateButtonText: {
        color: M3Colors.onSurface,
        fontWeight: '500',
        textAlign: 'center',
        fontSize: 14,
    },
    typeSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: M3Spacing.xl,
    },
    typeOption: {
        flex: 1,
        paddingVertical: M3Spacing.md,
        marginRight: M3Spacing.md,
        borderRadius: M3Radius.medium,
        backgroundColor: M3Colors.surfaceContainer,
        alignItems: 'center',
    },
    typeOptionLast: {
        marginRight: 0,
    },
    typeOptionSelected: {
        backgroundColor: M3Colors.primaryContainer,
    },
    typeOptionText: {
        color: M3Colors.onSurfaceVariant,
        fontWeight: '500',
        fontSize: 13,
    },
    typeOptionTextSelected: {
        color: M3Colors.onPrimaryContainer,
    },
    usageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: M3Spacing.md,
        marginBottom: M3Spacing.lg,
    },
    unitSelector: {
        flexDirection: 'row',
        gap: M3Spacing.sm,
    },
    unitOption: {
        backgroundColor: M3Colors.surfaceContainer,
        borderRadius: M3Radius.medium,
        paddingVertical: M3Spacing.md,
        paddingHorizontal: M3Spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    unitOptionSelected: {
        backgroundColor: M3Colors.secondaryContainer,
    },
    unitOptionText: {
        color: M3Colors.onSurfaceVariant,
        fontWeight: '500',
        fontSize: 14,
    },
    unitOptionTextSelected: {
        color: M3Colors.onSecondaryContainer,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: M3Spacing.lg,
    },
    modalButton: {
        paddingVertical: M3Spacing.md,
        paddingHorizontal: M3Spacing.lg,
        borderRadius: M3Radius.medium,
        marginLeft: M3Spacing.sm,
    },
    cancelButton: {
        backgroundColor: 'transparent',
    },
    saveButton: {
        backgroundColor: M3Colors.primary,
        paddingHorizontal: M3Spacing.xxl,
    },
    disabledButton: {
        opacity: 0.5,
    },
    modalButtonText: {
        color: M3Colors.primary,
        fontWeight: '500',
        fontSize: 14,
    },
    saveButtonText: {
        color: M3Colors.onPrimary,
    },
});

