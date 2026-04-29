// src/utils/notifications.js
// Thin wrapper around the browser Notification API.
// Handles unsupported browsers, permission state, and click-to-focus.

// Check if the browser supports notifications at all
export const isNotificationSupported = () => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

// Get current permission state ('default' | 'granted' | 'denied' | 'unsupported')
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

// Request permission (only call from a user gesture handler)
// Returns the resulting permission state
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) return 'unsupported';

  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission; // already decided
  }

  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (err) {
    console.warn('Notification permission request failed:', err);
    return 'denied';
  }
};

// Fire a notification. Returns true if shown, false if blocked/unsupported.
export const showNotification = (title, options = {}) => {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    const notification = new Notification(title, {
      icon: '/favicon.svg', // your app's icon
      badge: '/favicon.svg',
      requireInteraction: false, // auto-dismiss
      ...options,
    });

    // Click the notification → focus the tab
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return true;
  } catch (err) {
    console.warn('Failed to show notification:', err);
    return false;
  }
};