import React, { ReactNode } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/Themed';
import { M3Colors, M3Radius, M3Spacing } from '@/constants/theme';

type TrackerDetailTemplateProps<ItemType> = {
  item: ItemType;
  nameInput: string;
  onNameChange: (value: string) => void;
  startDateDisplay: string;
  onSave: () => void;
  onResetDate: () => void;
  onDelete: () => void;
  disableSave: boolean;
  renderSummary: (item: ItemType) => ReactNode;
  extraEditFields?: ReactNode;
  saveLabel?: string;
};

export function TrackerDetailTemplate<ItemType>({
  item,
  nameInput,
  onNameChange,
  startDateDisplay,
  onSave,
  onResetDate,
  onDelete,
  disableSave,
  renderSummary,
  extraEditFields,
  saveLabel = 'Save changes',
}: TrackerDetailTemplateProps<ItemType>) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {renderSummary(item)}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Edit tracker</Text>

        <Text style={styles.inputLabel}>Name</Text>
        <TextInput
          value={nameInput}
          onChangeText={onNameChange}
          placeholder="What are you tracking?"
          placeholderTextColor={M3Colors.outline}
          style={styles.input}
        />

        {extraEditFields}

        <View style={styles.sectionActions}>
          <TouchableOpacity
            style={[styles.primaryButton, disableSave && styles.disabledButton]}
            onPress={onSave}
            disabled={disableSave}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>{saveLabel}</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.resetButton} onPress={onResetDate} activeOpacity={0.7}>
              <Text style={styles.secondaryButtonText}>Reset date</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={onDelete} activeOpacity={0.7}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: M3Spacing.xxl,
    paddingBottom: 48,
    backgroundColor: M3Colors.surface,
    minHeight: '100%',
  },
  section: {
    backgroundColor: M3Colors.surfaceContainer,
    borderRadius: M3Radius.large,
    padding: M3Spacing.xl,
    gap: M3Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: M3Colors.onSurface,
  },
  inputLabel: {
    color: M3Colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '500',
  },
  input: {
    backgroundColor: M3Colors.surfaceContainerHigh,
    color: M3Colors.onSurface,
    borderRadius: M3Radius.medium,
    paddingHorizontal: M3Spacing.lg,
    paddingVertical: M3Spacing.md,
    fontSize: 14,
  },
  sectionActions: {
    gap: M3Spacing.lg,
    marginTop: M3Spacing.sm,
  },
  primaryButton: {
    backgroundColor: M3Colors.primary,
    paddingVertical: M3Spacing.md,
    paddingHorizontal: M3Spacing.xl,
    borderRadius: M3Radius.medium,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: M3Colors.onPrimary,
    fontWeight: '500',
    fontSize: 14,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: M3Spacing.md,
  },
  resetButton: {
    flex: 1,
    backgroundColor: M3Colors.tertiaryContainer,
    paddingVertical: M3Spacing.md,
    borderRadius: M3Radius.medium,
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: M3Colors.errorContainer,
    paddingVertical: M3Spacing.md,
    borderRadius: M3Radius.medium,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: M3Colors.onTertiaryContainer,
    fontWeight: '500',
    fontSize: 14,
  },
  deleteButtonText: {
    color: M3Colors.onErrorContainer,
    fontWeight: '500',
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.5,
  },
});


