// service-worker.js

// Name des Caches für die App-Shell (die grundlegenden Dateien der App)
const CACHE_NAME = 'skt-dashboard-cache-v1';

// Dateien, die beim ersten Besuch gecached werden sollen
const urlsToCache = [
  '/', // Die Startseite (index.html)
  'manifest.json',
  'icon-192x192.png',
  'icon-512x512.png',
  'https://cdn.tailwindcss.com', // Wichtige externe Ressourcen
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css'
];

// Event-Listener für die Installation des Service Workers
self.addEventListener('install', event => {
  console.log('Service Worker: Installation...');
  // Warte, bis der Cache geöffnet und alle wichtigen Dateien hinzugefügt wurden
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching App Shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Aktiviere den neuen Service Worker sofort
  );
});

// Event-Listener für das Abrufen von Inhalten (Fetch-Anfragen)
self.addEventListener('fetch', event => {
  // Antworte auf die Anfrage entweder mit dem Cache-Inhalt oder lade ihn aus dem Netzwerk
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Wenn die angefragte Ressource im Cache ist, gib sie von dort zurück
        if (response) {
          return response;
        }
        // Ansonsten lade sie aus dem Netzwerk
        return fetch(event.request);
      })
  );
});

// Event-Listener für das Aktivieren des Service Workers
self.addEventListener('activate', event => {
  console.log('Service Worker: Aktivierung...');
  // Lösche alte, nicht mehr benötigte Caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          // Filtere nach Caches, die nicht dem aktuellen Cache-Namen entsprechen
          return cacheName.startsWith('skt-dashboard-cache-') && cacheName !== CACHE_NAME;
        }).map(cacheName => {
          // Lösche die alten Caches
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// --- PUSH BENACHRICHTIGUNGEN ---

// Event-Listener für eingehende Push-Nachrichten
self.addEventListener('push', event => {
  console.log('Service Worker: Push-Nachricht empfangen.');

  // Standard-Nachricht, falls keine Daten gesendet werden
  let notificationData = {
    title: 'SKT Dashboard',
    body: 'Es gibt Neuigkeiten!',
    icon: 'icon-192x192.png'
  };

  // Versuche, die Daten aus der Push-Nachricht zu lesen (sollten als JSON kommen)
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData.title = data.title || notificationData.title;
      notificationData.body = data.body || notificationData.body;
      notificationData.icon = data.icon || notificationData.icon;
    } catch (e) {
      console.error('Fehler beim Parsen der Push-Daten:', e);
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: 'icon-192x192.png' // Ein kleines Icon für die Benachrichtigungsleiste
  };

  // Zeige die Benachrichtigung an
  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Event-Listener für den Klick auf eine Benachrichtigung
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Klick auf Benachrichtigung.');
  
  // Schließe die Benachrichtigung
  event.notification.close();

  // Öffne die App/Webseite.
  // Ersetze 'index.html' mit der genauen URL deines Dashboards.
  event.waitUntil(
    clients.openWindow('index.html')
  );
});
