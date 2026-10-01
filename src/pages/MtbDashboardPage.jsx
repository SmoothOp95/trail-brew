import { useAuth } from '../hooks/useAuth';
import SignInButton from '../components/auth/SignInButton';
import MtbDashboard from '../mtb/screens/MtbDashboard';

/**
 * Host bridge for the MTB Setup Dashboard (src/mtb, TypeScript). Passes the Firebase user and the sign-in
 * button in, so the module never imports host JS directly.
 */
export default function MtbDashboardPage() {
  const { user } = useAuth();
  return <MtbDashboard user={user} SignIn={SignInButton} />;
}
