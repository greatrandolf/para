# Feature plan: waiting pin

Status: **approved by request** (2026-11-23).

## Request

"Implement a set waiting pin marker. Use this pin marker for the Para Piso real coordinates for revenue sharing, so users have a buffer and can see [the jeepneys] while going to the pinned location."

## Today

- The Live Map uses the commuter's GPS (`useCommuterLocation`) for everything:
  - the routes on their way (`useCommuteOptions`);
  - where they board ("Board here, on the route");
  - which jeeps are coming (orange) or have passed (grey);
  - the arrival card.
- The ₱1 purchase (`viewsPurchase`), the watched ad (`adViewStart`) and "Notify me" (`watchStart`) send `lat`/`lng`. The backend (`findIncoming`) shares the ₱1 among the jeepneys coming to *that* point. The backend already takes the coordinates from the app, so nothing changes there.
- So a commuter who pays while still walking to the road gets jeeps coming to where they stand now. A jeep that passes their real boarding spot before they arrive can be counted, and one that matters may not be.

## Design

1. **Waiting point = pin, else GPS.** `waitingPoint(pin, gps)` in `LiveTracking/waitingPin.ts`. The screen uses it in place of the raw GPS for:
   - the routes on the way;
   - the map's boarding point and coming/passed colours;
   - the arrival card;
   - the ₱1 purchase, the watched ad (Google or Para Ad) and "Notify me".

   So the ₱1 is shared by the jeepneys coming to the pin.
2. **Setting the pin** (Live Map):
   - The **Set waiting pin** pill under the status pill starts placing mode (revised 2026-11-23: "commuter's decision"):
     - The map centres on the commuter (or the current pin), and a pin stays fixed in the middle.
     - The commuter moves the map under the pin, then taps **Wait here** (or **Cancel**).
     - Tapping the pin pill later moves it again the same way.
   - A long press on the map drops it there.
   - The pin can be dragged.
3. **The pinned state:**
   - The pill reads "Waiting pin • 350 m from you" and has a ✕ that clears the pin.
   - The boarding card ("Board here, on the route • …") sits on the pin, and the commuter's own location stays as a small dot.
4. **Buffer limit:** the pin must be within **2 km** of the commuter's GPS, a walkable distance. A pin further away is refused with "Pin a spot within 2 km of you". Without GPS (denied or off), any pin is allowed, so the map works without location.
5. **The pass stays put:** moving or clearing the pin after paying doesn't change a running pass. It only affects the next purchase.
6. **On the phone only:** the pin lives only on the phone and only while the Live Map is open. Its coordinates go to the backend only with a purchase, ad or watch, rounded to ~110 m like today.

## Acceptance criteria

- AC1 **Set waiting pin** drops a pin at the map's centre; a long press drops it at the pressed spot; dragging moves it.
- AC2 With a pin, the boarding card, the coming/passed colours and the arrival card are worked out from the pin, not GPS.
- AC3 With a pin, ₱1, Watch Ad (Google and Para Ad) and "Notify me" send the pin's coordinates. Without one, they send GPS as before.
- AC4 A pin more than 2 km from the commuter's GPS is refused with a message, and the old pin (or none) stays.
- AC5 The pill shows the distance from the commuter to the pin, and ✕ clears it (back to GPS).
- AC6 Without location permission, a pin still lets the commuter pay or watch, with the pin's coordinates.
- AC7 Unit tests cover `waitingPoint` / the 2 km check. Screen tests cover setting, clearing and the purchase coordinates. tsc and lint are clean.

## Out of scope

- Storing the pin on the backend, or recording on the view whether it came from a pin. This would need a backend field and a deploy before the app ships; it can follow.
- Keeping the pin after the app restarts.
