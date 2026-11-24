# Feature plan: ₱3 welcome credit, once per device

Status: **approved by request** (2026-11-19).

## Request

"Make a default 3 pesos every successful install + registration per device, not per registration."

## Today

- `walletMe` creates a new commuter's wallet with `config/earnings.starterCentavos` (default **₱45.00**) the first time it's called. That's once per **account**: a second account on the same phone gets ₱45 again.
- Production has no `config/earnings` doc, so the code default applies. The project has 2 wallets.

## Design

1. **Default ₱3.00:** `DEFAULT_EARNINGS.starterCentavos = 300`. It can still be changed with `config/earnings.starterCentavos`.
2. **New wallets start at ₱0** with `starterEligible: true`. Wallets made before this change keep their balance and are never eligible (no extra ₱3).
3. **The device id** (`src/services/deviceId.ts`, app):
   - **Android:** `Application.getAndroidId()`. It's per device and per app signing key, and survives uninstalling and reinstalling.
   - **iOS:** a random id kept in the **Keychain** (`expo-secure-store`). Keychain items survive deleting and reinstalling the app, which `identifierForVendor` doesn't.
   - **Web:** no device id, so no welcome credit (it's for app installs).
4. **New callable `walletClaimStarter({platform, deviceId})`** (commuter). In one transaction:
   - The server keys each device as `sha256(projectId + platform + deviceId)` in `starterDevices/{hash}`, so raw ids are never stored.
   - It credits `starterCentavos` only when the wallet is `starterEligible` **and** the device has no claim yet. Then it:
     - creates the device claim `{uid, at}`;
     - adds the credit to the balance;
     - writes a ledger entry `kind: "starter"`;
     - sets `starterEligible: false`, `starterClaimedAt`.
   - Otherwise it only marks the wallet not eligible and returns `{credited: false, reason: "device-used" | "not-eligible"}`.
5. **App:** `useStarterCredit()` runs in the commuter tabs. When the wallet says `starterEligible`, it gets the device id, calls `walletClaimStarter` once and refreshes the wallet, so the balance shows ₱3.00. There's no pop-up.
6. `walletMe` returns `starterEligible`, so the app knows when to claim.

## Acceptance criteria

- AC1 A new commuter on a device never used for the welcome credit gets ₱3.00 after registering, once. A ledger entry `starter` records it.
- AC2 A second account registered on the same device gets ₱0 (reason `device-used`), including after reinstalling the app (Android id, iOS Keychain).
- AC3 Calling the claim again for the same account never adds more.
- AC4 Wallets that existed before the change get nothing extra and keep their balance.
- AC5 Web sign-ups get no welcome credit.
- AC6 The amount is `config/earnings.starterCentavos`, ₱3.00 by default.
- AC7 Raw device ids are never stored, only a salted hash.
- AC8 Backend unit tests cover the claim decision. An emulator scenario covers: new account → ₱3; second account, same device → ₱0; repeat → ₱0; old wallet → ₱0. There's an app test for the hook. tsc and lint are clean.

## Limits (accepted)

- A factory reset (Android) or erasing the phone (iOS) counts as a new device. Rooted or jailbroken phones can fake ids.
- Firebase App Check would make faking harder; it's out of scope here.

## Revision 1 (2026-11-24): ₱1 welcome credit

Request: "Please update the prod backend registration that every commuter will have 1 Piso." The user chose ₱1, still once per phone.

- **Production:** `config/earnings.starterCentavos = 100` (₱1.00), set 2026-11-24. That document didn't exist before, so every other setting still uses the code defaults.
- **Code default:** `DEFAULT_EARNINGS.starterCentavos` is also 100, so the emulators match. Production is governed by the config document, so no deploy is needed for this.
- **Existing wallets:** unchanged. Wallets that already got ₱3 keep it, and devices that already claimed get nothing more.
- AC6 now reads: the amount is `config/earnings.starterCentavos`, ₱1.00 by default and in production.
