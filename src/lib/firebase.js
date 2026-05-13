import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyA7n13T6DnzWeZp7STqNLi6tPcaKUZYtUI",
  authDomain: "z-card-2782b.firebaseapp.com",
  projectId: "z-card-2782b",
  storageBucket: "z-card-2782b.firebasestorage.app",
  messagingSenderId: "848639643491",
  appId: "1:848639643491:web:3f1e8c65fe933d05d84d56"
};

const app = initializeApp(firebaseConfig);

// Inicialização segura do Messaging
export const messaging = async () => {
  const supported = await isSupported();
  return supported ? getMessaging(app) : null;
};

export const requestForToken = async () => {
  try {
    const messagingInstance = await messaging();
    if (!messagingInstance) return null;

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const currentToken = await getToken(messagingInstance, {
      vapidKey: "BOBYmCvdeKcjBCESDOHg8Og3aOHxr1b2qtIMj4-iJSyRuNFhFOJu8DLGh3HDPAZa68ce8eNP1ma3F8HQ9PpPy00",
      serviceWorkerRegistration: registration
    });
    
    return currentToken || null;
  } catch (err) {
    console.error("Erro ao solicitar push:", err);
    alert("Erro ao ativar notificações: " + err.message);
    return null;
  }
};

export const onMessageListener = async () => {
  const messagingInstance = await messaging();
  if (!messagingInstance) return null;

  return new Promise((resolve) => {
    onMessage(messagingInstance, (payload) => {
      resolve(payload);
    });
  });
};
