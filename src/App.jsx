import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import HomePage from './components/home/HomePage';
import TrailFinder from './components/trailfinder/TrailFinder';
import TrailsList from './components/TrailsList';
import MyTrailsPage from './pages/MyTrailsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/trail-finder" element={<TrailFinder />} />
        <Route path="/trails" element={<TrailsList />} />
        <Route path="/my-trails" element={<MyTrailsPage />} />
      </Route>
    </Routes>
  );
}
