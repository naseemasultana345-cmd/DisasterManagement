/* eslint-disable no-undef */

// Firebase Cloud Messaging Service Worker

importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js"
);

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA-bsyvxS8jaoGaGR9E5SeUJTEFoV9lVfk",
  authDomain:"disastermanagement-9ed43.firebaseapp.com",
  projectId: "disastermanagement-9ed43",
  storageBucket:"disastermanagement-9ed43.firebasestorage.app",
  messagingSenderId:"972260544389",
  appId:"1:972260544389:web:afcb8e24571f6c59a83eec",
  measurementId: "G-L080ZDJGDT"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = firebase.messaging();

// Handle background notifications
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message:",
    payload
  );

  const notificationTitle =
    payload.notification?.title || "Disaster Alert";

  const notificationOptions = {
    body:
      payload.notification?.body ||
      "A new emergency alert has been received.",
    icon: "/firebase-logo.png",
    badge: "/firebase-logo.png",
    data: payload.data || {},
    requireInteraction: true
  };

  self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen =
    event.notification?.data?.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then((clientList) => {

      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});