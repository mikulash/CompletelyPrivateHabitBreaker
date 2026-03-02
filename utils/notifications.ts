import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { COLD_TURKEY_MILESTONES } from '@/constants/coldTurkeyMilestones';

// Set up background handler config
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function requestNotificationPermissions() {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('milestones', {
            name: 'Milestones',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    return finalStatus === 'granted';
}

/**
 * Schedule notifications for all future milestones for a specific tracker and start date.
 */
export async function scheduleTrackerMilestoneNotifications(trackerId: string, trackerName: string, startedAt: string) {
    // First, clear any existing scheduled notifications for this tracker
    await cancelTrackerMilestoneNotifications(trackerId);

    const hasPermissions = await requestNotificationPermissions();
    if (!hasPermissions) {
        return;
    }

    const startMs = new Date(startedAt).getTime();
    if (!Number.isFinite(startMs)) return;

    const nowMs = Date.now();

    for (let i = 0; i < COLD_TURKEY_MILESTONES.length; i++) {
        const milestone = COLD_TURKEY_MILESTONES[i];
        const triggerMs = startMs + milestone.durationMs;

        // Only schedule if the milestone is in the future
        if (triggerMs > nowMs) {
            const triggerDate = new Date(triggerMs);
            const nextMilestone = i + 1 < COLD_TURKEY_MILESTONES.length ? COLD_TURKEY_MILESTONES[i + 1] : null;

            let body = `You've achieved the ${milestone.label} milestone for ${trackerName}!`;
            if (nextMilestone) {
                body += ` Next up: ${nextMilestone.label}. Keep going!`;
            } else {
                body += ` You've reached the final milestone!`;
            }

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Milestone Achieved! 🎉',
                    body,
                    data: { trackerId, type: 'milestone' },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: triggerDate,
                },
                identifier: `milestone_${trackerId}_${milestone.durationMs}`,
            });
        }
    }
}

/**
 * Cancel all scheduled milestone notifications for a specific tracker.
 */
export async function cancelTrackerMilestoneNotifications(trackerId: string) {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

    const notificationsToCancel = scheduledNotifications.filter(
        (notif) => notif.identifier.startsWith(`milestone_${trackerId}_`)
    );

    for (const notif of notificationsToCancel) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
}
