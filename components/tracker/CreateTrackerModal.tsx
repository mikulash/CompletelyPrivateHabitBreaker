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
import { TRACKER_TYPES } from '@/constants/trackerTypes';
import { useTrackedItems } from '@/contexts/TrackedItemsContext';
import { TrackerType } from '@/enums/TrackerType';
import { formatDateForDisplay } from '@/utils/date';
import { ColdTurkeyTrackedItem, DoseDecreaseTrackedItem, DosageUnit } from '@/types/tracking';

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

    useEffect(() => {
        if (visible) {
            const now = new Date();
            setName('');
            setDate(now);
            setSelectedType(TrackerType.ColdTurkey);
            setDosageValue('');
            setDosageUnit('g');
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
            const amount = parseFloat(dosageValue);
            const item: DoseDecreaseTrackedItem = {
                id: `${Date.now()}`,
                name: trimmedName,
                startedAt: date.toISOString(),
                notifiedMilestones: [],
                resetHistory: [],
                type: TrackerType.SlowLoweringTheDosage,
                currentUsageValue: Number.isFinite(amount) ? amount : 0,
                currentUsageUnit: dosageUnit,
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
                            <Text style={styles.inputLabel}>Current regular usage</Text>
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
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#1f1f29',
        borderRadius: 20,
        width: '100%',
        padding: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 20,
    },
    inputLabel: {
        color: '#ccc',
        fontSize: 14,
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#2a2a35',
        color: '#fff',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 16,
    },
    dateButton: {
        backgroundColor: '#2a2a35',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    dateButtonText: {
        color: '#fff',
        fontWeight: '600',
        textAlign: 'center',
    },
    typeSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    typeOption: {
        flex: 1,
        paddingVertical: 12,
        marginRight: 12,
        borderRadius: 12,
        backgroundColor: '#2a2a35',
        alignItems: 'center',
    },
    typeOptionLast: {
        marginRight: 0,
    },
    typeOptionSelected: {
        backgroundColor: '#4c6ef5',
    },
    typeOptionText: {
        color: '#ccc',
        fontWeight: '600',
    },
    typeOptionTextSelected: {
        color: '#fff',
    },
    usageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    unitSelector: {
        flexDirection: 'row',
        gap: 8,
    },
    unitOption: {
        backgroundColor: '#2a2a35',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    unitOptionSelected: {
        backgroundColor: '#4c6ef5',
    },
    unitOptionText: {
        color: '#ccc',
        fontWeight: '600',
    },
    unitOptionTextSelected: {
        color: '#fff',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    modalButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginLeft: 12,
    },
    cancelButton: {
        backgroundColor: '#2a2a35',
    },
    saveButton: {
        backgroundColor: '#4c6ef5',
    },
    disabledButton: {
        opacity: 0.6,
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    saveButtonText: {
        color: '#fff',
    },
});

