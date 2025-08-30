// Importiere die Firebase-Skripte. Dies ist für den Service Worker notwendig.
importScripts("https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js");

// Deine Firebase-Konfiguration (dieselbe wie in deiner Haupt-App)
const firebaseConfig = {
    apiKey: "AIzaSyCRb2nZrC9U78fFxuVZu7NF9JxRxyZw864",
    authDomain: "skt-dashboard-c7374.firebaseapp.com",
    projectId: "skt-dashboard-c7374",
    storageBucket: "skt-dashboard-c7374.appspot.com",
    messagingSenderId: "936899917792",
    appId: "1:936899917792:web:6470917c8ae8e410ee5d85"
};

// Initialisiere die Firebase-App im Service Worker
firebase.initializeApp(firebaseConfig);

// Rufe eine Instanz von Firebase Messaging ab, um Benachrichtigungen im Hintergrund zu verarbeiten
const messaging = firebase.messaging();

// Füge einen Handler für Hintergrund-Benachrichtigungen hinzu
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[service-worker.js] Received background message ",
    payload
  );
  
  // Wir lesen jetzt aus payload.data statt payload.notification
  const notificationTitle = payload.data.title;
  const notificationOptions = {
    body: payload.data.body,
    icon: './icon-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});


// --- Caching für Offline-Fähigkeit ---

// ===================================================================================
// HIER IST DIE WICHTIGSTE STELLE FÜR UPDATES
// Ändere diese Versionsnummer (z.B. auf 'v1.2'), wenn du die App aktualisierst.
const CACHE_NAME = 'skt-dashboard-cache-v1.1.1'; 
// ===================================================================================

const urlsToCache = [
  './', 
  './index.html',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css'
];

// 1. INSTALL: Wird ausgeführt, wenn ein neuer Service Worker installiert wird.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache geöffnet und Dateien werden zwischengespeichert.');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. ACTIVATE: Wird ausgeführt, nachdem der neue Service Worker installiert wurde.
// Hier werden alte, nicht mehr benötigte Caches gelöscht.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Wenn der Name eines Caches nicht mit dem aktuellen CACHE_NAME übereinstimmt, wird er gelöscht.
          if (cacheName !== CACHE_NAME) {
            console.log('Alter Cache wird gelöscht:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Sorgt dafür, dass der neue Service Worker sofort die Kontrolle über die Seite übernimmt.
  return self.clients.claim();
});


// 3. FETCH: Wird bei jeder Anfrage (z.B. nach Bildern, CSS, HTML) von der Seite ausgeführt.
self.addEventListener('fetch', event => {
  event.respondWith(
    // Versuche, die Anfrage aus dem Cache zu beantworten.
    caches.match(event.request)
      .then(response => {
        // Wenn die Datei im Cache gefunden wird, liefere sie von dort.
        if (response) {
          return response;
        }
        // Wenn nicht, lade sie aus dem Netzwerk.
        return fetch(event.request);
      })
  );
});