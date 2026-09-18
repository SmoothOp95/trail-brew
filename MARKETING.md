# Marketing website

Built on `codex/tra-67-app-store-pages` (PR #28) in the `SmoothOp95/trail-brew` repository.

## Routes

- `/`: the main web app homepage (dashboard).
- `/ios`: public iPhone marketing page; proposed App Store Marketing URL is `https://trailbrew.co.za/ios` after deployment.
- `/app`: alias of the web dashboard homepage and the installed PWA launch destination.
- `/trail-finder`, `/trails` and other tool routes: existing web features.
- `/support` and `/privacy`: public pages from PR #28.

Public routes do not import Firebase or require authentication. Route selection responds to client-side navigation, including transitions to and from support and privacy pages.

## App access

Until the App Store listing is available, the page uses the existing `testflightWaitlist` Firestore collection. It loads the service on form submission and uses the existing email validation and access rules. No new service, collection or sign-in requirement is introduced.

For local signup and web-tool testing, supply the existing `VITE_FIREBASE_*` settings from `.env.example` in `.env.local`. The marketing, support and privacy pages can be previewed without these settings. Do not commit environment files. Production uses the repository's existing deployment configuration.

When the App Store listing is public, set `VITE_APP_STORE_URL` to its full `https://apps.apple.com/...` URL in the build environment and rebuild. The final CTA and availability FAQ switch to the App Store; the waiting list is removed from the marketing page.

## Assets and copy

The three app screenshots are supplied by the product owner. WebP copies are used for delivery. Their phone framing is CSS, not a recreation of the app UI. The social-sharing card has an editable SVG source and a 1200 × 630 PNG export.

Feature copy comes from the iOS project: Gauteng trail finder, private trail plans and explicit ride sharing, optional Apple Health, multiple bikes, component intervals and service records. The site makes no claims about pricing, ratings, download counts, release dates or Android availability.

## Verification

Run `npm run build` and `npm test -- --run`. Preview with `npm run dev`.

Manually check desktop and mobile navigation, FAQ disclosure, email validation, support/privacy return navigation and screenshot loading. For a deployed environment, verify a waiting-list submission using an authorized test address. Local checks intentionally do not create production waiting-list entries.

The branch is a local implementation; deployment and merging are separate steps.
