/* Settings for the SHARED Guest Gallery (Firebase Firestore). Leave these empty and the gallery simply works per-browser, as before.

   Paste your Firebase web-app settings here (Firebase console → Project settings → General → Your apps → SDK setup and configuration → "Config").

   These values are NOT secrets. They only tell the browser which Firebase project to talk to, and every website that uses Firebase shows them
   publicly. What actually protects your data is the rule set in firebase/firestore.rules (published in the Firebase console) — it lets people
   ADD a valid card and nothing else. There must never be a password, a service-account file, a private key or an admin token in this repository. */
window.FIREBASE_CONFIG = {
  apiKey: 'AIzaSyB_1AreMPdsottjCY97LfBRS6rLMbYonZI',
  authDomain: 'siddhibhavya-site.firebaseapp.com',
  projectId: 'siddhibhavya-site',
  storageBucket: 'siddhibhavya-site.firebasestorage.app',
  messagingSenderId: '126099115638',
  appId: '1:126099115638:web:de487b0207d040f33d1957'
};
