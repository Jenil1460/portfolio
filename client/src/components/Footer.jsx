import React, { useContext } from 'react';
import { SettingsContext } from '../context/SettingsContext';

const Footer = () => {
  const { settings } = useContext(SettingsContext);

  return (
    <footer className="bg-[#0A0A0A] border-t border-white/5 py-12 text-neutral-500 font-sans text-xs select-none">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Brand name and Copyright */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
          <span className="font-extrabold uppercase tracking-[0.25em] text-white">
            RJ.TwoShot
          </span>
          <span className="hidden sm:inline text-neutral-800">|</span>
          <p className="font-light text-neutral-600">
            &copy; 2026 RJ.TwoShot. All rights reserved.
          </p>
        </div>

        {/* Social connections and Admin Portal link */}
        <div className="flex flex-wrap items-center justify-center gap-6 font-medium text-neutral-400 uppercase tracking-widest text-[9px]">
          {settings.socialLinks?.instagram && (
            <a
              href={settings.socialLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Instagram
            </a>
          )}
          {settings.socialLinks?.youtube && (
            <a
              href={settings.socialLinks.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              YouTube
            </a>
          )}
          <a
            href="https://behance.net"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
            id="behance-link"
          >
            Behance
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
