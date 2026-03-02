import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';

import { Text } from '@/components/Themed';
import { ColdTurkeyListCard } from '@/components/tracker/ColdTurkeyListCard';
import { CreateTrackerModal } from '@/components/tracker/CreateTrackerModal';
import { DoseDecreaseListCard } from '@/components/tracker/DoseDecreaseListCard';
import { M3Colors, M3Radius, M3Spacing } from '@/constants/theme';
import { useTrackedItems } from '@/contexts/TrackedItemsContext';
import { TrackerType } from '@/enums/TrackerType';
import type { TrackerItem } from '@/types/tracking';

export default function HomeScreen() {
    const { items, reorderItems } = useTrackedItems();
    const router = useRouter();
    const [isModalVisible, setModalVisible] = useState(false);
    const keyboardVerticalOffset = Platform.OS === 'ios' ? 80 : 0;

    const listEmptyComponent = useMemo(
        () => (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No tracked items yet</Text>
                <Text style={styles.emptySubtitle}>Tap the plus button to start tracking your progress.</Text>
            </View>
        ),
        []
    );

    return (
        <KeyboardAvoidingView
            style={styles.keyboardAvoiding}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={keyboardVerticalOffset}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.heading}>My Trackers</Text>
                    </View>
                    <TouchableOpacity
                        accessibilityLabel="Add a tracker"
                        accessibilityRole="button"
                        onPress={() => setModalVisible(true)}
                        style={styles.addButton}
                        activeOpacity={0.8}
                    >
                        <Feather name="plus" size={24} color={M3Colors.onPrimary} />
                    </TouchableOpacity>
                </View>

                <DraggableFlatList
                    data={items}
                    keyExtractor={(item) => item.id}
                    onDragEnd={({ data }) => reorderItems(data)}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={listEmptyComponent}
                    renderItem={({ item, drag, isActive }: RenderItemParams<TrackerItem>) => {
                        const handlePress = () => router.push({ pathname: '/tracker/[id]', params: { id: item.id } });
                        return (
                            <ScaleDecorator>
                                {item.type === TrackerType.ColdTurkey ? (
                                    <ColdTurkeyListCard
                                        item={item as any}
                                        onPress={handlePress}
                                        onLongPress={drag}
                                        isActive={isActive}
                                    />
                                ) : (
                                    <DoseDecreaseListCard
                                        item={item as any}
                                        onPress={handlePress}
                                        onLongPress={drag}
                                        isActive={isActive}
                                    />
                                )}
                            </ScaleDecorator>
                        );
                    }}
                />

                <CreateTrackerModal visible={isModalVisible} onClose={() => setModalVisible(false)} />
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    keyboardAvoiding: {
        flex: 1,
    },
    container: {
        flex: 1,
        paddingTop: 60,
        paddingHorizontal: M3Spacing.xl,
        backgroundColor: M3Colors.surface,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    heading: {
        fontSize: 28,
        fontWeight: '500',
        color: M3Colors.onSurface,
        letterSpacing: 0,
    },
    subheading: {
        marginTop: M3Spacing.xs,
        fontSize: 14,
        color: M3Colors.onSurfaceVariant,
    },
    addButton: {
        backgroundColor: M3Colors.primary,
        height: 56,
        width: 56,
        borderRadius: M3Radius.large,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
        shadowColor: M3Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    listContent: {
        paddingVertical: M3Spacing.xxl,
        paddingBottom: 40,
    },
    emptyContainer: {
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingVertical: M3Spacing.xxl,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '500',
        color: M3Colors.onSurface,
    },
    emptySubtitle: {
        marginTop: M3Spacing.sm,
        fontSize: 14,
        color: M3Colors.onSurfaceVariant,
        lineHeight: 20,
    },
});
