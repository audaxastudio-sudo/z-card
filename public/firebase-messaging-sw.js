// Scripts para o Service Worker do Firebase
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyA7n13T6DnzWeZp7STqNLi6tPcaKUZYtUI",
  authDomain: "z-card-2782b.firebaseapp.com",
  projectId: "z-card-2782b",
  storageBucket: "z-card-2782b.firebasestorage.app",
  messagingSenderId: "848639643491",
  appId: "1:848639643491:web:3f1e8c65fe933d05d84d56"
});

const messaging = firebase.messaging();

// Lógica para quando o app está em segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensagem em segundo plano recebida:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.jpg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
