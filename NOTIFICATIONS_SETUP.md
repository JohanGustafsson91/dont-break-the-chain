# Push Notifications Setup Guide

This app now uses Firebase Cloud Messaging (FCM) with Cloud Functions to send push notifications even when the app is closed.

## What's Already Configured

- Firebase Messaging Service Worker auto-generated during build
- Cloud Functions timezone set to Europe/Stockholm (Sweden)
- Firestore security rules updated

## What You Need To Do

### 1. Get Your VAPID Key from Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon ⚙️ > **Project Settings**
4. Go to the **Cloud Messaging** tab
5. Scroll down to **Web Push certificates**
6. Click **Generate key pair** (if you don't have one already)
7. Copy the key pair value

### 2. Add Environment Variable

Add this to your `.env` file:

```
VITE_FCM_VAPID_KEY=your-vapid-key-here
```

Replace `your-vapid-key-here` with the key you copied from Firebase Console.

### 3. Deploy Firestore Rules and Cloud Functions

Deploy everything to Firebase:

```bash
firebase deploy
```

Or deploy individually:

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Cloud Functions
firebase deploy --only functions
```

Note: You may need to upgrade to the Firebase Blaze plan (pay-as-you-go) to deploy Cloud Functions, but it's still free within the usage limits.

## How It Works

### Notification Schedule

- **9:00 AM**: Morning reminder sent to all users
  - "Good morning! Time to check in on your X habit(s) for today"

- **8:00 PM**: Evening reminder sent to users with unlogged habits
  - "Don't forget to log X habit(s) for today!"

### Technical Details

1. **Frontend** (`src/services/notificationService.ts:1`):
   - Requests notification permission
   - Gets FCM token from Firebase
   - Saves token to Firestore (`fcmTokens` collection)
   - Handles foreground messages

2. **Cloud Functions** (`functions/src/index.ts:1`):
   - `morningReminder`: Runs daily at 9:00 AM
   - `eveningReminder`: Runs daily at 8:00 PM
   - Queries Firestore for habits and user tokens
   - Sends notifications via FCM

3. **Service Worker** (`public/firebase-messaging-sw.js:1`):
   - Handles background notifications when app is closed
   - Shows notification with app branding

### Cost

**100% FREE** on Firebase Spark plan:
- FCM: Unlimited free messages
- Cloud Functions: 2M invocations/month free (you'll use ~60/month for 2 daily notifications)
- Firestore: 50K reads/day free

## Testing

1. Build and run the app:
```bash
pnpm build
pnpm preview
```

2. Open the app and allow notifications when prompted

3. Check Firestore console to see your FCM token saved

4. To test functions locally:
```bash
cd functions
pnpm serve
```

5. To manually trigger a notification from Firebase Console:
   - Go to **Cloud Messaging** tab
   - Click **Send your first message**
   - Use your FCM token from Firestore

## Troubleshooting

- **No permission prompt?** Check browser settings - notifications may be blocked
- **Token not saved?** Check browser console for errors and verify VAPID key
- **Functions not deploying?** Ensure you're on Firebase Blaze plan (still free with limits)
- **Wrong timezone?** Update `timeZone` in both Cloud Functions
