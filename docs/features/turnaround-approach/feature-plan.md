# Feature plan: orange approach across the turnaround

Status: **approved by request** (2026-11-23). The user will ask to revert if the acceptance criteria don't hold.

## Request

Make the route orange for both the "going to" end and the "going back" start around the turnaround. The orange line shows the road a jeep takes to reach the waiting pin, even across the end of the route. The road after the pin is grey.

## Today

- **The map:** the commuter's direction lane is orange end to end, and the other lane is grey.
- **Who's coming** (the map's colours, the arrival time, and the backend's ₱1 share): a jeep counts only if it's on the commuter's direction, before the boarding point.
- **The problem:** a jeep finishing "going to" turns around and becomes the next "going back" jeep. It isn't counted for a commuter waiting just after the turnaround, though it reaches them in a few minutes.

## Design

1. **Joined directions:** a direction "turns into" the other when its last point is within **300 m** of the other's first point (`TURN_JOIN_M`). That's the turnaround loop, like 14D at Vicente Gullas St.
2. **Approach gap:** the road metres from a jeep to the boarding point.
   - **Same direction, before the boarding point:** boarding point − jeep, as today.
   - **The direction that turns into the commuter's:** (rest of the jeep's direction) + (boarding point's distance along the commuter's direction). It counts only up to **3 km** in total (`ACROSS_TURN_M`), so only the stretch near the turnaround is added.
   - **Anything else:** not coming.
3. **Map, with a boarding point** (pin or GPS):
   - Both lanes are drawn grey.
   - Orange on top:
     - the commuter's direction from its start up to the boarding point;
     - the joined end of the other direction (the last 3 km minus the boarding distance).
   - Without a boarding point, the map stays as today.
4. **The same gap** sets the jeep colours, the arrival minutes, the next jeep, the units list, and the backend's `incomingOnRoute`, which picks the jeeps sharing the ₱1. The backend needs a deploy.

## Acceptance criteria

- AC1 A commuter waiting near the start of their direction, after the turnaround, sees the end of the other direction orange up to the turnaround, and their own direction orange up to the pin.
- AC2 The road after the boarding point is grey.
- AC3 A jeep on the other direction's joined end, within 3 km of road from the pin, is orange (coming), counts in the arrival time and units list, and shares the ₱1. Further away, or on directions that don't join, it doesn't.
- AC4 Same-direction behaviour is unchanged.
- AC5 Unit tests cover the gap, the join check and the map segments, in the app and the backend. tsc, lint and the backend tests pass.

## Revision 1 (2026-11-23): both ways with a waiting pin

Request: "Make color orange to all corridor routes, vice versa, if the pin waiting area is closer to the out-going route." The user picked **Both ways to the pin**.

- With a waiting pin, the picked direction no longer applies:
  - Both directions get a boarding point.
  - Every road leading a jeep to the pin is orange, on "going to" and "going back", crossing the turnaround either way.
  - Only the road after the pin is grey.
- The confirm drawer doesn't ask for a direction when a pin is set.
- ₱1 and ads send no direction, so the backend shares the view with jeepneys coming either way.
- The turnaround crossing now also applies with both directions open. A jeepney that passed the pin on one side counts if it comes round to the other side within 3 km of road.
- Without a pin (GPS only), the picked direction still applies, as before.

- AC6 With a pin, both directions' roads leading to the pin are orange, and the roads after it are grey.
- AC7 With a pin, the drawer shows no direction picker, and ₱1 / ads send no direction.
- AC8 With both directions open, a jeepney past the pin that comes back round within 3 km counts. Further away, it doesn't.

## Revision 2 (2026-11-23): too far to wait; both lines orange with a pin

Request: "Drivers too far to wait, make it gray. And please make the routes vice versa colour orange, since the vehicle will change to gray if passed by or too far to wait."

- **Too far to wait:** a jeep counts as coming only within **3 km of road** of the boarding point (`MAX_WAIT_M`, about 10 min), on the same direction or across the turnaround.
  - A jeep further away is grey, isn't in the ETA, the next jeep or the units list, and doesn't share the ₱1 (backend `approachGap`).
  - Without a pin, the orange approach stretch is limited to the same 3 km.
