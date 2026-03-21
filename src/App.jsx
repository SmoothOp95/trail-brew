import { Routes, Route } from 'react-router-dom';
import HomePage from './components/home/HomePage';
import TrailFinder from './components/trailfinder/TrailFinder';
import TrailsList from './components/TrailsList';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/trail-finder" element={<TrailFinder />} />
      <Route path="/trails" element={<TrailsList />} />
    </Routes>
  );
}
