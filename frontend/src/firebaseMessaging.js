import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "./firebase";

const VAPID_KEY =
  "BPx_O3fYqAMTFTgd5TtehZaEXdajsnFdGNyiWfyOLnX6bsKgWYaHXU24ojzj8DpfMnDHWtfqHYh-3nNA9jlRI4c";

/**
 * Request notification permission and generate FCM token
 */
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("Notification permission denied.");
      return null;
    }

    console.log("Notification permission granted.");

    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log("FCM Token:", token);
      return token;
    }

    console.log("No FCM registration token available.");
    return null;

  } catch (error) {
    console.error("FCM token error:", error);
    return null;
  }
};

/**
 * Receive notifications while the app is open
 */
export const listenForMessages = (callback) => {
  return onMessage(messaging, (payload) => {
    console.log("Foreground notification:", payload);

    if (callback) {
      callback(payload);
    }
  });
};