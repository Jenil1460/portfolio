import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Eye, Calendar, Clock, Check, Play, ExternalLink } from 'lucide-react';
import API, { resolveMediaUrl } from '../services/api';
import { VideoPlayerPageSkeleton } from '../components/SkeletonLoader';

// ─────────────────────────────────────────────────────────────────────────────
// Device detection
// ─────────────────────────────────────────────────────────────────────────────
const isMobile = () => {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Parse video URL → { type, fileId?, embedUrl?, src? }
// ─────────────────────────────────────────────────────────────────────────────
const parseVideoSource = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return { type: 'unknown', src: '' };

  const normalized = rawUrl.trim();

  const driveMatch = normalized.match(/\/file\/d\/([^/?#&]+)/) || normalized.match(/[?&]id=([^&]+)/);
  if (driveMatch) {
    const fileId = driveMatch[1];
    if (fileId) {
      return {
        type: 'drive',
        fileId,
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        viewUrl: `https://drive.google.com/file/d/${fileId}/view`,
      };
    }
  }

  const youTubeMatch =
    normalized.match(/[?&]v=([^&]+)/) ||
    normalized.match(/youtu\.be\/([^?#]+)/) ||
    normalized.match(/embed\/([^?#]+)/);
  if (youTubeMatch) {
    const vid = youTubeMatch[1];
    if (vid) {
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${vid}?autoplay=1&rel=0&playsinline=1&modestbranding=1`,
      };
    }
  }

  const vimeoMatch = normalized.match(/(?:video\/|vimeo\.com\/)(\d+)/);
  if (vimeoMatch) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&playsinline=1`,
    };
  }

  const instagramMatch = normalized.match(/instagram\.com\/(?:p|reel|tv)\/([^/?#&]+)/);
  if (instagramMatch) {
    const code = instagramMatch[1];
    return {
      type: 'instagram',
      code,
      url: normalized,
    };
  }

  return { type: 'direct', src: normalized };
};

const resolveDriveThumbnailUrl = (fileId) => `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
const resolveDriveVideoUrl = (fileId) => resolveMediaUrl(`/api/drive/${fileId}`);

// ─────────────────────────────────────────────────────────────────────────────
// Hook: detect aspect ratio from an image URL
// ─────────────────────────────────────────────────────────────────────────────
const useImageRatio = (imageUrl) => {
  const [ratio, setRatio] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!imageUrl) {
      setRatio(null);
      setReady(true);
      return;
    }

    setRatio(null);
    setReady(false);

    const img = new Image();

    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setRatio(img.naturalWidth / img.naturalHeight);
      } else {
        setRatio(null);
      }
      setReady(true);
    };

    img.onerror = () => {
      setRatio(null);
      setReady(true);
    };

    img.src = imageUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
      img.src = '';
    };
  }, [imageUrl]);

  return { ratio, ready };
};

// ─────────────────────────────────────────────────────────────────────────────
// Layout helper
// ─────────────────────────────────────────────────────────────────────────────
const getLayout = (ratio) => {
  const isPortrait = ratio && ratio < 1;
  const maxWidth = isPortrait ? 420 : '100%';

  return {
    outerClass: 'mx-auto w-full',
    containerStyle: {
      width: '100%',
      maxWidth,
      aspectRatio: ratio ? String(ratio) : '16/9',
    },
  };
};

// Spinner shown while ratio is being detected
const LoadingShell = () => (
  <div className="mx-auto w-full max-w-full">
    <div
      className="relative rounded-[16px] bg-neutral-900 border border-white/5 shadow-2xl flex items-center justify-center"
      style={{ aspectRatio: '16/9' }}
    >
      <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// NativePlayer — direct MP4 / Cloudflare R2
// ─────────────────────────────────────────────────────────────────────────────
const NativePlayer = ({ src, poster, onEnded }) => {
  const [ratio, setRatio] = useState(null);
  const [metadataLoaded, setMetadataLoaded] = useState(false);

  useEffect(() => {
    setRatio(null);
    setMetadataLoaded(false);
  }, [src]);

  const onLoadedMetadata = useCallback((event) => {
    const { videoWidth: w, videoHeight: h } = event.currentTarget;
    if (w && h) {
      setRatio(w / h);
    }
    setMetadataLoaded(true);
  }, []);

  const { outerClass, containerStyle } = getLayout(ratio);

  return (
    <div className={outerClass} style={{ maxWidth: containerStyle.maxWidth }}>
      <div
        className="relative overflow-hidden rounded-[16px] bg-black border border-white/5 shadow-2xl video-player-container"
        style={containerStyle}
      >
        {!metadataLoaded && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}

        <video
          src={src}
          poster={poster}
          controls
          playsInline
          preload="metadata"
          onLoadedMetadata={onLoadedMetadata}
          onEnded={onEnded}
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: 'contain', background: '#000', opacity: metadataLoaded ? 1 : 0 }}
          webkit-playsinline="true"
          x-webkit-airplay="allow"
        />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DrivePlayer
//
// DESKTOP: Renders the Drive /preview iframe inside a correctly-sized container.
//
// MOBILE:  The Drive /preview iframe is terrible on mobile (overlapping controls,
//          duplicate play buttons, broken seek bar — as seen in screenshots).
//          Instead we show a clean poster thumbnail with a styled play button.
//          Tapping opens the Drive file in a new tab where the user gets native
//          mobile video playback with proper controls and fullscreen support.
//
// RATIO:   Always uses `https://drive.google.com/thumbnail?id={fileId}&sz=w800`
//          for ratio detection, NOT the thumbnail stored in the database.
//          Google's thumbnail API preserves the real video dimensions, so a 9:16
//          video returns a 9:16 thumbnail. This fixes the problem where the
//          admin-uploaded thumbnail might be landscape for a portrait video.
// ─────────────────────────────────────────────────────────────────────────────
const DrivePlayer = ({ source, storedThumbnail, onEnded }) => {
  const driveThumbnailUrl = resolveDriveThumbnailUrl(source.fileId);
  const videoUrl = resolveDriveVideoUrl(source.fileId);
  const { ratio, ready } = useImageRatio(driveThumbnailUrl);
  const posterUrl = storedThumbnail || driveThumbnailUrl;
  const [useIframe, setUseIframe] = useState(false);

  if (!ready) return <LoadingShell />;

  const { outerClass, containerStyle } = getLayout(ratio);

  if (useIframe) {
    if (isMobile()) {
      return (
        <div className={outerClass} style={{ maxWidth: containerStyle.maxWidth }}>
          <div
            onClick={() => window.open(source.viewUrl || source.embedUrl, '_blank')}
            className="relative overflow-hidden rounded-[16px] bg-black border border-white/5 shadow-2xl video-player-container cursor-pointer group animate-fade-in"
            style={containerStyle}
          >
            <img
              src={posterUrl}
              alt="Play Video"
              className="absolute inset-0 w-full h-full object-cover filter brightness-[0.5] transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
              <div className="bg-white text-black p-5 rounded-full shadow-2xl flex items-center justify-center transform group-hover:scale-110 transition-all duration-300">
                <Play className="w-8 h-8 fill-black text-black ml-1" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] bg-black/70 border border-white/10 px-5 py-2 rounded-full font-bold text-neutral-300">
                Play in Drive
              </span>
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-neutral-400 text-center mt-3 leading-relaxed px-4">
            Stream fallback: Tap above to play natively in a new tab.
          </p>
        </div>
      );
    }

    return (
      <div className={outerClass} style={{ maxWidth: containerStyle.maxWidth }}>
        <div
          className="relative overflow-hidden rounded-[16px] bg-black border border-white/5 shadow-2xl video-player-container"
          style={containerStyle}
        >
          <iframe
            src={source.embedUrl}
            title="Drive Video Player"
            className="absolute inset-0 w-full h-full border-0"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            webkitallowfullscreen="true"
            mozallowfullscreen="true"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={outerClass} style={{ maxWidth: containerStyle.maxWidth }}>
      <div
        className="relative overflow-hidden rounded-[16px] bg-black border border-white/5 shadow-2xl video-player-container"
        style={containerStyle}
      >
        <video
          src={videoUrl}
          poster={posterUrl}
          controls
          playsInline
          preload="metadata"
          onLoadedMetadata={() => {}}
          onEnded={onEnded}
          onError={(e) => {
            const mediaError = e.currentTarget.error;
            console.warn('DrivePlayer HTML5 video error:', mediaError);
            if (mediaError && [3, 4].includes(mediaError.code)) {
              setUseIframe(true);
            }
          }}
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: 'contain', background: '#000' }}
          webkit-playsinline="true"
          x-webkit-airplay="allow"
        />
      </div>
      {isMobile() ? (
        <div className="flex flex-col items-center mt-4 space-y-2">
          <button
            onClick={() => window.open(source.viewUrl || source.embedUrl, '_blank')}
            className="inline-flex items-center justify-center space-x-2 text-[10px] uppercase tracking-[0.2em] bg-white hover:bg-neutral-200 text-black px-6 py-3 rounded-full font-bold transition-all duration-300 transform active:scale-95 shadow-md"
          >
            <span>Open in Drive</span>
            <ExternalLink className="w-3 h-3 text-black" />
          </button>
          <p className="text-[9px] text-neutral-500 font-light text-center leading-relaxed">
            Trouble playing? Tap above to open in Google Drive.
          </p>
        </div>
      ) : (
        <p className="text-[10px] uppercase tracking-widest text-neutral-400 text-center mt-3">
          Native Drive playback in page with mobile controls enabled.
        </p>
      )}
    </div>
  );
};
// ─────────────────────────────────────────────────────────────────────────────
// IframePlayer — YouTube / Vimeo (always 16:9)
// ─────────────────────────────────────────────────────────────────────────────
const IframePlayer = ({ embedUrl }) => (
  <div className="mx-auto w-full max-w-full">
    <div
      className="relative overflow-hidden rounded-[16px] bg-black border border-white/5 shadow-2xl"
      style={{ aspectRatio: '16/9' }}
    >
      <iframe
        src={embedUrl}
        title="Video Player"
        className="absolute inset-0 w-full h-full border-0"
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// InstagramPlayer — Instagram posts/reels.
// Since Instagram blocks embedding inside iframes on external sites via strict security
// headers, we show a clean poster thumbnail with the Instagram brand overlay.
// Clicking it opens the reel/post in a new tab (which opens the native Instagram app).
// ─────────────────────────────────────────────────────────────────────────────
const InstagramPlayer = ({ source, storedThumbnail }) => {
  const { ratio } = useImageRatio(storedThumbnail);
  const displayRatio = ratio || 0.8; // Reels are vertical, default to 4:5
  const { outerClass, containerStyle } = getLayout(displayRatio);

  return (
    <div className={outerClass} style={{ maxWidth: containerStyle.maxWidth }}>
      <div
        onClick={() => window.open(source.url, '_blank')}
        className="relative overflow-hidden rounded-[16px] bg-[#0c0c0c] border border-white/5 shadow-2xl video-player-container cursor-pointer group flex items-center justify-center transition-all duration-300 hover:border-white/10"
        style={containerStyle}
      >
        {storedThumbnail ? (
          <img
            src={storedThumbnail}
            alt="Play Reel"
            className="absolute inset-0 w-full h-full object-cover filter brightness-[0.5] transition-transform duration-700 ease-out group-hover:scale-103"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-tr from-[#8a3ab9]/20 via-[#e95950]/20 to-[#fccc63]/20" />
        )}
        
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 z-10">
          <div className="bg-white hover:bg-neutral-100 text-black p-5 rounded-full shadow-2xl flex items-center justify-center transform group-hover:scale-110 transition-all duration-300">
            <svg
              className="w-8 h-8 text-black fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] bg-black/80 border border-white/10 px-5 py-2 rounded-full font-bold text-neutral-300">
            Open in Instagram
          </span>
        </div>
      </div>
      
      <div className="flex flex-col items-center mt-4 space-y-2">
        <button
          onClick={() => window.open(source.url, '_blank')}
          className="inline-flex items-center justify-center space-x-2 text-[10px] uppercase tracking-[0.2em] bg-white hover:bg-neutral-200 text-black px-6 py-3 rounded-full font-bold transition-all duration-300 transform active:scale-95 shadow-md"
        >
          <span>Watch Reel</span>
          <ExternalLink className="w-3 h-3 text-black" />
        </button>
        <p className="text-[9px] text-neutral-500 font-light text-center leading-relaxed">
          Instagram content: Click to view natively on Instagram.
        </p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Top-level dispatcher — key with video._id in parent for clean unmount
// ─────────────────────────────────────────────────────────────────────────────
const UniversalVideoPlayer = ({ video, onEnded }) => {
  const resolved = resolveMediaUrl(video.videoUrl);
  const source = parseVideoSource(resolved);
  const storedThumbnail = resolveMediaUrl(video.thumbnail);

  if (source.type === 'drive') {
    return <DrivePlayer source={source} storedThumbnail={storedThumbnail} onEnded={onEnded} />;
  }

  if (source.type === 'instagram') {
    return <InstagramPlayer source={source} storedThumbnail={storedThumbnail} />;
  }

  if (source.type === 'youtube' || source.type === 'vimeo') {
    return <IframePlayer embedUrl={source.embedUrl} />;
  }

  return (
    <NativePlayer
      src={resolveMediaUrl(source.src)}
      poster={storedThumbnail}
      onEnded={onEnded}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────
const VideoPlayerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [video, setVideo] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setVideo(null);
      setRelated([]);
      try {
        const res = await API.get(`/videos/${id}`);
        if (!cancelled && res.data.success) {
          setVideo(res.data.data);
          setRelated(res.data.related || []);
        }
      } catch (err) {
        console.error('Error loading video:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleEnded = () => {
    if (related.length > 0) navigate(`/video/${related[0]._id}`);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <VideoPlayerPageSkeleton />;

  if (!video) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-6 px-6">
        <p className="text-xs text-neutral-400 font-light">
          Cinematic video clip was not found.
        </p>
        <Link
          to="/"
          className="text-[10px] uppercase tracking-widest bg-white text-black px-6 py-3 rounded-full font-bold"
        >
          Back to Work
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] text-white pt-12 pb-16 px-4 md:px-8 overflow-hidden">
      {/* Ambient backdrop */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `url(${resolveMediaUrl(video.thumbnail)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(80px)',
          opacity: 0.12,
          transform: 'scale(1.1)',
        }}
      />

      <div className="relative z-10 max-w-[1100px] mx-auto space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between pt-4">
          <Link
            to="/"
            className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>

          <button
            onClick={handleShare}
            className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-neutral-400 hover:text-white transition-colors border border-white/5 bg-[#171717] px-4 py-2 rounded-full"
            id="share-frame-btn"
          >
            {copied ? (
              <Check className="w-3 h-3 text-green-400" />
            ) : (
              <Share2 className="w-3 h-3" />
            )}
            <span>{copied ? 'Copied' : 'Share'}</span>
          </button>
        </div>

        {/* Player */}
        <UniversalVideoPlayer
          key={video._id}
          video={video}
          onEnded={handleEnded}
        />

        {/* Info grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-3 text-[9px] uppercase tracking-widest text-neutral-500">
              {video.category?.name && (
                <span className="bg-white/5 border border-white/5 text-neutral-300 px-3 py-1 rounded-full font-bold">
                  {video.category.name}
                </span>
              )}
              <span className="flex items-center space-x-1 font-mono">
                <Clock className="w-3 h-3" />
                <span>{video.duration || '00:00'}</span>
              </span>
            </div>

            <h1 className="text-2xl md:text-4xl uppercase font-extrabold tracking-tight text-white leading-tight">
              {video.title}
            </h1>

            {video.description && (
              <p className="text-neutral-400 text-xs md:text-sm font-light leading-relaxed whitespace-pre-line">
                {video.description}
              </p>
            )}
          </div>

          {/* Film metadata */}
          <div className="bg-[#171717] border border-white/5 p-6 rounded-[16px] space-y-6 self-start">
            <h4 className="text-[10px] uppercase tracking-widest font-bold border-b border-white/5 pb-3 text-white">
              Film Log
            </h4>
            <div className="space-y-4 text-xs font-light text-neutral-400">
              <div className="flex justify-between">
                <span>Total Views</span>
                <span className="font-semibold text-white font-mono flex items-center space-x-1">
                  <Eye className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{video.views}</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span>Date Logged</span>
                <span className="text-white flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                  <span>
                    {new Date(video.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Related videos */}
        {related.length > 0 && (
          <div className="pt-12 border-t border-white/5 space-y-6">
            <h3 className="text-sm uppercase tracking-wider font-extrabold">
              Related Visuals
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map((item) => (
                <Link
                  key={item._id}
                  to={`/video/${item._id}`}
                  className="group block border border-white/5 bg-[#171717] rounded-[16px] overflow-hidden hover:border-white/10 transition-all duration-300"
                  id={`related-video-card-${item._id}`}
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={resolveMediaUrl(item.thumbnail)}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 brightness-90"
                      loading="lazy"
                    />
                    <span className="absolute bottom-2 right-2 bg-black/80 text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono">
                      {item.duration || '00:00'}
                    </span>
                  </div>
                  <div className="p-3">
                    <h4 className="text-[11px] font-bold uppercase tracking-wide truncate group-hover:text-neutral-300 transition-colors">
                      {item.title}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayerPage;
