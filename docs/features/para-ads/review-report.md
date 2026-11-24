FAIL

# Review report: para-ads (Para Ads: local business advertising)

Reviewer: acceptance-reviewer, 2026-11-19. Every result below comes from checks run in this cycle. Nothing is committed, so the files were reviewed directly instead of through a git diff.

## Criteria

| ID | Criterion | Status | Evidence |
|---|---|---|---|
| AC1 | Admin creates a campaign (photo, schedule, purchase amount, price ₱0.50/0.80/1.00 or custom); the portal shows expected views; non-admins can't create, edit or upload | MET | Form: para-portal/src/screens/admin/ParaAds/CampaignFormDialog.tsx:69-121 (photo, dates, budget, price), :290 (PRICE_PICKS), :303 ("≈ N views" from paraAdsText.ts:53). Server validation: para-backend/functions/src/paraAds/campaign.ts:208-265. Permissions: paraAdFunctions.ts:139,149,195,230 (`requirePermission("ads:manage")`), lib/auth.ts:26,40. Reviewer probe (emulator, real auth tokens): commuter and fleet tokens get PERMISSION_DENIED from all 4 admin callables; a fleet token's Storage upload gets 403. Scenario: anonymous upload gets 403; draft saved with ₱2.40 at ₱0.80. |
| AC2 | The list shows budget, spent, remaining (₱ and views) and views, and updates within seconds after each counted view | MET | CampaignCard.tsx:77-92; live `onSnapshot` in src/hooks/useLiveCampaigns.ts:21-29; firestore.rules:102-109 lets admins read. No ui-test-report.md exists. The live update was only reported by the developer, not seen by a QA run. |
| AC3 | With an eligible Para Ad, Watch Ads shows it (photo, business, headline, Sponsored, countdown); without one, AdMob as today | MET (component level) | src/hooks/watchAdForLiveView.ts:58-62 (para path) and :63-81 (AdMob unchanged); ParaAdCard.tsx:49-79; ParaAdHost in src/app/(commuters)/_layout.tsx:33. Tests pass: ParaAdCard.test.tsx (3) and watchAdForLiveView.test.ts:42,60. Scenario: "active Para Ad picked first", "draft → AdMob", "used up → AdMob". Not seen on a device (disclosed). |
| AC4 | Eligibility respects status, schedule, daily hours, routes and remaining balance; a campaign that can't pay one more view becomes `exhausted` and isn't shown | MET | campaign.ts:109-118 (isEligible), :156-162 (chargeView sets exhausted); paraAdFunctions.ts:318. Unit tests "eligibility…" and "charging a view never goes below zero" pass. Scenario: "after 3 views … exhausted" and "used up: AdMob". See defects 4 and 5 for the gaps at confirm time and after the end date. |
| AC5 | Counts only after minSeconds, once, for the starting commuter; charges exactly the price, grants the route pass, shares by config/paraAds; never negative under concurrency | MET, with major defect 1 | paraAdFunctions.ts:278-290 (owner, source, once, TTL, minSeconds), :295-298 (all reads before writes), :305-328 (charge, day stats, share, pass); recordSharedView only writes (viewFunctions.ts:290+). Scenario: refused before 5 s, ₱0.80 charge, 60/20/20 (driver +₱0.48), duplicate refused, SSV refused ("200 invalid"). Reviewer probe: another commuter gets NOT_FOUND; a driver gets PERMISSION_DENIED; 6 concurrent confirmations on a 3-view budget lead to exactly 3 charged, spent ₱2.40, status exhausted, 3 view records, and day stats that agree. |
| AC6 | Drivers and fleets see Para Ad earnings in earnings, history and weekly settlements | MET (amounts); label missing | recordSharedView writes the same driverEarnings / vehicleEarnings / fleet / platform docs and `views.driverIds` (viewFunctions.ts:290-330+), kind "paraAd" + campaignId (:299-300). Scenario: driver earnings +₱0.48. The "Para Ads" label in Earnings/History (§4) is not done (disclosed); see defect 7. |
| AC7 | Closing before the countdown ends unlocks nothing and charges nothing | MET | watchAdForLiveView.ts:59 returns before `paraAdViewed`; ParaAdCard.tsx:75 disables Continue during the countdown; server refuses early confirmations (paraAdFunctions.ts:287-290). Test watchAdForLiveView.test.ts:53 passes; scenario "before 5 seconds counts nothing" passes. |
| AC8 | Backend unit tests (eligibility, picking, charging, rounding, exhaustion, concurrency); emulator scenario; portal and app component tests; tsc and lint clean | NOT MET (partial) | Backend: 63/63 pass, including 7 in campaign.test.ts. There is no automated concurrency test (the pure functions can't cover it, and the scenario confirms views one at a time). Concurrency was verified only by the reviewer's ad-hoc probe. Scenario: 26/26 pass. App component tests: present and passing. Portal component tests: none, because the portal has no test runner (disclosed). tsc and lint are clean in all three projects. |

## Checks (run this cycle)

- `para-backend/functions: npm test`: 63 tests, 63 pass, 0 fail.
- `para-backend/functions: npx eslint src --ext .ts`: exit 0, no output.
- `para: npx tsc --noEmit`: exit 0.
- `para: npx expo lint`: exit 0, 0 errors, 12 warnings (all pre-existing, none in para-ads files).
- `para: npx jest`: 504 tests, 496 passed, 6 failed, 2 skipped. The 6 failures are exactly the known pre-existing ones: GoogleButton emulator account, LiveTrackingScreen "renders the design content", SignInScreen form, font roles AC47, navigation "opens the commuter sign-in at /", semantic colours Duty hub. There are no regressions.
- `para-portal: npx tsc --noEmit`: exit 0. `npx expo lint`: exit 0, no problems.
- Emulator scenario scenarioParaAds.js: 26/26 passed.
- Reviewer probe /private/tmp/claude-502/-Users-fullscale-Desktop-ai-agents/7354104c-c58e-48ba-b29a-363cc6c27014/scratchpad/reviewProbeParaAds.js (emulators only): 14/14 passed. It covered admin-callable permissions with commuter and fleet tokens, a Storage upload by a non-admin, the owner check, the driver refusal, and 6 concurrent confirmations against a 3-view budget.

## Defects

1. [major] para-backend/functions/src/paraAds/paraAdFunctions.ts:301-303 together with para-backend/functions/src/ads/adFunctions.ts:152-165. A commuter can start several Para Ad views back to back, because `adViewStart` only refuses when a pass already exists, and `dailyCap` only counts views that were already rewarded. The commuter can then confirm all of them 5 s later. Each confirmation charges the business, but only the first one grants a pass; the rest return "credited". The reviewer probe shows this: 6 parallel views led to 3 charges, and 2 of those were "credited, charged: true". As a result:
   - the business pays for views that unlocked nothing;
   - the plan's server-side `config/ads.dailyCap` is bypassed;
   - the 20/day/campaign limit can be used up in about 5 s instead of about 1 hour.

   Expected fix: in `paraAdViewed`, don't charge or share when `passCovers(passSnap.data(), view.routeId)` is already true (result "credited"). Also, in `adViewStart`, refuse or reuse when the commuter already has an unconfirmed `started` Para Ad view younger than the TTL. Then add an emulator or unit test for parallel confirmations.
2. [major] para-portal/src/screens/admin/ParaAds/ (no detail view). Plan §5 "Detail: views per day and spent per day" is not implemented. The backend writes `adCampaigns/{id}/days/{day}` (paraAdFunctions.ts:320-323) and the rules allow admins to read it (firestore.rules:105-108), but no portal screen reads it. This gap is not listed in "Not done yet". Expected fix: add a per-campaign detail (dialog or expandable section on CampaignCard) that lists views and spent per day from `adCampaigns/{id}/days`, or get the user to drop it from scope explicitly.
3. [major] AC8 test coverage:
   - There is no automated concurrency test. Add an emulator scenario step that confirms N views in parallel against a budget for fewer than N, and asserts the spent amount, views, exhausted status, and the number of view records (the reviewer probe can be reused).
   - There are no portal component tests (disclosed limit). Either add a portal Jest setup with at least the form estimate/validation and the CampaignCard remaining display, or get the user to accept the reduced AC8 explicitly.
4. [minor] paraAdFunctions.ts:301-303. At confirm time, the charge only re-checks `status === "active"` and the money. It does not re-check the schedule (`endAt`), the daily hours or the route, so a view confirmed after `endAt` (up to 1 h after start) is still charged. Expected fix: use `isEligible(campaign, now, view.routeId ?? undefined)` (or at least the schedule check) together with `chargeView` before charging.
5. [minor] para-portal/src/screens/admin/ParaAds/ParaAdsScreen.tsx:45-46 and CampaignCard.tsx:63. A campaign whose `endAt` has passed keeps `status: "active"`. The portal shows it as running and counts its remaining amount in "Remaining (running)". Expected fix: derive a "Finished/Scheduled" display from `startAt`/`endAt` in the portal, or mark campaigns `ended` on the server when the schedule ends.
6. [minor] para/src/screens/commuters/LiveTracking/LiveTrackingScreen.tsx:77 (`adsSupported() || pass.paraAds`). On web, Watch Ads is now offered when a Para Ad runs. Plan §6 says "Web: no ads, as today". Expected fix: add `Platform.OS !== 'web' &&` to the Para Ads branch, or record the user's approval of the change in the plan.
7. [minor] Driver Earnings and History do not show "Para Ads" views apart from other views (plan §4, label only; disclosed). Expected fix: label views with `kind === "paraAd"` in the driver history/earnings rows.
8. [minor] para-portal/src/screens/admin/ParaAds/ParaAdsScreen.tsx:82-84. The header hard-codes "drivers 60%, fleets 20%, Para 20%", but the split comes from `config/paraAds` and can be changed. Expected fix: drop the numbers, or read them from config.
9. [minor] para-portal/src/screens/admin/ParaAds/CampaignFormDialog.tsx:96-98. If saving a new ad fails after the upload, every retry asks for a new id and uploads another photo, which leaves orphan files in `paraAds/`. Expected fix: keep the id from the first `newId()` (and the uploaded image) in state for the dialog's lifetime.
10. [minor] para-backend/functions/src/paraAds/campaign.ts:224-227. `imageUrl` is only checked against the bucket prefix and is not tied to `imagePath`, so any object in the project bucket is accepted. Expected fix: also require that the URL's object path equals `encodeURIComponent(imagePath)`.
11. [minor] para/src/screens/commuters/ParaAd/ParaAdHost.tsx:17. The key `campaignId + minutes` does not change when the same campaign is requested again while one is still showing, so the countdown would not reset. The server still enforces `minSeconds`, so the impact is low. Expected fix: give each request a unique id in `paraAdPresenter` and use it as the key.
12. [minor] para-backend/functions/src/paraAds/paraAdFunctions.ts:108. The `paraAdSeen/{uid}.seen` map grows by one entry per campaign forever. Expected fix: prune entries older than `repeatMinutes` when writing.
13. [minor] The emulator scenario's "not on a route it does not target" step passes for the wrong reason: the result is `no-incoming`, not a targeting refusal. Route targeting is therefore covered only by the unit test. Expected fix: put a jeepney on a second route and assert `source: "admob"` there.
14. [process] para/docs/features/para-ads/ui-test-report.md does not exist, so no UI QA run gives evidence for AC2 (portal live update) or AC3 (modal). The Para Ad modal has not been seen on a device (disclosed).

## Code review notes (no defect)

- Money: values are integer micro-pesos, and `remainingMicro` is clamped at 0. `chargeView` refuses when fewer than 1 view is left. The transaction in `paraAdViewed` does all of its reads (adView, campaign, daily count, pass) before any write. The concurrency probe confirmed that the balance never goes negative.
- Anti-abuse:
  - a minimum time is enforced (`minSeconds` with 500 ms slack);
  - a 1 h TTL applies;
  - the owner check works (`view.uid !== uid` → not-found), and a view can only be confirmed once (`status !== "started"` → duplicate);
  - the per-commuter daily limit is in `paraAdDaily`;
  - `grantAdView` refuses `source === "para"`, so the SSV callback can't confirm a Para Ad.
- Permissions:
  - `ads:manage` is checked on all four admin callables;
  - Firestore `adCampaigns` and `days` are read-only for super_admin and admin, and write is false;
  - `storage.rules` lets admins write `paraAds/**` (under 2 MB, image types only) and lets signed-in users read.
- URLs: `ctaUrl` must be https; image URLs must start with the project bucket prefix (localhost only on the emulator); `imagePath` must sit under `paraAds/{id}/`.
- Architecture: packages do not import from `src/`; commuter screens do not import driver screens; the route file `src/app/(admin)/para-ads.tsx` only imports the screen; the portal route is guarded by the PortalShell permission check.
- No secrets in the new files and no stray `console.log` calls. Errors are shown to users: toast or inline in the portal, `Alert` in the app.

## Scope

- Files reviewed match the plan's backend, portal and app lists. No unexpected files were found in the paths given. A diff-based scope check was not possible because nothing is committed.
