import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { LoadingSpinner } from './components/common/LoadingSpinner';

const Login = lazy(() =>
  import('./pages/Login').then((m) => ({ default: m.Login }))
);
const Signup = lazy(() =>
  import('./pages/Signup').then((m) => ({ default: m.Signup }))
);
const Dashboard = lazy(() =>
  import('./pages/Dashboard').then((m) => ({ default: m.Dashboard }))
);
const CareCircle = lazy(() =>
  import('./pages/CareCircle').then((m) => ({ default: m.CareCircle }))
);
const JoinCircle = lazy(() =>
  import('./pages/JoinCircle').then((m) => ({ default: m.JoinCircle }))
);
const NotFound = lazy(() =>
  import('./pages/NotFound').then((m) => ({ default: m.NotFound }))
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Starting SilverSync..." />;
  }

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navbar />
      <div id="main-content">
        <Suspense fallback={<LoadingSpinner message="Loading view..." />}>
          <Routes>
            <Route
              path="/"
              element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
            />
            <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
            <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/circle"
              element={
                <ProtectedRoute>
                  <CareCircle />
                </ProtectedRoute>
              }
            />
            <Route
              path="/join"
              element={
                <ProtectedRoute>
                  <JoinCircle />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
    </>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
