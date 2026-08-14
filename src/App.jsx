import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import HomePage from './components/home/HomePage';
import TrailFinder from './components/trailfinder/TrailFinder';
import TrailsList from './components/TrailsList';
import RideCalendarPage from './components/calendar/RideCalendarPage';
import MyTrailsPage from './pages/MyTrailsPage';
import MyBikePage from './pages/MyBikePage';
import ServiceHistoryPage from './pages/ServiceHistoryPage';
import JoinLandingPage from './pages/JoinLandingPage';
import JoinSurveyPage from './pages/JoinSurveyPage';
import CommunityGuidelinesPage from './pages/CommunityGuidelinesPage';
import AppOnlyFeature from './components/appPreview/AppOnlyFeature';
import { appPreviews } from './data/appPreviews';
import { WEB_LIVE_FEATURES } from './config/featureFlags';
import { useAuth } from './hooks/useAuth';
import { migrateLocalStorageToFirestore } from './utils/migrate';

export default function App() {
  const { user } = useAuth();

  // One-time migration: move any MTB dashboard localStorage data into Firestore
  useEffect(() => {
    if (user) {
      migrateLocalStorageToFirestore(user);
    }
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Routes>
      {/* Onboarding flow — standalone, no app sidebar/nav to distract a
          brand-new rider mid-survey. */}
      <Route path="/join" element={<JoinLandingPage />} />
      <Route path="/join/survey" element={<JoinSurveyPage />} />
      <Route path="/community-guidelines" element={<CommunityGuidelinesPage />} />

      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/trail-finder" element={<TrailFinder />} />
        <Route path="/trails" element={<TrailsList />} />

        {/* Web-live switches — flip a flag in src/config/featureFlags.js to
            restore the live component. Real implementations stay untouched
            below, just not routed to while their flag is off. */}
        <Route
          path="/calendar"
          element={WEB_LIVE_FEATURES.rideCalendar ? <RideCalendarPage /> : <AppOnlyFeature {...appPreviews.rideCalendar} />}
        />
        <Route
          path="/my-trails"
          element={WEB_LIVE_FEATURES.myTrails ? <MyTrailsPage /> : <AppOnlyFeature {...appPreviews.myTrails} />}
        />
        <Route
          path="/my-bike"
          element={WEB_LIVE_FEATURES.serviceDashboard ? <MyBikePage /> : <AppOnlyFeature {...appPreviews.serviceDashboard} />}
        />
        <Route
          path="/service-history"
          element={WEB_LIVE_FEATURES.serviceDashboard ? <ServiceHistoryPage /> : <AppOnlyFeature {...appPreviews.serviceDashboard} />}
        />
        <Route path="/find-my-bike" element={<AppOnlyFeature {...appPreviews.findMyBike} />} />
      </Route>
    </Routes>
  );
}
