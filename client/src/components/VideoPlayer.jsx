import React, {
  useState, useEffect, useRef, memo, useCallback,
} from 'react';
import {
  AlertCircle, Loader2, ExternalLink, Instagram, RefreshCw,
} from 'lucide-react';
import API, { resolveMediaUrl, resolveDriveVideoUrl } from '../services/api';

// ─────────────────────────────────────────────────────────────────────────────────
// URL → source descriptor
// ─────────────────────────────────────────────────────────────────────────────────
const parseVideoSource = (url) => {
  if (!url) return { type: 'unknown' };
  const u = url.trim();
  const driveMatch = u.match(/\/file\/d\/([^/?#&]+)/) || u.match(/[?&]id=([^&]+)/);
  if (driveMatch && (u.includes('drive.google.com') || u.includes('docs.google.com'))) {
    const fileId = driveMatch[1];
    return {
      type: 'drive', fileId,
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      viewUrl: `https://drive.google.com/file/d/${fileId}/view`,
    };
  }
  if (u.includes('youtube.com') || u.includes('youtu.be')) {
    let id = '';
    if (u.includes('youtu.be/')) id = u.split('youtu.be/')[1]?.split(/[?#]/)[0];
    else if (u.includes('embed/')) id = u.split('embed/')[1]?.split(/[?#]/)[0];
    else if (u.includes('/shorts/')) id = u.split('/shorts/')[1]?.split(/[?#]/)[0];
    else { const m = u.match(/[?&]v=([^&]+)/); if (m) id = m[1]; }
    return {
      type: 'youtube', videoId: id,
      embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1&modestbranding=1`,
    };
  }
  const vimeoM = u.match(/(?:video\/|vimeo\.com\/|vimeo\.com\/showcase\/\d+\/video\/)(\d+)/);
  if (vimeoM) {
    return {
      type: 'vimeo', videoId: vimeoM[1],
      embedUrl: `https://player.vimeo.com/video/${vimeoM[1]}?autoplay=1&playsinline=1`,
    };
  }
  if (u.includes('instagram.com')) {
    const m = u.match(/instagram\.com\/(?:p|reel|tv)\/([^/?#&]+)/);
    return { type: 'instagram', code: m?.[1] ?? '', url: u };
  }
  return { type: 'direct', src: u };
};

// ─────────────────────────────────────────────────────────────────────────────────
// Container layout
// ─────────────────────────────────────────────────────────────────────────────────
const getLayoutStyles = (ar) => {
  const base = 'relative rounded-2xl overflow-hidden border border-white/5 shadow-2xl bg-black';
  if (!ar) return { outerClass: base + ' w-full aspect-video', outerStyle: {} };
  if (ar < 0.95) return { outerClass: base + ' mx-auto w-full', outerStyle: { aspectRatio: String(ar), maxWidth: '360px' } };
  if (ar <= 1.05) return { outerClass: base + ' mx-auto w-full', outerStyle: { aspectRatio: '1', maxWidth: '480px' } };
  return { outerClass: base + ' w-full', outerStyle: { aspectRatio: String(ar) } };
};

// ─────────────────────────────────────────────────────────────────────────────────
// Hook: image aspect ratio
// ─────────────────────────────────────────────────────────────────────────────────
const useThumbnailRatio = (src) => {
  const [ratio, setRatio] = useState(null);
  useEffect(() => {
    if (!src) { setRatio(16 / 9); return; }
    let alive = true;
    const img = new Image();
    img.src = src;
    img.onload = () => { if (alive && img.naturalWidth) setRatio(img.naturalWidth / img.naturalHeight); };
    img.onerror = () => { if (alive) setRatio(16 / 9); };
    return () => { alive = false; };
  }, [src]);
  return ratio;
};

// ─────────────────────────────────────────────────────────────────────────────────
// Inline SVG icons
// ─────────────────────────────────────────────────────────────────────────────────
const IconPlay = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <polygon points="5,3 19,12 5,21" />
  </svg>
);
const IconPause = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);
const IconVolumeFull = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z"/>
  </svg>
);
const IconVolumeMute = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-3-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/>
  </svg>
);
const IconFullscreen = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
  </svg>
);
const IconExitFullscreen = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
  </svg>
);
const IconDots = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <circle cx="12" cy="5" r="2"/>
    <circle cx="12" cy="12" r="2"/>
    <circle cx="12" cy="19" r="2"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────────
// IframePlayer — YouTube / Vimeo / Google Drive embed fallback
//
// For Google Drive /preview iframes the native UI has:
//   • ~60 px header bar at the top  (Open in Drive, etc.)
//   • ~60 px control bar at bottom  (volume, settings, fullscreen)
//
// We hide both by pushing the iframe up by CLIP_TOP px and making it taller by
// (CLIP_TOP + CLIP_BOT) px.  The outer container already has overflow:hidden
// from getLayoutStyles, so anything outside the bounding box is invisible.
//
// The Google Drive center play-button overlay is part of the video frame itself
// and cannot be hidden without blocking user interaction, so we leave it. It
// disappears automatically once playback starts.
// ─────────────────────────────────────────────────────────────────────────────────
const DRIVE_CLIP_TOP = 60;   // px to crop from the Drive top bar
const DRIVE_CLIP_BOT = 0;    // set to 0 because controls auto-hide and clipping crops the video

const IframePlayer = memo(({ embedUrl, poster, initialRatio }) => {
  const imgRatio = useThumbnailRatio(poster);
  const [loaded, setLoaded] = useState(false);
  const activeRatio = initialRatio || imgRatio || 16 / 9;
  const { outerClass, outerStyle } = getLayoutStyles(activeRatio);
  const isDrive = embedUrl.includes('drive.google.com');
  useEffect(() => { setLoaded(false); }, [embedUrl]);

  return (
    <div className={outerClass} style={outerStyle}>
      {/* Blurred ambient backdrop */}
      {poster && (
        <div className="absolute inset-0 z-0 bg-cover bg-center blur-2xl scale-110 opacity-20 pointer-events-none"
             style={{ backgroundImage: `url(${poster})` }} />
      )}

      {/* Loading overlay */}
      {!loaded && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 space-y-3">
          <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
          <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">Loading...</span>
        </div>
      )}

      {/* Iframe — Drive gets CSS-clipped; YouTube/Vimeo get full coverage */}
      <iframe
        src={embedUrl}
        title="Video Player"
        className="absolute border-0 z-10"
        style={{
          opacity: loaded ? 1 : 0,
          transition: 'opacity .4s',
          ...(isDrive
            ? {
                left: 0,
                width: '100%',
                top: `-${DRIVE_CLIP_TOP}px`,
                height: `calc(100% + ${DRIVE_CLIP_TOP + DRIVE_CLIP_BOT}px)`,
              }
            : {
                inset: 0,
                width: '100%',
                height: '100%',
              }),
        }}
        onLoad={() => setLoaded(true)}
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        allowFullScreen
      />

    </div>
  );
});
IframePlayer.displayName = 'IframePlayer';



// ─────────────────────────────────────────────────────────────────────────────────
// InstagramPlayer — redirect card
// ─────────────────────────────────────────────────────────────────────────────────
const InstagramPlayer = memo(({ source, poster }) => {
  const imgRatio = useThumbnailRatio(poster);
  const activeRatio = imgRatio || 9 / 16;
  const { outerClass, outerStyle } = getLayoutStyles(activeRatio);
  return (
    <div className={outerClass} style={outerStyle}>
      {poster && (
        <div className="absolute inset-0 z-0 bg-cover bg-center blur-2xl brightness-[0.15] scale-105 pointer-events-none"
             style={{ backgroundImage: `url(${poster})` }} />
      )}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 space-y-5 text-center bg-black/80">
        <div className="bg-gradient-to-tr from-[#FFB900] via-[#E1306C] to-[#C13584] p-5 rounded-full shadow-2xl animate-pulse">
          <Instagram className="w-8 h-8 text-white" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xs uppercase tracking-wider font-extrabold text-white">Instagram Reel</h3>
          <p className="text-[10px] text-neutral-400 max-w-[240px] leading-relaxed">
            This video is hosted on Instagram. Open it in the app for the best experience.
          </p>
        </div>
        <button onClick={() => window.open(source.url, '_blank', 'noopener,noreferrer')}
          className="inline-flex items-center space-x-2 text-[10px] uppercase tracking-[0.2em] bg-white hover:bg-neutral-100 text-black px-6 py-3 rounded-full font-bold transition-all active:scale-95 shadow-md">
          <span>Open in Instagram</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
});
InstagramPlayer.displayName = 'InstagramPlayer';

// ─────────────────────────────────────────────────────────────────────────────────
// HTML5Player — YouTube-style custom control bar
// ─────────────────────────────────────────────────────────────────────────────────
const SPEEDS = [0.25, 0.5, 1, 1.25, 1.5, 2];

const HTML5Player = memo(({ src, poster, onEnded, initialRatio, onError }) => {
  const [videoRatio, setVideoRatio] = useState(initialRatio || null);
  const [metaLoaded, setMetaLoaded] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ctrlVisible, setCtrlVisible] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showVolSlider, setShowVolSlider] = useState(false);

  const videoRef     = useRef(null);
  const containerRef = useRef(null);
  const hideTimer    = useRef(null);
  const volTimer     = useRef(null);

  const imgRatio    = useThumbnailRatio(poster);
  const activeRatio = videoRatio || initialRatio || imgRatio || 16 / 9;
  const { outerClass, outerStyle } = getLayoutStyles(activeRatio);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const fmt = (s) => {
    if (!isFinite(s) || s < 0) return '0:00';
    const h   = Math.floor(s / 3600);
    const m   = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return h > 0
      ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
      : `${m}:${String(sec).padStart(2,'0')}`;
  };

  const toggleControls = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCtrlVisible(v => {
      const next = !v;
      if (!next) {
        setShowSpeedMenu(false);
        setShowMoreMenu(false);
        setShowVolSlider(false);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    setMetaLoaded(false); setCanPlay(false); setBuffering(false);
    setPlaying(false); setCurrentTime(0); setDuration(0);
    setError(null); setSpeed(1); setCtrlVisible(true);
    return () => {
      if (videoRef.current) { videoRef.current.pause(); videoRef.current.src = ''; videoRef.current.load(); }
      clearTimeout(volTimer.current);
    };
  }, [src, retryKey]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleMeta = useCallback((e) => {
    const { videoWidth: w, videoHeight: h, duration: d } = e.currentTarget;
    if (w && h) setVideoRatio(w / h);
    if (isFinite(d)) setDuration(d);
    setMetaLoaded(true);
  }, []);

  const handleDurationChange = useCallback((e) => {
    const d = e.currentTarget.duration;
    if (isFinite(d)) setDuration(d);
  }, []);

  const handleCanPlay = useCallback(() => {
    setBuffering(false);
    if (!canPlay) {
      const tryPlay = (m) => {
        if (!videoRef.current) return;
        videoRef.current.muted = m;
        videoRef.current.play()
          .then(() => { setCanPlay(true); setPlaying(true); })
          .catch(() => { if (!m) tryPlay(true); else setCanPlay(true); });
      };
      tryPlay(false);
    }
  }, [canPlay]);

  const handleWaiting    = useCallback(() => setBuffering(true), []);
  const handlePlaying    = useCallback(() => { setBuffering(false); setCanPlay(true); setPlaying(true); }, []);
  const handlePause      = useCallback(() => { setPlaying(false); }, []);
  const handleEnded      = useCallback(() => { setPlaying(false); onEnded?.(); }, [onEnded]);
  const handleTimeUpdate = useCallback((e) => { if (!seeking) setCurrentTime(e.currentTarget.currentTime); }, [seeking]);
  const handleError      = useCallback((e) => {
    const me = e.currentTarget?.error;
    if (me?.code === 1) return;
    if (onError) onError(me); else setError('Could not load video.');
    setBuffering(false);
  }, [onError]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current; if (!v) return;
    v.paused ? v.play().catch(() => {}) : v.pause();
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current; if (!v) return;
    v.muted = !v.muted; setMuted(v.muted);
  }, []);

  const handleVolumeChange = useCallback((e) => {
    const val = Number(e.target.value);
    const v = videoRef.current; if (!v) return;
    v.volume = val; v.muted = val === 0;
    setVolume(val); setMuted(val === 0);
  }, []);

  const handleSeekStart  = useCallback(() => setSeeking(true), []);
  const handleSeekChange = useCallback((e) => {
    const t = Number(e.target.value); setCurrentTime(t);
    if (videoRef.current) videoRef.current.currentTime = t;
  }, []);
  const handleSeekEnd    = useCallback(() => setSeeking(false), []);

  const applySpeed = useCallback((s) => {
    if (videoRef.current) videoRef.current.playbackRate = s;
    setSpeed(s); setShowSpeedMenu(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current; if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
  }, []);

  const togglePip = useCallback(async () => {
    const v = videoRef.current; if (!v) return;
    try {
      document.pictureInPictureElement
        ? await document.exitPictureInPicture()
        : await v.requestPictureInPicture?.();
    } catch { /* PiP not supported */ }
    setShowMoreMenu(false);
  }, []);

  return (
    <div ref={containerRef} className={`${outerClass} select-none`} style={outerStyle}>

      {/* Ambient backdrop */}
      {poster && (
        <div className="absolute inset-0 z-0 bg-cover bg-center blur-2xl scale-110 opacity-25 pointer-events-none"
             style={{ backgroundImage: `url(${poster})` }} />
      )}

      {/* Poster while loading */}
      {poster && !canPlay && !error && (
        <div className="absolute inset-0 z-5 bg-cover bg-center brightness-50 pointer-events-none"
             style={{ backgroundImage: `url(${poster})` }} />
      )}

      {/* Loading spinner */}
      {!canPlay && !error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center space-y-3 pointer-events-none">
          <Loader2 className="w-9 h-9 text-white animate-spin" />
          <span className="text-[11px] uppercase tracking-widest text-neutral-300 font-semibold">
            {metaLoaded ? 'Buffering...' : 'Loading...'}
          </span>
        </div>
      )}

      {/* Mid-playback buffering */}
      {canPlay && buffering && !error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <Loader2 className="w-9 h-9 text-white/80 animate-spin" />
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 space-y-4 px-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-sm text-neutral-300">{error}</p>
          <button onClick={() => setRetryKey(k => k + 1)}
            className="flex items-center space-x-2 px-5 py-2 text-[11px] uppercase tracking-wider bg-white text-black rounded-full font-bold hover:bg-neutral-200 transition-all active:scale-95">
            <RefreshCw className="w-3.5 h-3.5" /><span>Retry</span>
          </button>
        </div>
      )}

      {/* Video element — NO controls attribute */}
      {!error && (
        <video
          key={`${src}-${retryKey}`}
          ref={videoRef}
          src={src}
          poster={poster}
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full z-10"
          style={{ opacity: canPlay ? 1 : 0, transition: 'opacity .5s', objectFit: 'contain' }}
          onLoadedMetadata={handleMeta}
          onDurationChange={handleDurationChange}
          onCanPlay={handleCanPlay}
          onWaiting={handleWaiting}
          onPlaying={handlePlaying}
          onPause={handlePause}
          onTimeUpdate={handleTimeUpdate}
          onError={handleError}
          onEnded={handleEnded}
          webkit-playsinline="true"
          x-webkit-airplay="allow"
        />
      )}

      {/* Invisible overlay to intercept taps and prevent native video tap-to-pause */}
      {canPlay && !error && (
        <button 
          type="button"
          aria-label="Toggle controls"
          className="absolute inset-0 z-25 w-full h-full cursor-pointer bg-black/0 border-none appearance-none outline-none" 
          onClick={toggleControls}
          onTouchEnd={(e) => {
            e.preventDefault(); // prevent ghost clicks
            toggleControls(e);
          }}
        />
      )}

      {/* Bottom control bar — ONLY at the bottom, never in the middle */}
      {canPlay && !error && (
        <div
          className="absolute bottom-0 left-0 right-0 z-30"
          style={{ opacity: ctrlVisible ? 1 : 0, transition: 'opacity .25s', pointerEvents: ctrlVisible ? 'auto' : 'none' }}
          onClick={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
        >
          {/* Gradient scrim */}
          <div className="absolute inset-0 pointer-events-none"
               style={{ background: 'linear-gradient(to top, rgba(0,0,0,.85) 0%, rgba(0,0,0,.3) 55%, transparent 100%)' }} />

          <div className="relative px-2 pb-2 pt-10 flex items-center gap-1">

            {/* Play / Pause (44px touch target) */}
            <button onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}
              className="text-white hover:text-white/75 transition-colors shrink-0 w-11 h-11 flex items-center justify-center">
              {playing ? <IconPause /> : <IconPlay />}
            </button>

            {/* Time */}
            <span className="text-white text-[11px] font-mono shrink-0 tabular-nums">
              {fmt(currentTime)}<span className="text-white/40"> / {fmt(duration)}</span>
            </span>

            {/* Scrubber (Timeline) */}
            <div className="relative flex-1 h-5 flex items-center group/seek">
              <div className="absolute inset-x-0 h-[3px] rounded-full bg-white/25" />
              <div className="absolute left-0 h-[3px] rounded-full bg-white pointer-events-none"
                   style={{ width: `${progress}%` }} />
              <div className="absolute w-3 h-3 rounded-full bg-white shadow pointer-events-none opacity-0 group-hover/seek:opacity-100 transition-opacity -translate-x-1/2 -translate-y-px"
                   style={{ left: `${progress}%` }} />
              <input type="range" min={0} max={duration || 100} step={0.05} value={currentTime}
                onMouseDown={handleSeekStart} onTouchStart={handleSeekStart}
                onChange={handleSeekChange} onMouseUp={handleSeekEnd} onTouchEnd={handleSeekEnd}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{ touchAction: 'none' }} />
            </div>

            {/* Fullscreen (44px touch target) */}
            <button onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              className="text-white hover:text-white/75 transition-colors shrink-0 w-11 h-11 flex items-center justify-center">
              {isFullscreen ? <IconExitFullscreen /> : <IconFullscreen />}
            </button>

            {/* Three-dot more menu (44px touch target) */}
            <div className="relative shrink-0 flex items-center">
              <button onClick={() => setShowMoreMenu(p => !p)}
                aria-label="More options" className="text-white hover:text-white/75 transition-colors shrink-0 w-11 h-11 flex items-center justify-center">
                <IconDots />
              </button>
              {showMoreMenu && (
                <div className="absolute bottom-12 right-0 bg-neutral-950/95 border border-white/10 rounded-xl py-2 w-48 shadow-2xl z-50 flex flex-col gap-1 text-[11px] text-neutral-300">
                  
                  {/* Picture-in-Picture */}
                  <button onClick={togglePip}
                    className="w-full px-3 py-1.5 hover:bg-white/10 flex items-center gap-2.5 text-white transition-colors text-left">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 1.98 2 1.98h18c1.1 0 2-.88 2-1.98V5c0-1.1-.9-2-2-2zm0 16.01H3V4.98h18v14.03z"/>
                    </svg>
                    <span>Picture-in-Picture</span>
                  </button>

                  <div className="h-px bg-white/10 my-1" />

                  {/* Playback speed inside More Menu */}
                  <div className="px-3 py-1 text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                    Playback Speed
                  </div>
                  {SPEEDS.map(s => (
                    <button key={s} onClick={() => { applySpeed(s); setShowMoreMenu(false); }}
                      className={`w-full px-3 py-1 flex items-center justify-between hover:bg-white/10 transition-colors ${speed === s ? 'text-white font-bold' : 'text-neutral-400'}`}>
                      <span>{s === 1 ? 'Normal' : `${s}×`}</span>
                      {speed === s && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </button>
                  ))}

                  <div className="h-px bg-white/10 my-1" />

                  {/* Volume Slider inside More Menu */}
                  <div className="px-3 py-1.5 flex items-center gap-2">
                    <button onClick={toggleMute} className="text-white hover:text-white/85 transition-colors shrink-0">
                      {(muted || volume === 0) ? <IconVolumeMute /> : <IconVolumeFull />}
                    </button>
                    <div className="relative flex-1 h-[3px] rounded-full bg-white/25">
                      <div className="absolute left-0 h-full rounded-full bg-white pointer-events-none"
                           style={{ width: `${(muted ? 0 : volume) * 100}%` }} />
                      <input type="range" min={0} max={1} step={0.02} value={muted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="absolute inset-0 w-full h-5 -top-1 opacity-0 cursor-pointer"
                        style={{ touchAction: 'none' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
});
HTML5Player.displayName = 'HTML5Player';

// ─────────────────────────────────────────────────────────────────────────────────
// GoogleDrivePlayer
// ─────────────────────────────────────────────────────────────────────────────────
const GoogleDrivePlayer = memo(({ source, poster, initialRatio, onEnded }) => {
  const [loading,    setLoading]    = useState(true);
  const [embeddable, setEmbeddable] = useState(null);
  const [driveError, setDriveError] = useState(null);
  const [retryKey,   setRetryKey]   = useState(0);

  const imgRatio    = useThumbnailRatio(poster);
  const activeRatio = initialRatio || imgRatio || 16 / 9;

  useEffect(() => {
    let alive = true;
    const probe = async () => {
      setLoading(true); setDriveError(null);
      try {
        const res = await API.get(`/drive/check/${source.fileId}`);
        if (alive) setEmbeddable(res.data.success ? res.data.embeddable : true);
      } catch { if (alive) setEmbeddable(true); }

      if (!alive) return;

      try {
        const streamUrl = resolveDriveVideoUrl(source.fileId);
        const res = await fetch(streamUrl, { method: 'GET', cache: 'no-store' });
        if (!res.ok) {
          let code = null;
          try { code = (await res.json())?.code; } catch { /* ignore */ }
          if (alive) setDriveError(code === 'DRIVE_QUOTA_EXCEEDED' || res.status === 429 ? 'quota' : 'stream');
        } else { res.body?.cancel().catch(() => {}); }
      } catch { /* network error - HTML5Player will surface */ }

      if (alive) setLoading(false);
    };
    probe();
    return () => { alive = false; };
  }, [source.fileId, retryKey]);

  if (loading) {
    const { outerClass, outerStyle } = getLayoutStyles(activeRatio);
    return (
      <div className={outerClass} style={outerStyle}>
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-neutral-950">
          <Loader2 className="w-8 h-8 text-neutral-500 animate-spin" />
          <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">Loading...</span>
        </div>
      </div>
    );
  }

  if (embeddable === false) {
    const { outerClass, outerStyle } = getLayoutStyles(activeRatio);
    return (
      <div className={outerClass} style={outerStyle}>
        {poster && <div className="absolute inset-0 z-0 bg-cover bg-center blur-xl brightness-[0.15] pointer-events-none"
                        style={{ backgroundImage: `url(${poster})` }} />}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 space-y-4 text-center">
          <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xs uppercase tracking-wider font-bold text-white">Access Restricted</h3>
            <p className="text-[10px] text-neutral-400 max-w-[260px] leading-relaxed">
              This Google Drive file is private. Change sharing to "Anyone with the link" to enable playback.
            </p>
          </div>
          <button onClick={() => window.open(source.viewUrl, '_blank', 'noopener,noreferrer')}
            className="inline-flex items-center space-x-2 text-[10px] uppercase tracking-[0.18em] bg-white hover:bg-neutral-100 text-black px-5 py-2.5 rounded-full font-bold transition-all active:scale-95">
            <span>Open in Drive</span><ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  // Quota exceeded or stream error → fall back to Google Drive /preview iframe.
  // The iframe streams directly from Google's CDN to the browser, completely
  // bypassing our server-side proxy, so the download quota does not apply.
  if (driveError) {
    return (
      <IframePlayer
        embedUrl={source.embedUrl}
        poster={poster}
        initialRatio={activeRatio}
      />
    );
  }

  return (
    <HTML5Player key={retryKey} src={resolveDriveVideoUrl(source.fileId)}
      poster={poster} initialRatio={activeRatio} onEnded={onEnded}
      onError={() => setDriveError('stream')} />
  );
});
GoogleDrivePlayer.displayName = 'GoogleDrivePlayer';

// ─────────────────────────────────────────────────────────────────────────────────
// Top-level router
// ─────────────────────────────────────────────────────────────────────────────────
const VideoPlayer = ({ video, onEnded }) => {
  const resolvedUrl  = resolveMediaUrl(video.videoUrl);
  const source       = parseVideoSource(resolvedUrl);
  const poster       = resolveMediaUrl(video.thumbnail);
  const initialRatio = video.aspectRatio;

  let finalPoster = poster;
  if (!finalPoster) {
    if (source.type === 'youtube' && source.videoId) {
      finalPoster = `https://img.youtube.com/vi/${source.videoId}/maxresdefault.jpg`;
    } else if (source.type === 'drive' && source.fileId) {
      finalPoster = `https://drive.google.com/thumbnail?id=${source.fileId}&sz=w1280`;
    }
  }

  if (source.type === 'drive')
    return <GoogleDrivePlayer key={video._id} source={source} poster={finalPoster} initialRatio={initialRatio} onEnded={onEnded} />;
  if (source.type === 'youtube' || source.type === 'vimeo')
    return <IframePlayer key={video._id} embedUrl={source.embedUrl} poster={finalPoster} initialRatio={initialRatio} />;
  if (source.type === 'instagram')
    return <InstagramPlayer key={video._id} source={source} poster={finalPoster} />;
  return <HTML5Player key={video._id} src={resolveMediaUrl(source.src)} poster={finalPoster} onEnded={onEnded} initialRatio={initialRatio} />;
};

export default VideoPlayer;
