import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyA-bsyvxS8jaoGaGR9E5SeUJTEFoV9lVfk",
  authDomain:"disastermanagement-9ed43.firebaseapp.com",
  projectId: "disastermanagement-9ed43",
  storageBucket:"disastermanagement-9ed43.firebasestorage.app",
  messagingSenderId:"972260544389",
  appId:"1:972260544389:web:afcb8e24571f6c59a83eec",
  measurementId: "G-L080ZDJGDT"
};

const app = initializeApp(firebaseConfig);

export const messaging = getMessaging(app);