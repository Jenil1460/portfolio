import React, { useState, useEffect, useContext } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { SettingsContext } from '../context/SettingsContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { settings } = useContext(SettingsContext);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled || isOpen || isAdminRoute
          ? 'bg-black/95 py-4 border-b border-white/5 shadow-2xl'
          : 'bg-transparent py-7 border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        
        {/* Animated Brand Logo (RJ • TwoShot) */}
        <Link
          to="/"
          className="flex items-center font-sans text-xs tracking-[0.25em] font-extrabold uppercase text-white group select-none"
          id="navbar-logo"
        >
          <span>RJ</span>
          <span className="w-1.5 h-1.5 bg-white rounded-full mx-1 group-hover:scale-[1.8] group-hover:bg-white transition-all duration-500 ease-out"></span>
          <span className="tracking-[0.15em] font-light text-neutral-400 group-hover:text-white transition-colors duration-500">TwoShot</span>
        </Link>

        {/* Desktop Links (Minimal, Awwwards style) */}
        <div className="hidden md:flex items-center space-x-10">
          <NavLink
            to="/work"
            className={({ isActive }) =>
              `text-[10px] uppercase tracking-[0.25em] font-medium py-1 transition-colors duration-300 relative ${
                isActive ? 'text-white font-semibold' : 'text-neutral-400 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span>Work</span>
                <span className={`absolute bottom-0 left-0 w-full h-[1px] bg-white transition-transform duration-300 origin-left ${
                  isActive ? 'scale-x-100' : 'scale-x-0'
                }`}></span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/about"
            className={({ isActive }) =>
              `text-[10px] uppercase tracking-[0.25em] font-medium py-1 transition-colors duration-300 relative ${
                isActive ? 'text-white font-semibold' : 'text-neutral-400 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span>About</span>
                <span className={`absolute bottom-0 left-0 w-full h-[1px] bg-white transition-transform duration-300 origin-left ${
                  isActive ? 'scale-x-100' : 'scale-x-0'
                }`}></span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `text-[10px] uppercase tracking-[0.25em] font-medium py-1 transition-colors duration-300 relative ${
                isActive ? 'text-white font-semibold' : 'text-neutral-400 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span>Contact</span>
                <span className={`absolute bottom-0 left-0 w-full h-[1px] bg-white transition-transform duration-300 origin-left ${
                  isActive ? 'scale-x-100' : 'scale-x-0'
                }`}></span>
              </>
            )}
          </NavLink>

          {/* Social connection (Instagram) */}
          {settings.socialLinks?.instagram && (
            <a
              href={settings.socialLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] uppercase tracking-[0.25em] font-medium text-neutral-400 hover:text-white transition-colors py-1 relative"
            >
              <span>Instagram</span>
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white scale-x-0 transition-transform duration-300 origin-left hover:scale-x-100"></span>
            </a>
          )}


        </div>

        {/* Mobile Hamburger Trigger */}
        <div className="flex md:hidden items-center space-x-4">

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-white p-1 hover:text-neutral-400 transition-colors focus:outline-none"
            id="mobile-menu-trigger"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="md:hidden fixed inset-x-0 top-[53px] bottom-0 bg-black z-40 flex flex-col justify-between p-8 border-t border-white/5 animate-fade-in">
          <div className="flex flex-col space-y-6 pt-10">
            <Link
              to="/work"
              className="text-sm font-sans uppercase tracking-[0.2em] text-neutral-400 hover:text-white transition-colors"
            >
              Work
            </Link>
            <Link
              to="/about"
              className="text-sm font-sans uppercase tracking-[0.2em] text-neutral-400 hover:text-white transition-colors"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="text-sm font-sans uppercase tracking-[0.2em] text-neutral-400 hover:text-white transition-colors"
            >
              Contact
            </Link>
            {settings.socialLinks?.instagram && (
              <a
                href={settings.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-sans uppercase tracking-[0.2em] text-neutral-400 hover:text-white transition-colors"
              >
                Instagram
              </a>
            )}
          </div>


        </div>
      )}
    </nav>
  );
};

export default Navbar;
