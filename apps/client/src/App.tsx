import { AuthProvider } from './auth/AuthContext';
import { AppRouter } from './router/AppRouter';
import { useTheme } from './theme/useTheme';

function AppContent() {
  useTheme();

  return <AppRouter />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
