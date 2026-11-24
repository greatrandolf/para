# Fix report: Para Ads (UI test bugs, 2026-11-22)

## BUG-1 (major): Portal "Daily views" never loaded
- **Root cause:** `para-portal/src/hooks/useCampaignDays.ts` queried `adCampaigns/{id}/days` with `orderBy(documentId(), 'desc')`. Firestore can't scan document ids in descending order ("Firestore does not support descending key scans"). `limitToLast` doesn't help, because it scans in reverse internally.
- **Fix:** read the days from 13 days before today onward (`where(documentId(), '>=', <Manila day>)`, ascending), then reverse on the client so the latest day is first.
- **Verified:** in the local portal the panel lists 2026-11-22 with 1 view and ₱0.80.

## BUG-2 (cosmetic): Top up dialog said "About 0 views left" while closing
- **Root cause:** the dialog read the ad from its `campaign` prop, which is set to null as soon as the top-up succeeds. During the close animation it then computed 0 views.
- **Fix:** `TopUpDialog` keeps the last ad while closing and clears the amount when it opens for another ad.
- **Verified:** while closing it still showed "About 759 views left after this". The card and toast showed ₱607.20 • 759 views.

## Checks
- `para-portal`: `npx tsc --noEmit` and `npx expo lint` are clean.
- The portal has no test runner, so there are no regression unit tests. Both fixes were checked in the running portal.
