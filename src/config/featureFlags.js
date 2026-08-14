/**
 * @fileoverview Web-live switches for features that now default to an
 * app-only preview (see src/components/appPreview/AppOnlyFeature.jsx).
 * The real implementations are untouched — flip a flag to true and
 * App.jsx routes back to the live component. One-line change either way.
 */
export const WEB_LIVE_FEATURES = {
  rideCalendar: false,
  myTrails: false,
  serviceDashboard: false, // also covers /service-history, a sub-page of this feature
};
