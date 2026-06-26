import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const AdminNavbar = () => {
  const { admin, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  if (!admin) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 border-b border-white/5 py-4 px-4 md:px-12 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-4 w-full">
        {/* Title branding */}
        <div className="flex items-center font-sans text-xs sm:text-xs tracking-[0.2em] sm:tracking-[0.25em] font-extrabold uppercase text-white select-none truncate">
          <span>RJ.TwoShot Admin</span>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center space-x-1.5 text-[11px] sm:text-[10px] uppercase tracking-wider font-bold sm:font-semibold text-red-400 hover:text-red-300 transition-colors cursor-pointer min-h-[44px] px-3.5 border border-red-500/10 rounded-lg bg-red-950/10 flex-shrink-0"
          id="admin-logout-btn"
        >
          <LogOut className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </nav>
  );
};

export default AdminNavbar;