- **With a waiting pin, both route lines are orange end to end.** The jeep's own colour shows coming (orange) or passed / too far (grey).
- **Without a pin**, the picked direction is orange and the other grey, as before.

- AC9 A jeep over 3 km of road from the boarding point is grey and doesn't share the ₱1. Within 3 km, it's orange.
- AC10 With a pin, both directions' lines are orange. Without one, only the picked direction's approach is.

## Revision 3 (2026-11-23): back to orange for incoming roads

Request: "Please revert it back to routes orange for incoming vehicles. Vehicles too far to wait: colour gray."

- **Reverted** Revision 2's "both lines orange with a pin". Again, orange is only the road incoming jeeps use to reach the boarding point (both ways with a pin, across the turnaround). Everything else is grey.
- **Kept** Revision 2's "too far to wait": over 3 km of road is grey, isn't in the ETA, and doesn't share the ₱1. The orange stretch also stops at 3 km.
- AC10 is replaced by: with a pin, only the roads leading incoming jeeps to the pin (within 3 km) are orange.

## Revision 4 (2026-11-23): the pin's lane only

Context: at the Fuente Osmeña rotunda, the user drew the "Going back" road after their pin (west side, round the south, out to the south-east) and said the route should go there. 14D's saved road already goes that way in both directions (anticlockwise). It was grey only because it was the road after the pin. The user chose **Pin's lane only**.

- With a waiting pin, the commuter's direction is the lane whose road is nearest the pin (`nearestLane`), per route. The other direction is grey.
- That lane is orange end to end: the road jeeps come on and the ride after the pin. There's no separate approach overlay with a pin.
- The arrival time, the units list and the jeep colours count only jeeps coming on that lane (plus across the turnaround into it, within 3 km).
  - Jeeps that passed or are more than 3 km away stay grey.
- ₱1 and ads send that lane as the direction, so the backend shares with the same jeeps. The drawer still doesn't ask for a direction when a pin is set.
- This replaces Revision 1's "both ways with a pin". Without a pin, the picked direction still applies.
- AC11 With a pin, the lane nearest the pin is orange end to end, and the other lane is grey.
- AC12 With a pin, only jeeps coming on the pin's lane (or across the turnaround into it, within 3 km) are orange, count in the ETA, and share the ₱1.

## Revision 5 (2026-11-23): half of the other lane when the pin is close to both

Request: "If the waiting pin is closer to vice versa, make the colour orange half of the vice versa to wait incoming vehicles."

- With a pin, the pin's lane stays orange end to end (Revision 4).
- **When the pin is also within 200 m of the other direction's road** (`BOARD_ON_ROAD_M`, the same distance as boarding on the road), jeeps coming that way stop there too. In that case:
  - **The map:** the other lane is orange only on the half leading its jeeps to the pin, up to 3 km before it, across the turnaround too. After the pin it's grey.
  - **Jeeps** coming on either lane are orange and count in the arrival time and the units list.
  - **₱1 and ads** send no direction (both ways), so the backend shares with jeeps coming either way. The backend boards on the road within 200 m too, so it picks the same jeeps.
- When the other road is further than 200 m, only the pin's lane counts (Revision 4).
- AC13 With a pin within 200 m of both directions' roads, the other lane is orange up to the pin and grey after it, and jeeps coming on either lane are orange and share the ₱1.
- AC14 With the other road further than 200 m, only the pin's lane is coloured and counted.

## Revision 6 (2026-11-23): colours by paid access and nearness to the end

Request:
- No paid access: show the default colours for both "going to" and "going back".
- Paid access, pin close to the end of "going to": make half of "going back" orange.
- Paid access, pin far from the end of "going to": the default orange and grey.

