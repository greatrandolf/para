# Feature plan: driver app access (activation QR)

Date: 2026-11-11. Spans `para-backend`, `para-portal`, and `para/` (driver app).

## Goal
A fleet gives one of its drivers access to the Para driver app without creating a password. The fleet shows a one-time QR code in the portal. The driver scans it with the app, sets a 6-digit PIN on that phone, and sees the vehicle and route the fleet assigned. Only the fleet assigns vehicles; the driver's view is read-only.

## Decisions
- **No passwords.** Activation uses a single-use, 15-minute code. Only its SHA-256 hash is stored (`driverActivations/{id}`). The QR code holds the deep link `para://activate?code=<token>`, so the phone's camera can also open the app.
- **Driver sign-in** is a Firebase Auth user with uid `driver-<driverId>`, no email or password, and custom claims `{ role: 'driver', driverId, ownerUid }`. Activation returns a Firebase custom token; the app signs in with it.
- **One phone at a time:** activating again (on a new phone) revokes the old phone's sessions.
- **The PIN is device-local.** It is stored as a salted SHA-256 hash in SecureStore and unlocks the app on that phone. Five wrong tries sign the phone out, and the fleet must issue a new code. The server never sees the PIN.
- **Fleet controls:** Give app access (shows the QR code), Turn off access (disables the Auth user and revokes sessions), and status on each driver: `none`, `active`, or `disabled`. Deleting a driver also turns off their access.
- **The `driver` claim is not a staff role.** It sits outside the staff role list, so every staff permission check refuses it and invites can never grant it. Drivers can call only `driverMe` (checked by `requireDriver`), never the fleet, team, or write functions.
- **`driverMe`** returns the driver's profile, their fleet account's name, the current unit (code, plate, type, make), and the current route (code and name). It refuses access when the driver is deleted or access is off.

## Backend tasks
1. Add `requireDriver` and `DRIVER_ROLE` to `lib/auth.ts`. The portal needs no change: a `driver` claim is not a staff role there either, so it would show "No access".
2. Add `fleet/accessFunctions.ts` with `driverAccessCreate`, `driverAccessRevoke`, the public `driverAccessActivate`, and `driverMe`.
3. Add `appAccess` and `authUid` to driver docs and API shapes. `driversDelete` turns access off.
4. Rules: `driverActivations` is closed to clients.

## Portal tasks
- Driver Accounts rows show an app-access badge, plus a "Give app access" or "Turn off access" action.
- A dialog shows the QR code (rendered from the `qrcode` package as Views), the expiry countdown, and "Make a new code".

## Driver app tasks (`para/`)
- Add Firebase Auth (persisted with AsyncStorage on native), a callable client, and TanStack Query.
- New routes: `(auth)/activate` (camera scanner with expo-camera, plus a "paste link" fallback; it also handles the deep link) and `(auth)/pin` (set or enter the PIN).
- `(drivers)` is guarded: not activated → `/activate`; no PIN → set a PIN; locked → enter the PIN.
- The Duty screen gets a "My assignment" card (live from `driverMe`, read-only). Profile gets "This phone": change PIN, and sign out of this phone.

## Acceptance criteria
- AC1. A fleet user can create an activation code only for their own driver. Admins can create one for any fleet's driver. The code is single-use and expires after 15 minutes. A new code invalidates the previous one.
- AC2. Activating with a valid code signs the app in as that driver (role `driver`). Used, expired, revoked, or unknown codes are refused with a clear message.
- AC3. Activating on a second phone signs the first phone out.
- AC4. "Turn off access" (or deleting the driver) blocks the driver right away; `driverMe` refuses them. Giving access again works.
- AC5. A driver token cannot call fleet, route, or team functions.
- AC6. The app requires setting a 6-digit PIN after activation, and asks for it whenever the app opens. Five wrong PINs sign the phone out.
- AC7. The driver app shows the unit, plate, and route the fleet assigned, or "Not assigned yet", and cannot change them.
- AC8. The portal shows each driver's app status and the QR dialog. Typecheck and lint pass in all three projects, and the existing para tests still pass.

