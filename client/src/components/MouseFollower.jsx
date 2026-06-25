import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const MouseFollower = () => {
  const followerRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    // Only mount custom cursor on desktop devices with fine pointers
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    const follower = followerRef.current;
    const ring = ringRef.current;

    if (!follower || !ring) return;

    // Set initial offscreen positions
    gsap.set(follower, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
    gsap.set(ring, { x: window.innerWidth / 2, y: window.innerHeight / 2 });

    const moveCursor = (e) => {
      gsap.to(follower, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.1,
        ease: 'power3.out',
      });
      gsap.to(ring, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.4,
        ease: 'power3.out',
      });
    };

    const handleHoverStart = (e) => {
      const target = e.target;
      const isInteractive = 
        target.tagName === 'A' || 
        target.tagName === 'BUTTON' || 
        target.closest('a') || 
        target.closest('button') || 
        target.closest('.clickable') ||
        target.classList.contains('interactive');

      if (isInteractive) {
        gsap.to(ring, {
          scale: 1.5,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderColor: 'rgba(255, 255, 255, 0.8)',
          duration: 0.2,
        });
        gsap.to(follower, {
          scale: 1.8,
          backgroundColor: '#ffffff',
          duration: 0.2,
        });
      }
    };

    const handleHoverEnd = (e) => {
      const target = e.target;
      const isInteractive = 
        target.tagName === 'A' || 
        target.tagName === 'BUTTON' || 
        target.closest('a') || 
        target.closest('button') || 
        target.closest('.clickable') ||
        target.classList.contains('interactive');

      if (isInteractive) {
        gsap.to(ring, {
          scale: 1.0,
          backgroundColor: 'transparent',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          duration: 0.2,
        });
        gsap.to(follower, {
          scale: 1.0,
          backgroundColor: '#ffffff',
          duration: 0.2,
        });
      }
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleHoverStart);
    window.addEventListener('mouseout', handleHoverEnd);

    // Apply layout-wide body class to disable default browser cursor on desktop
    document.body.classList.add('custom-cursor-area');

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleHoverStart);
      window.removeEventListener('mouseout', handleHoverEnd);
      document.body.classList.remove('custom-cursor-area');
    };
  }, []);

  return (
    <>
      <div ref={followerRef} className="mouse-follower hidden lg:block" />
      <div ref={ringRef} className="mouse-follower-ring hidden lg:block" />
    </>
  );
};

export default MouseFollower;