- **No paid access (locked):** the default colours. The picked direction is orange and the other grey. The pin doesn't change the colours (there are no jeeps to show).
- **Paid access, pin near the end of its lane:**
  - "Near the end" means within **1 km of road** before the turnaround (`NEAR_END_M`), where the other direction starts, and within 200 m of that direction's road.
  - The pin's lane is orange. The other direction is orange from the turnaround up to the pin, and grey after it.
  - Jeeps coming on either lane count and share the ₱1 (no direction sent).
- **Paid access, pin far from the end:** the default colours for the pin's lane (orange) and the other (grey). Only the pin's lane counts, even where both directions run close together mid-route.
- Replaces Revision 5's "any spot within 200 m of both roads".
- AC15 Locked: picked direction orange, other grey, whatever the pin.
- AC16 Paid, pin within 1 km of the turnaround and 200 m of the other road: the other road is orange up to the pin, and both lanes' jeeps count.
- AC17 Paid, pin far from the turnaround: the pin's lane is orange and the other grey, and only the pin's lane counts.

## Revision 7 (2026-11-23): Going to / Going back selector

Request: "Please put the button selection if going to or going back."

- **The selector:** two buttons under the route chips, with the selected route's labels (e.g. "Going to Legaspi St" / "Going back to Cofta Mouldings Corporation").
  - They appear on both sheets (locked and unlocked) (`DirectionSwitch`, testID `direction-picker`).
  - None is selected until the commuter taps one, so the ₱1 drawer and the switch agree.
- **The pick drives the colours:** the picked direction is the orange lane on the map. With a pin, it replaces "the lane nearest the pin" (Revision 4).
  - The near-end rule (Revision 6) applies to the picked lane. When the pin is within 1 km of that lane's end and 200 m of the other road, the other road is orange up to the pin.
- **₱1 and ads** send the picked direction (or both near the end).
- The collapsed sheets are 60 pt taller to fit the selector.
- AC18 The sheet shows Going to / Going back for the selected route. Tapping one selects it, makes it the orange lane, and it is what ₱1 / ads send.

## Revision 8 (2026-11-23): last 1 km of the other direction when the pin is near the start

Request:
- Change the colour to orange on the last 1 kilometre of "going to", only if the waiting pin is closer to the "going back" route.
- Show the default orange and grey if the waiting pin is away from the start of the route. Likewise from "going back".

- **Pin near the start:** within 200 m of the picked direction's road and within **1 km of road** of where that direction starts (`turnaroundTail`). Then the last 1 km of the other direction, leading into the turnaround, is orange too, because those jeeps turn round and come to the pin. This works both ways ("Going to" / "Going back").
- **Pin further from the start:** the default colours (picked direction orange, other grey).
- **Locked or paid:** this line colouring applies in both. A locked route still shows no jeeps. It's added on top of Revision 6's near-end rule, which is unchanged.
- AC19 With the pin within 1 km of the start of the picked direction (and on its road), the last 1 km of the other direction is orange.
- AC20 With the pin further than 1 km from that start, the default colours.

## Revision 9 (2026-11-23): 1.5 km instead of 1 km

Request: "Update at least from 1 km to 1 and half km."

- `NEAR_END_M` is now **1.5 km**. This changes:
  - the last stretch of the other direction drawn orange (Revision 8);
  - how close to the start of the picked direction the pin must be to show it (Revision 8);
  - the "near the end" distance of Revision 6.
- AC19 and AC16 now read 1.5 km.

## Revision 10 (2026-11-23): 2 km

Request: "Let's try at least the last 2 kilometres."

- `NEAR_END_M` is now **2 km**: the orange stretch of the other direction, how near the start the pin must be, and the "near the end" distance (Revisions 6, 8, 9).

## Revision 11 (2026-11-23): early boarding before the turnaround

Request: "Please extend the colour orange if commuters choose going back to Apas but the waiting pin is still part of going to. The goal is to ride the jeepney early, due to a lot of vacant seats available."

