import React, { useContext } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, FolderOpen, Film, Settings } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const AdminNavbar = () => {
  const { admin, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  if (!admin) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 border-b border-white/5 py-4 px-6 md:px-12 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Title branding */}
        <Link
          to="/admin"
          className="flex items-center font-sans text-xs tracking-[0.25em] font-extrabold uppercase text-white hover:text-neutral-300 transition-colors select-none"
          id="admin-nav-logo"
        >
          <span>RJ.TwoShot</span>
          <span className="ml-2 bg-white/10 text-neutral-300 border border-white/5 px-2 py-0.5 rounded text-[8px] tracking-wider uppercase font-bold">
            Portal
          </span>
        </Link>

        {/* Dashboard links */}
        <div className="flex items-center space-x-6 md:space-x-8">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `flex items-center space-x-1.5 text-[10px] uppercase tracking-wider font-semibold transition-colors duration-300 ${
                isActive ? 'text-white font-bold' : 'text-neutral-400 hover:text-white'
              }`
            }
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </NavLink>

          <NavLink
            to="/admin/categories"
            className={({ isActive }) =>
              `flex items-center space-x-1.5 text-[10px] uppercase tracking-wider font-semibold transition-colors duration-300 ${
                isActive ? 'text-white font-bold' : 'text-neutral-400 hover:text-white'
              }`
            }
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Categories</span>
          </NavLink>

          <NavLink
            to="/admin/videos"
            className={({ isActive }) =>
              `flex items-center space-x-1.5 text-[10px] uppercase tracking-wider font-semibold transition-colors duration-300 ${
                isActive ? 'text-white font-bold' : 'text-neutral-400 hover:text-white'
              }`
            }
          >
            <Film className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Videos</span>
          </NavLink>

          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              `flex items-center space-x-1.5 text-[10px] uppercase tracking-wider font-semibold transition-colors duration-300 ${
                isActive ? 'text-white font-bold' : 'text-neutral-400 hover:text-white'
              }`
            }
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </NavLink>

          <Link
            to="/"
            className="text-[10px] text-neutral-400 hover:text-white border border-white/10 hover:border-white/20 rounded-full px-3 py-1 transition-all uppercase tracking-wider font-semibold"
          >
            View Site
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 text-[10px] uppercase tracking-wider font-semibold text-red-400 hover:text-red-300 transition-colors"
            id="admin-logout-btn"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