## Results (2026-11-11)
- **Backend:** 24 API checks pass (`driverAccessCreate`, `driverAccessActivate`, `driverAccessRevoke`, `driverMe`): ownership, single use, expiry, a new code cancelling the old one, second phone, turn off and give again, deleting a driver, and driver tokens refused by staff functions. 2 rules checks pass: clients cannot read `driverActivations`.
- **Portal:** in the browser, the Driver App column shows the badge, Give access, New code, and Turn off. The QR code was decoded with the browser's BarcodeDetector and matches the activation link exactly.
- **Driver app, on the iOS Simulator (iPhone 17, Expo Go):**
  - the guard sends you to activation;
  - deep-link activation works, and a PIN is set and confirmed;
  - the Duty screen shows the fleet's assignment (unit, plate, route, and start date);
  - turning off access in the portal signs the phone out within a minute;
  - giving access again works;
  - after a cold restart the app stays signed in and asks for the PIN, and a wrong PIN shows the tries left.
- **Not verified here:** scanning a QR code with a real camera (the simulator has none); the `para://` scheme, which needs a development or store build (Expo Go uses `exp://…/--/activate`); and a physical phone on the LAN.
- **Tests:** 14 new Jest tests (PIN store, PIN screen, activation screen). 5 earlier failures remain, from UI removed before this work (the Duty identity card and direction picker, and the LiveTracking route summary).

## Revision 2: commuter sign-in as the first screen (2026-11-11)
Request: remove the role-select screen. The app opens on the commuter sign-in, which has a link at the bottom to activate a driver account. A phone with an activated driver opens straight to the PIN screen.

- **Commuter accounts:** Firebase email and password, created by the commuter (sign-up screen with name, email, password, and confirmation; at least 8 characters with letters and numbers). There is a password reset email, and Account → Sign out.
- **Session:** `useSession` (it replaces `useDriverSession`) knows `signedOut`, `commuter`, and `driver` (with a PIN state). A token with the `driver` claim is a driver; any other signed-in user is a commuter.
- **Routing:**
  - `/` is the sign-in. It redirects a commuter to `/commute` and a driver to `/pin`.
  - The commuter tabs need a commuter. The driver tabs need an unlocked driver.
  - End Shift locks the driver app behind the PIN.
- **Removed:** `screens/shared/RoleSelect` and its test.
- AC9. The app opens on the commuter sign-in, which has an "Activate driver account" link at the bottom.
- AC10. A commuter can create an account, sign in, sign out, and request a password reset. Wrong credentials show a clear message.
- AC11. On a phone with an activated driver, the app opens on the PIN screen, not the sign-in.
- **Results:** checked on the iOS Simulator: sign-in first; create account → Commute; Account → Sign out → sign-in; sign in again; driver activation → PIN; a cold restart opens the PIN screen; "Forgot PIN" → sign-in. Jest: 315 pass; the 5 earlier failures remain (UI removed before this work).

## Revision 3: Continue with Google for commuters (2026-11-11)
- `@react-native-google-signin/google-signin` gets the Google ID token, and Firebase signs in with `GoogleAuthProvider.credential`. The first sign-in creates the commuter account. Signing out also forgets the Google account on the phone.
- The button ("or" divider plus "Continue with Google") is on the sign-in and sign-up screens. It is hidden when Google sign-in isn't set up in the build.
- Expo Go has no native module. Against the Auth emulator it signs in with a fixed test Google identity, and the screen says so. The library is loaded only when its native module exists, because loading it in Expo Go throws a fatal error.
- `app.config.ts` adds the config plugin (iOS URL scheme) only when `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` is set.
- AC12. A commuter can sign in with Google from the sign-in and sign-up screens and lands on Commute. Closing Google's picker keeps them on the screen. Errors are shown.
- **Verified:** on the iOS Simulator (Expo Go plus the Auth emulator), Google sign-in → Commute (the emulator recorded a `google.com` account) → Sign out → sign-in, with no errors. 5 Jest tests for the button.
- **Not verified:** the real Google account picker. It needs the OAuth client IDs from the Firebase project and a development build.
