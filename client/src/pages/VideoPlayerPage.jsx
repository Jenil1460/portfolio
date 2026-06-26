import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Eye, Calendar, Clock, Check, Play } from 'lucide-react';
import API from '../services/api';
import { VideoPlayerPageSkeleton } from '../components/SkeletonLoader';

const VideoPlayerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [video, setVideo] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Player Playback & UI States
  const [copied, setCopied] = useState(false);
  const [playerHovered, setPlayerHovered] = useState(false);
  const [playbackStarted, setPlaybackStarted] = useState(false);
  
  const playerWrapperRef = useRef(null);

  useEffect(() => {
    if (playerHovered) {
      document.body.classList.add('hide-custom-cursor');
    } else {
      document.body.classList.remove('hide-custom-cursor');
    }
    return () => {
      document.body.classList.remove('hide-custom-cursor');
    };
  }, [playerHovered]);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      setLoading(true);
      setPlaybackStarted(false); // Reset playback state for new video view
      try {
        const res = await API.get(`/videos/${id}`);
        if (res.data.success) {
          setVideo(res.data.data);
          setRelated(res.data.related || []);
        }
      } catch (error) {
        console.error('Error loading video details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVideoDetails();
  }, [id]);

  // Autoplay next effect when video ends
  const handleVideoEnded = () => {
    if (related.length > 0) {
      navigate(`/video/${related[0]._id}`);
    }
  };

  const handleShareClick = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to parse different video URL sources and construct their respective player configuration details
  const getVideoSource = (url) => {
    if (!url) return { type: 'unknown', url: '' };

    // Google Drive
    if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
      let fileId = '';
      if (url.includes('/file/d/')) {
        const match = url.match(/\/file\/d\/([^/]+)/);
        if (match) fileId = match[1];
      } else {
        const match = url.match(/[?&]id=([^&]+)/);
        if (match) fileId = match[1];
      }
      if (fileId) {
        return {
          type: 'drive',
          fileId,
          embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
          fallbackUrl: `https://drive.google.com/file/d/${fileId}/view`
        };
      }
    }

    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split(/[?#]/)[0];
      } else if (url.includes('embed/')) {
        videoId = url.split('embed/')[1]?.split(/[?#]/)[0];
      } else {
        const match = url.match(/[?&]v=([^&]+)/);
        if (match) videoId = match[1];
      }
      if (videoId) {
        return {
          type: 'youtube',
          videoId,
          embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`
        };
      }
    }

    // Vimeo
    if (url.includes('vimeo.com')) {
      const match = url.match(/(?:video\/|vimeo\.com\/)(\d+)/);
      if (match) {
        const videoId = match[1];
        return {
          type: 'vimeo',
          videoId,
          embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1&playsinline=1`
        };
      }
    }

    // Default to direct HTML5 video (MP4/WebM/etc.)
    return { type: 'direct', url };
  };

  const renderActivePlayer = (source) => {
    if (source.type === 'drive') {
      return (
        <iframe
          src={source.embedUrl}
          title={video.title}
          className="absolute inset-0 w-full h-full border-none bg-black"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          webkitallowfullscreen="true"
          mozallowfullscreen="true"
        />
      );
    }

    if (source.type === 'youtube') {
      return (
        <iframe
          src={source.embedUrl}
          title={video.title}
          className="absolute inset-0 w-full h-full border-none bg-black"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          webkitallowfullscreen="true"
          mozallowfullscreen="true"
        />
      );
    }

    if (source.type === 'vimeo') {
      return (
        <iframe
          src={source.embedUrl}
          title={video.title}
          className="absolute inset-0 w-full h-full border-none bg-black"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          webkitallowfullscreen="true"
          mozallowfullscreen="true"
        />
      );
    }

    // Direct Native Video playback
    return (
      <video
        src={source.url}
        poster={video.thumbnail}
        controls
        autoPlay
        playsInline
        webkit-playsinline="true"
        className="absolute inset-0 w-full h-full object-contain bg-black"
        onEnded={handleVideoEnded}
      />
    );
  };

  if (loading) {
    return <VideoPlayerPageSkeleton />;
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-6">
        <p className="text-xs text-neutral-400 font-light">Cinematic video clip was not found.</p>
        <Link to="/" className="text-[10px] uppercase tracking-widest bg-white text-black px-6 py-3 rounded-full font-bold">
          Back to Work
        </Link>
      </div>
    );
  }

  const source = getVideoSource(video.videoUrl);

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] text-white pt-24 pb-16 px-6 md:px-12 overflow-hidden select-none">
      
      {/* Blurred Ambient Backdrop generated from Thumbnail */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-[100px] opacity-15 scale-110 pointer-events-none z-0 transition-all duration-1000"
        style={{ backgroundImage: `url(${video.thumbnail})` }}
      />

      <div className="relative z-10 max-w-[1200px] mx-auto space-y-8">
        
        {/* Back and Share buttons */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Showcase</span>
          </Link>
          
          <button
            onClick={handleShareClick}
            className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-neutral-400 hover:text-white transition-colors border border-white/5 bg-[#171717] px-4 py-2 rounded-full"
            id="share-frame-btn"
          >
            {copied ? <Check className="w-3 text-green-400" /> : <Share2 className="w-3" />}
            <span>{copied ? 'Copied' : 'Share Frame'}</span>
          </button>
        </div>

        {/* Responsive Aspect-Ratio Video Container */}
        <div className="w-full max-w-full mx-auto">
          <div
            ref={playerWrapperRef}
            onMouseEnter={() => setPlayerHovered(true)}
            onMouseLeave={() => setPlayerHovered(false)}
            className="video-player-container relative w-full aspect-video max-h-[75vh] sm:max-h-[80vh] lg:max-h-none rounded-[16px] overflow-hidden border border-white/5 bg-black shadow-2xl"
          >
            {playbackStarted ? (
              renderActivePlayer(source)
            ) : (
              // Lazy load poster layout
              <div
                onClick={() => setPlaybackStarted(true)}
                className="absolute inset-0 w-full h-full cursor-pointer group overflow-hidden select-none"
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 filter brightness-[0.75]"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors duration-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white text-black p-5 rounded-full transform scale-90 group-hover:scale-100 transition-all duration-400 shadow-2xl flex items-center justify-center">
                    <Play className="w-8 h-8 fill-black text-black ml-1" />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Fallback open button for Google Drive view limits */}
          {source.type === 'drive' && (
            <div className="flex justify-center pt-5">
              <a
                href={source.fallbackUrl || video.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-[10px] uppercase tracking-widest bg-white hover:bg-neutral-200 text-black px-6 py-3 rounded-full font-bold transition-all duration-300 transform active:scale-95 shadow-lg"
              >
                <span>Open Video</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-external-link"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
              </a>
            </div>
          )}
        </div>

        {/* Video Information Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-6">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-3 text-[9px] uppercase tracking-widest text-neutral-500">
              <span className="bg-white/5 border border-white/5 text-neutral-300 px-3 py-1 rounded-full font-bold">
                {video.category?.name}
              </span>
              <span className="flex items-center space-x-1 font-mono">
                <Clock className="w-3 h-3" />
                <span>{video.duration || '00:00'}</span>
              </span>
            </div>
            
            <h1 className="text-2xl md:text-4xl uppercase font-extrabold tracking-tight text-white leading-tight font-sans">
              {video.title}
            </h1>
            
            <p className="text-neutral-400 text-xs md:text-sm font-light leading-relaxed whitespace-pre-line pt-2">
              {video.description}
            </p>
          </div>

          {/* Minimal Film Metadata Column */}
          <div className="bg-[#171717] border border-white/5 p-6 rounded-[16px] space-y-6 self-start">
            <h4 className="text-[10px] uppercase tracking-widest font-bold border-b border-white/5 pb-3 text-white">Film Log</h4>
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
                  <span>{new Date(video.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Visuals Grid */}
        {related.length > 0 && (
          <div className="pt-16 border-t border-white/5 space-y-8">
            <h3 className="text-sm uppercase tracking-wider font-extrabold font-sans">Related Visuals</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((item) => (
                <Link
                  key={item._id}
                  to={`/video/${item._id}`}
                  className="group block border border-white/5 bg-[#171717] rounded-[16px] overflow-hidden hover:border-white/10 transition-all duration-300"
                  id={`related-video-card-${item._id}`}
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 filter brightness-95"
                    />
                    <span className="absolute bottom-2 right-2 bg-black/80 text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono">
                      {item.duration || '00:00'}
                    </span>
                  </div>
                  <div className="p-4 space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wide truncate group-hover:text-neutral-300 transition-colors">
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
