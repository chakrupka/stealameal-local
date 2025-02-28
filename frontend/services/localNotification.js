import * as Notifications from 'expo-notifications';

async function sendLocalNotification() {
    // First, set the handler that will cause the notification
    // to show the alert
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
        }),
    });

    // Second, call scheduleNotificationAsync()
    await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Find some friends to dine with!',
            body: "They're hoping you reach out :)",
        },
        trigger: null,
    });
}

export default sendLocalNotification;