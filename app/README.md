# Vowel (app)

React Native + Expo (SDK 58), TypeScript, expo-router. A research screening tool, not a diagnosis.
Design handoff: `../design/voice-check-handoff_1`. All design tokens live in `src/theme.ts`.

## Run it on an iPhone with Expo Go

1. `cp .env.example .env` and fill in the Firebase values (and `EXPO_PUBLIC_API_URL` if you have the server running).
2. `npm install`
3. `npx expo start`
4. Install **Expo Go** from the App Store, then scan the QR code with the iPhone camera. Phone and Mac must be on the same Wi-Fi (or run `npx expo start --tunnel`).

Without `EXPO_PUBLIC_API_URL` (or with `EXPO_PUBLIC_MOCK_API=1`) the app uses a mock scorer so the whole flow runs without the server.
Firebase is required for log in. Deploy `firestore.rules` from `../firebase/` (owner-only access).

## Layout

- `src/app/` routes (welcome, login, signup, forgot, consent, microphone, prescreen, record, result/[id], learn/[topic], privacy, `(tabs)`: home, results, learn, settings)
- `src/lib/api.ts` scoring client and mock mode; `src/lib/recording.ts` recording options and take judging
- `src/lib/store.ts` Firestore (results only, never audio); `src/lib/pdf.ts` doctor summary
- `assets/evaluation_report.json` copy of `ml/models/evaluation_report.json`, read by the Learn screen. Re-copy it when the model is retrained.
