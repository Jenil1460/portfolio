import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Check } from 'lucide-react';
import API, { resolveMediaUrl } from '../services/api';
import { VideoPlayerPageSkeleton } from '../components/SkeletonLoader';
import VideoPlayer from '../components/VideoPlayer';

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
    window.scrollTo(0, 0);
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
    navigator.clipboard.writeText(window.location.href).catch(() => { });
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

        {/* Player Container - key ensures clean unmount/remount on navigation */}
        <VideoPlayer
          key={video._id}
          video={video}
          onEnded={handleEnded}
        />

        {/* Info section */}
        <div className="pt-4 space-y-4 max-w-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-[9px] uppercase tracking-widest text-neutral-500">
              {video.category?.name && (
                <span className="bg-white/5 border border-white/5 text-neutral-300 px-3 py-1 rounded-full font-bold">
                  {video.category.name}
                </span>
              )}
            </div>

            {video.instagramLink && (
              <div className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-neutral-400">
                <span>Visit this video in &rarr;</span>
                <a
                  href={video.instagramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center text-neutral-400 hover:text-white hover:scale-110 transition-all p-1"
                  title="View on Instagram"
                >
                  <Instagram className="w-4 h-4 text-neutral-400 hover:text-[#E1306C] transition-colors duration-300" />
                </a>
              </div>
            )}
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
