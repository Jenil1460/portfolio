import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';

const Logo = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const chars = containerRef.current.querySelectorAll('.char');
    gsap.fromTo(chars, 
      { opacity: 0, y: 8, filter: 'blur(3px)' },
      { 
        opacity: 1, 
        y: 0, 
        filter: 'blur(0px)',
        duration: 0.8, 
        stagger: 0.04, 
        ease: 'power3.out',
        delay: 0.1
      }
    );
    gsap.fromTo(containerRef.current,
      { scale: 0.97 },
      { scale: 1, duration: 1.0, ease: 'power3.out' }
    );
  }, []);

  const text = "RJ.TwoShot";

  return (
    <div className="flex justify-center items-center py-10 select-none">
      <Link 
        to="/"
        ref={containerRef}
        className="font-sans text-xs md:text-sm tracking-[0.35em] font-extrabold uppercase text-white flex items-center justify-center hover:text-white"
        id="homepage-logo"
      >
        {text.split('').map((char, index) => (
          <span 
            key={index} 
            className="char inline-block transition-all duration-300 hover:scale-110 hover:text-neutral-400"
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </Link>
    </div>
  );
};

export default Logo;
