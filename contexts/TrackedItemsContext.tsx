import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
    PropsWithChildren,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

import { TRACKED_ITEMS_STORAGE_KEY } from '@/constants/storage';
import { TrackerItem } from '@/types/tracking';
import { cancelTrackerMilestoneNotifications, scheduleTrackerMilestoneNotifications } from '@/utils/notifications';

type TrackedItemsContextValue = {
    items: TrackerItem[];
    isLoading: boolean;
    addItem: (item: TrackerItem) => void;
    updateItem: (item: TrackerItem) => void;
    removeItem: (id: string) => void;
    reorderItems: (items: TrackerItem[]) => void;
    refresh: () => Promise<void>;
};

const TrackedItemsContext = createContext<TrackedItemsContextValue | undefined>(undefined);

export function TrackedItemsProvider({ children }: Readonly<PropsWithChildren>) {
    const [items, setItems] = useState<TrackerItem[]>([]);
    const [isLoading, setLoading] = useState(true);

    const loadItems = useCallback(async () => {
        try {
            setLoading(true);
            const stored = await AsyncStorage.getItem(TRACKED_ITEMS_STORAGE_KEY);
            if (stored) {
                const parsed: TrackerItem[] = JSON.parse(stored).map((item: TrackerItem) => ({
                    ...item,
                    notifiedMilestones: item.notifiedMilestones ?? [],
                    resetHistory: item.resetHistory ?? [],
                }));
                setItems(parsed);
            } else {
                setItems([]);
            }
        } catch (error) {
            console.warn('Failed to load tracked items', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadItems();
    }, [loadItems]);

    useEffect(() => {
        if (isLoading) return;

        const persist = async () => {
            try {
                await AsyncStorage.setItem(TRACKED_ITEMS_STORAGE_KEY, JSON.stringify(items));
            } catch (error) {
                console.warn('Failed to persist tracked items', error);
            }
        };

        void persist();
    }, [items, isLoading]);

    const addItem = useCallback((item: TrackerItem) => {
        setItems((previous) => [...previous, item]);
        void scheduleTrackerMilestoneNotifications(item.id, item.name, item.startedAt);
    }, []);

    const updateItem = useCallback((item: TrackerItem) => {
        setItems((previous) => previous.map((existing) => {
            if (existing.id === item.id) {
                // If startedAt was changed (tracker renamed or reset) we re-schedule
                if (existing.startedAt !== item.startedAt || existing.name !== item.name) {
                    void scheduleTrackerMilestoneNotifications(item.id, item.name, item.startedAt);
                }
                return item;
            }
            return existing;
        }));
    }, []);

    const removeItem = useCallback((id: string) => {
        setItems((previous) => previous.filter((item) => item.id !== id));
        void cancelTrackerMilestoneNotifications(id);
    }, []);

    const reorderItems = useCallback((newItems: TrackerItem[]) => {
        setItems(newItems);
    }, []);

    const value = useMemo(
        () => ({ items, isLoading, addItem, updateItem, removeItem, reorderItems, refresh: loadItems }),
        [addItem, isLoading, items, loadItems, removeItem, reorderItems, updateItem]
    );

    return <TrackedItemsContext.Provider value={value}>{children}</TrackedItemsContext.Provider>;
}

export function useTrackedItems() {
    const context = useContext(TrackedItemsContext);
    if (!context) {
        throw new Error('useTrackedItems must be used within a TrackedItemsProvider');
    }
    return context;
}
