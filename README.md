# Neighborhood mobile app (Expo + React Native + TypeScript)

## Setup
```bash
npx create-expo-app@latest neighborhood-app --template blank-typescript
cd neighborhood-app

# Expo-managed native modules (picks versions matching your Expo SDK)
npx expo install react-native-screens react-native-safe-area-context expo-secure-store expo-camera react-native-svg expo-status-bar

# JS libraries
npm i @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs \
      @tanstack/react-query axios zustand socket.io-client react-native-qrcode-svg
```
Then copy this package's `App.tsx` (overwrite) and the `src/` folder into the project root.

1. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to your computer's LAN IP + port 3000
   (phone and computer on the same Wi-Fi), or your deployed API URL.
2. Add the camera plugin to `app.json`:
   ```json
   "plugins": [["expo-camera", { "cameraPermission": "Allow camera access to scan visitor QR codes at the gate." }]]
   ```
3. `npx expo start`, then scan the QR code with Expo Go.
   (Camera + secure storage work in Expo Go. Push notifications will need a development build later.)

## Screens
- Auth: login / register (phone or email)
- Home: my communities + role-based actions (admin: members, email; security: gate; shop staff: manage shop)
- Join: search estates / churches / mosques and request to join; Register: create one (you become admin)
- Members (admin): approve/reject requests, make security / admin, suspend
- Visitors: create pass (code + QR), share via WhatsApp/SMS, revoke
- Gate (security): scan QR or type code -> big ALLOW / DENY card, exit logging, recent activity
- Shops: browse products with live stock; Manage shop: add products, +/- stock
- Chat: realtime (Socket.IO), message requests, new chat by search or estate directory
- Profile: chat privacy (Everyone / My communities / By request / Admins only), log out

## Needs the backend with the /users endpoints (included in the latest neighborhood-api.zip)
