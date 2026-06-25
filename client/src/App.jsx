import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import AdminNavbar from './components/AdminNavbar';
import MouseFollower from './components/MouseFollower';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import Home from './pages/Home';
import VideoPlayerPage from './pages/VideoPlayerPage';

// Admin pages
import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import CategoryManager from './pages/admin/CategoryManager';
import VideoManager from './pages/admin/VideoManager';
import SettingsManager from './pages/admin/SettingsManager';

// Providers
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { AuthContext } from './context/AuthContext';

const AppContent = () => {
  const location = useLocation();
  const { admin } = useContext(AuthContext);
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen justify-between bg-black text-white">
      <MouseFollower />
      {isAdminPath && admin && <AdminNavbar />}
      
      <main className="flex-grow">
        <Routes>
          {/* Public Views */}
          <Route path="/" element={<Home />} />
          <Route path="/video/:id" element={<VideoPlayerPage />} />
          
          {/* Admin Login Gate */}
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* Secured Portals */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute>
                <CategoryManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/videos"
            element={
              <ProtectedRoute>
                <VideoManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <SettingsManager />
              </ProtectedRoute>
            }
          />

          {/* 404 Route */}
          <Route
            path="*"
            element={
              <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-6">
                <div className="text-center space-y-2">
                  <h1 className="text-6xl md:text-8xl font-display font-extrabold text-white">404</h1>
                  <p className="text-xs uppercase tracking-widest text-neutral-500 font-medium">Frame Not Found</p>
                </div>
                <p className="text-neutral-400 text-sm font-light max-w-xs text-center leading-relaxed">
                  The cinematic portfolio piece or page you seek is offline or moved.
                </p>
                <Link
                  to="/"
                  className="bg-white text-black text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-full hover:bg-neutral-200 transition-colors"
                >
                  Return to Home
                </Link>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
