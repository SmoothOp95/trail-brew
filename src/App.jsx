import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import HomePage from './components/home/HomePage';
import TrailFinder from './components/trailfinder/TrailFinder';
import TrailsList from './components/TrailsList';
import MyTrailsPage from './pages/MyTrailsPage';
import MyBikePage from './pages/MyBikePage';
import ServiceHistoryPage from './pages/ServiceHistoryPage';
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
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/trail-finder" element={<TrailFinder />} />
        <Route path="/trails" element={<TrailsList />} />
        <Route path="/my-trails" element={<MyTrailsPage />} />
        <Route path="/my-bike" element={<MyBikePage />} />
        <Route path="/service-history" element={<ServiceHistoryPage />} />
      </Route>
    </Routes>
  );
}
