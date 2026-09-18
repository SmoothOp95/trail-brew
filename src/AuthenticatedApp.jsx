import { AuthProvider } from './hooks/useAuth';
import App from './App';

export default function AuthenticatedApp() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