- **When it applies** (`earlyBoardLane`): the commuter picked a direction (e.g. Going back), but the pin is on the road of the direction that turns into it (e.g. Going to), within 200 m and nearer that road than their own.
- **Then the commuter boards there**, before the turnaround, and rides round it:
  - **Orange:** the boarding road from up to 3 km before the pin to its end at the turnaround, plus all of the picked direction.
  - **The boarding card** shows the spot on that road ("Board here, on the route").
  - **Coming jeeps, arrival time and ₱1 / ads:** jeeps on that road before the pin, and that road's direction is sent, so the backend shares with the same jeeps.
- It applies locked or paid (lines). A locked route shows no jeeps.
- AC21 With "Going back" picked and the pin on the "Going to" road (before the turnaround), "Going to" is orange from 3 km before the pin through the turnaround, "Going back" is orange, and the coming jeeps and ₱1 are the "Going to" jeeps before the pin.

## Revision 12 (2026-11-23): back to 1.5 km

Request: "Let's make it back to at least the last 1.5 kilometres for the extended orange."

- `NEAR_END_M` is back to **1.5 km**. This covers:
  - the last stretch of the other direction (Revision 8);
  - how near the start the pin must be;
  - the near-end rule (Revision 6).
- **Early boarding (Revision 11):** the boarding road is orange from up to **1.5 km** before the pin (was 3 km) to the turnaround.
- Jeeps up to 3 km away still count as coming (orange marker, `MAX_WAIT_M`). Only the drawn line is shorter.

## Revision 13 (2026-11-23): early boarding only near the turnaround

Request: "If the waiting pin has two ways, going to and going back, and the commuter chooses going back to Apas, make only going back to Apas the orange default route if the pin is too far from the end of the going to route."

- Early boarding (Revision 11) now also needs the pin within **1.5 km** (`NEAR_END_M`) of the end of the direction it boards on (the turnaround).
- Further away, for example on a street both directions use, the picked direction is the default: it's orange, the other is grey, and the commuter boards on the picked direction.
- AC22 With the pin on a shared street more than 1.5 km before the end of "Going to", and "Going back" picked, only "Going back" is orange.

## Revision 14 (2026-11-23): 2 km again

Request: "Please change the last 1.5 km to 2 km, let's see if that also fixed it."

- `NEAR_END_M` is **2 km**. This covers:
  - the turnaround stretch and how near the start the pin must be (Revision 8);
  - the near-end rule (Revision 6);
  - the early-boarding stretch before the pin;
  - how near the turnaround the pin must be for early boarding (Revisions 11, 13).

## Revision 15 (2026-11-23): no extension on a shared street (all routes)

Request: "Could you please apply these to all routes? If the waiting pin has two ways and going to Apas is selected, show only the route going to Apas. Apply the extension if the going to and going back routes are far away from each other."

- **Shared street:** both directions' roads are within **50 m** of the pin (`SHARED_STREET_M`, `onSharedStreet`). This means they run along the same street there.
- **On a shared street:** only the picked direction is orange and counted. There's no extension:
  - no early boarding (Revision 11);
  - no turnaround tail (Revision 8);
  - no both-ways near the end (Revision 6).
- **Where the two directions run on different streets:** the extensions apply as before.
- The rule is in shared code used for every route.
- AC23 With the pin on a street both directions use, only the picked direction is orange (no extension), on any route.

## Revision 16 (2026-11-23): early boarding on a one-direction street at any distance

Request: "Please adjust the early-boarding; there is only one direction." The pin on 17C was on a street only "Going to Carbon" uses, more than 2 km before its end, with "Going back to Apas" picked.

- Early boarding no longer needs the pin within 2 km of the turnaround (Revision 13).
- That limit existed for streets both directions use, which Revision 15 now handles: no extension there.
- On a street only the other direction uses (within 200 m of its road, nearer it than the picked road, not a shared street), the commuter boards there early at any distance. That direction must turn into the picked one.
- Orange: the boarding road from up to 2 km before the pin through the turnaround, then the picked direction.
- AC24 With "Going back" picked and the pin on a one-direction "Going to" street anywhere before the turnaround, "Going to" is orange from the pin through the turnaround.
