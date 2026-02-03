import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/Themed';
import { ColdTurkeyDetail } from '@/components/tracker/details/ColdTurkeyDetail';
import { DoseDecreaseDetail } from '@/components/tracker/details/DoseDecreaseDetail';
import { useTrackedItems } from '@/contexts/TrackedItemsContext';
import { TrackerType } from '@/enums/TrackerType';
import type { TrackerItem } from '@/types/tracking';
import { formatDateForDisplay } from '@/utils/date';

export default function TrackerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, updateItem, removeItem } = useTrackedItems();
  const trackedItem = useMemo<TrackerItem | undefined>(
    () => items.find((item) => item.id === id),
    [id, items]
  );

  const [nameInput, setNameInput] = useState('');

  useEffect(() => {
    if (!trackedItem) {
      return;
    }

    setNameInput(trackedItem.name);
  }, [trackedItem]);

  const handleSave = () => {
    if (!trackedItem) {
      return;
    }

    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      return;
    }

    const updatedItem: TrackerItem = {
      ...trackedItem,
      name: trimmedName,
    };

    updateItem(updatedItem);
  };

  const handleResetStartDate = () => {
    if (!trackedItem) {
      return;
    }

    Alert.alert('Reset tracker', 'Reset the start date to today?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Reset',
        style: 'default',
        onPress: () => {
          const resetAt = new Date().toISOString();
          const history = trackedItem.resetHistory ?? [];
          const updatedItem: TrackerItem = {
            ...trackedItem,
            startedAt: resetAt,
            resetHistory: [
              ...history,
              {
                startedAt: trackedItem.startedAt,
                resetAt,
              },
            ],
          };
          updateItem(updatedItem);
        },
      },
    ]);
  };

  const handleDelete = () => {
    if (!trackedItem) {
      return;
    }

    Alert.alert('Delete tracker', 'Are you sure you want to delete this tracker?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          removeItem(trackedItem.id);
          router.back();
        },
      },
    ]);
  };

  if (!trackedItem) {
    return (
      <View style={styles.centeredContainer}>
        <Stack.Screen options={{ title: 'Tracker not found' }} />
        <Text style={styles.missingTitle}>Tracker not found</Text>
        <Text style={styles.missingSubtitle}>The tracker you are looking for no longer exists.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const disableSave = !nameInput.trim();

  const header = (
    <Stack.Screen
      options={{
        title: "DETAIL",
        headerStyle: { backgroundColor: '#0b0b0f' },
        headerTintColor: '#fff',
        headerShadowVisible: false,
      }}
    />
  );

  const startDateDisplay = formatDateForDisplay(trackedItem.startedAt);

  if (trackedItem.type === TrackerType.ColdTurkey) {
    return (
      <>
        {header}
        <ColdTurkeyDetail
          item={trackedItem}
          nameInput={nameInput}
          onNameChange={setNameInput}
          startDateDisplay={startDateDisplay}
          disableSave={disableSave}
          onSave={handleSave}
          onResetDate={handleResetStartDate}
          onDelete={handleDelete}
        />
      </>
    );
  }

  return (
    <>
      {header}
      <DoseDecreaseDetail
        item={trackedItem}
        nameInput={nameInput}
        onNameChange={setNameInput}
        startDateDisplay={startDateDisplay}
        disableSave={disableSave}
        onSave={handleSave}
        onResetDate={handleResetStartDate}
        onDelete={handleDelete}
      />
    </>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: '#4c6ef5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: '#0b0b0f',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  missingTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  missingSubtitle: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
});
