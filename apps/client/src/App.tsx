import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { Register } from './pages/Register';
import { Login } from './pages/Login';
import styles from './App.module.scss';

function Dashboard() {
  return (
    <main className={styles.page}>
      <div>
        <h1 className={styles.title}>Task Management</h1>
        <p className={styles.subtitle}>React client is running.</p>
      </div>
    </main>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
