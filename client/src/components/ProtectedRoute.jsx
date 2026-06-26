import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { admin, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-t-2 border-white animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-r-2 border-white/30 animate-pulse-slow"></div>
        </div>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default ProtectedRoute;
