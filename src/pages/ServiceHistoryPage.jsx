import { Navigate } from 'react-router-dom';

// Service history is now part of the unified Service Dashboard at /my-bike
export default function ServiceHistoryPage() {
  return <Navigate to="/my-bike" replace />;
}
