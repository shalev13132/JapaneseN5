# Firebase Setup — enabling accounts, cloud sync & friends

The site works fully without this (guest mode, progress saved in the browser).
Following these steps (~5 minutes) turns on: Google sign-in, progress sync across
devices, friend codes, and the friends leaderboard.

## 1. Create a Firebase project (free)

1. Go to <https://console.firebase.google.com> and sign in with your Google account.
2. Click **Add project** → name it (e.g. `japanese-n5`) → you can disable Google Analytics → **Create project**.

## 2. Register the web app and get your config

1. On the project overview page click the **`</>`** (Web) icon.
2. App nickname: `n5-site` → **Register app** (no need for Firebase Hosting).
3. Copy the `firebaseConfig = { ... }` object shown.
4. Open [`assets/firebase-config.js`](assets/firebase-config.js) and replace the `null` so it looks like:

```js
window.N5_FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "japanese-n5.firebaseapp.com",
  projectId: "japanese-n5",
  storageBucket: "japanese-n5.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## 3. Enable Google sign-in

1. In the Firebase console: **Build → Authentication → Get started**.
2. **Sign-in method** tab → **Google** → Enable → pick your support email → Save.
3. **Settings** tab → **Authorized domains** → make sure your site's domain is listed.
   For GitHub Pages add: `shalev13132.github.io` (localhost is already there for testing).

## 4. Create the Firestore database

1. **Build → Firestore Database → Create database**.
2. Choose **Production mode** and a nearby region (e.g. `europe-west1`) → **Create**.
3. Open the **Rules** tab, replace everything with the rules below, then click **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Each user owns their profile; any signed-in user can read (for leaderboards)
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }

    // Friend-code lookup table: code -> uid
    match /codes/{code} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
                    && request.resource.data.uid == request.auth.uid;
    }

    // Friend requests: sender creates, either side can update status
    match /requests/{id} {
      allow read: if request.auth != null
                  && (resource.data.from == request.auth.uid
                      || resource.data.to == request.auth.uid);
      allow create: if request.auth != null
                    && request.resource.data.from == request.auth.uid
                    && request.resource.data.status == 'pending';
      allow update: if request.auth != null
                    && (resource.data.from == request.auth.uid
                        || resource.data.to == request.auth.uid);
    }
  }
}
```

## 5. Publish the site

Commit and push `assets/firebase-config.js` to GitHub. That's it — the 👤 button
on the site now offers "התחברות עם Google", and signed-in users get cloud sync,
friend codes and the leaderboard.

## How friends work

- Every user gets a 6-character **friend code** (shown in the profile panel, 📋 to copy).
- A friend enters your code → you get a request in your panel → accept → you both
  appear in each other's XP leaderboard.

## Costs

The free "Spark" plan covers this comfortably (50K reads / 20K writes per day).
No credit card required.
