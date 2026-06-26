import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Eye, Calendar, Clock, Check } from 'lucide-react';
import API, { resolveMediaUrl } from '../services/api';
import { VideoPlayerPageSkeleton } from '../components/SkeletonLoader';

// ─────────────────────────────────────────────────────────────────────────────
// Parse any video URL into its type + embed/src URLs
// ─────────────────────────────────────────────────────────────────────────────
const parseVideoSource = (rawUrl) => {
  if (!rawUrl) return { type: 'unknown', src: '' };

  if (rawUrl.includes('drive.google.com') || rawUrl.includes('docs.google.com')) {
    let fileId = '';
    const m1 = rawUrl.match(/\/file\/d\/([^/?#&]+)/);
    const m2 = rawUrl.match(/[?&]id=([^&]+)/);
    if (m1) fileId = m1[1];
    else if (m2) fileId = m2[1];
    if (fileId) {
      return {
        type: 'drive',
        fileId,
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      };
    }
  }

  if (rawUrl.includes('youtube.com') || rawUrl.includes('youtu.be')) {
    let vid = '';
    const m1 = rawUrl.match(/[?&]v=([^&]+)/);
    const m2 = rawUrl.match(/youtu\.be\/([^?#]+)/);
    const m3 = rawUrl.match(/embed\/([^?#]+)/);
    if (m1) vid = m1[1];
    else if (m2) vid = m2[1];
    else if (m3) vid = m3[1];
    if (vid) {
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${vid}?autoplay=1&rel=0&playsinline=1&modestbranding=1`,
      };
    }
  }

  if (rawUrl.includes('vimeo.com')) {
    const m = rawUrl.match(/(?:video\/|vimeo\.com\/)(\d+)/);
    if (m) {
      return {
        type: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${m[1]}?autoplay=1&playsinline=1`,
      };
    }
  }

  return { type: 'direct', src: rawUrl };
};

// ─────────────────────────────────────────────────────────────────────────────
// Detect aspect ratio reliably from the thumbnail image.
//
// WHY thumbnail instead of a hidden <video> probe?
//   - Google Drive blocks the direct download URL with a virus-scan HTML page.
//     A hidden <video> element pointed at that URL never fires onloadedmetadata,
//     so videoWidth / videoHeight stay at 0 and everything defaults to 16:9.
//   - The thumbnail is a normal image: CORS-friendly, loads fast, always works.
//   - Admin-uploaded thumbnails match the video orientation (portrait thumb →
//     portrait video). This is the same technique YouTube and Vimeo use for
//     pre-load layout reservation.
//
// For direct MP4 / R2 we ALSO read the real metadata inside NativePlayer via
// onLoadedMetadata, and update the ratio with the precise pixel dimensions.
// ─────────────────────────────────────────────────────────────────────────────
const useThumbnailRatio = (thumbnailUrl) => {
  const [ratio, setRatio] = useState(null); // null = loading
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!thumbnailUrl) {
      setRatio(16 / 9);
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
        setRatio(16 / 9);
      }
      setReady(true);
    };

    img.onerror = () => {
      setRatio(16 / 9);
      setReady(true);
    };

    // crossOrigin anonymous so we don't send cookies but still read dimensions
    img.crossOrigin = 'anonymous';
    img.src = thumbnailUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
      img.src = '';
    };
  }, [thumbnailUrl]);

  return { ratio, ready };
};

// ─────────────────────────────────────────────────────────────────────────────
// Layout helper — translates ratio number into container CSS
// ─────────────────────────────────────────────────────────────────────────────
const getLayout = (ratio) => {
  const isPortrait = ratio < 0.99;
  const isSquare   = ratio >= 0.99 && ratio <= 1.01;

  return {
    outerClass: [
      'mx-auto w-full',
      isPortrait ? 'max-w-[420px]' : isSquare ? 'max-w-[500px]' : 'max-w-full',
    ].join(' '),
    containerStyle: { aspectRatio: String(ratio) },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// NativePlayer — for direct MP4 / Cloudflare R2
// Uses thumbnail for initial layout, then refines with real video metadata.
// ─────────────────────────────────────────────────────────────────────────────
const NativePlayer = ({ src, poster, thumbnailUrl, onEnded }) => {
  const { ratio: thumbRatio, ready } = useThumbnailRatio(thumbnailUrl);
  // Start with thumbnail ratio, then override with precise video dimensions
  const [ratio, setRatio] = useState(null);

  // Once thumbnail loads, seed the ratio
  useEffect(() => {
    if (ready && thumbRatio) setRatio(thumbRatio);
  }, [ready, thumbRatio]);

  const onMetadata = useCallback((e) => {
    const { videoWidth: w, videoHeight: h } = e.currentTarget;
    if (w && h) setRatio(w / h); // precise override
  }, []);

  if (!ratio) {
    return (
      <div className="mx-auto w-full max-w-full">
        <div className="relative rounded-[16px] bg-neutral-900 border border-white/5 shadow-2xl flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const { outerClass, containerStyle } = getLayout(ratio);

  return (
    <div className={outerClass}>
      <div
        className="relative overflow-hidden rounded-[16px] bg-black border border-white/5 shadow-2xl"
        style={containerStyle}
      >
        <video
          src={src}
          poster={poster}
          controls
          playsInline
          preload="metadata"
          onLoadedMetadata={onMetadata}
          onEnded={onEnded}
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: 'contain', background: '#000' }}
          webkit-playsinline="true"
          x-webkit-airplay="allow"
        />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DrivePlayer — Google Drive iframe
// Ratio comes from thumbnail. Only ONE player element in DOM.
// ─────────────────────────────────────────────────────────────────────────────
const DrivePlayer = ({ source, thumbnailUrl, onEnded }) => {
  const { ratio, ready } = useThumbnailRatio(thumbnailUrl);

  if (!ready) {
    return (
      <div className="mx-auto w-full max-w-full">
        <div className="relative rounded-[16px] bg-neutral-900 border border-white/5 shadow-2xl flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const { outerClass, containerStyle } = getLayout(ratio);

  return (
    <div className={outerClass}>
      <div
        className="relative overflow-hidden rounded-[16px] bg-black border border-white/5 shadow-2xl"
        style={containerStyle}
      >
        <iframe
          src={source.embedUrl}
          title="Video Player"
          className="absolute inset-0 w-full h-full border-0"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          webkitallowfullscreen="true"
          mozallowfullscreen="true"
          loading="lazy"
        />
      </div>
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
        loading="lazy"
      />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Top-level dispatcher — picks correct player.
// Parent MUST key this with video._id to force full unmount between videos.
// ─────────────────────────────────────────────────────────────────────────────
const UniversalVideoPlayer = ({ video, onEnded }) => {
  const resolved     = resolveMediaUrl(video.videoUrl);
  const source       = parseVideoSource(resolved);
  const thumbnailUrl = resolveMediaUrl(video.thumbnail);
  const poster       = thumbnailUrl;

  if (source.type === 'drive') {
    return <DrivePlayer source={source} thumbnailUrl={thumbnailUrl} onEnded={onEnded} />;
  }

  if (source.type === 'youtube' || source.type === 'vimeo') {
    return <IframePlayer embedUrl={source.embedUrl} />;
  }

  // direct / R2 / MP4
  return (
    <NativePlayer
      src={resolveMediaUrl(source.src)}
      poster={poster}
      thumbnailUrl={thumbnailUrl}
      onEnded={onEnded}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────
const VideoPlayerPage = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();

  const [video,   setVideo]   = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);

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
    return () => { cancelled = true; };
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
        <p className="text-xs text-neutral-400 font-light">Cinematic video clip was not found.</p>
        <Link to="/" className="text-[10px] uppercase tracking-widest bg-white text-black px-6 py-3 rounded-full font-bold">
          Back to Work
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] text-white pt-12 pb-16 px-4 md:px-8 overflow-hidden">

      {/* Ambient blurred backdrop from thumbnail */}
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
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Share2 className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Share'}</span>
          </button>
        </div>

        {/* Player — keyed by id so it fully unmounts between videos */}
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
            <h3 className="text-sm uppercase tracking-wider font-extrabold">Related Visuals</h3>
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
