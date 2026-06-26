import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Eye, Calendar, Clock, Check } from 'lucide-react';
import API, { resolveMediaUrl } from '../services/api';
import { VideoPlayerPageSkeleton } from '../components/SkeletonLoader';

const VideoPlayerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [video, setVideo] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [ratio, setRatio] = useState(16 / 9); // default numerical aspect ratio
  
  const videoRef = useRef(null);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      setLoading(true);
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

  // Determine video aspect ratio dynamically based on thumbnail dimensions as first pass / fallback
  useEffect(() => {
    if (video && video.thumbnail) {
      const img = new Image();
      img.src = resolveMediaUrl(video.thumbnail);
      img.onload = () => {
        if (img.width && img.height) {
          setRatio(img.width / img.height);
        }
      };
      img.onerror = () => {
        setRatio(16 / 9);
      };
    }
  }, [video]);

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

  const handleLoadedMetadata = (e) => {
    const { videoWidth, videoHeight } = e.target;
    if (videoWidth && videoHeight) {
      setRatio(videoWidth / videoHeight);
    }
  };

  // Helper to parse different video URL sources and construct their respective player configurations
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
          type: 'drive-direct',
          fileId,
          url: `https://drive.google.com/uc?export=download&id=${fileId}`,
          embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
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

    // Default to direct HTML5 video (MP4/WebM/R2 streams)
    return { type: 'direct', url };
  };

  const renderActivePlayer = (source) => {
    if (source.type === 'youtube' || source.type === 'vimeo') {
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

    // For Google Drive, we attempt to play directly. If it fails (e.g. large file virus scan), we could fallback, but native controls are required.
    // Direct Native Video playback (R2/MP4/Drive-direct) with clean native controls
    return (
      <video
        ref={videoRef}
        src={resolveMediaUrl(source.url)}
        poster={resolveMediaUrl(video.thumbnail)}
        controls
        preload="metadata"
        playsInline
        webkit-playsinline="true"
        className="absolute inset-0 w-full h-full bg-transparent outline-none"
        style={{ objectFit: 'cover' }}
        onEnded={handleVideoEnded}
        onLoadedMetadata={handleLoadedMetadata}
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

  const source = getVideoSource(resolveMediaUrl(video.videoUrl));
  const isPortrait = ratio < 1;

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] text-white pt-24 pb-16 px-6 md:px-12 overflow-hidden select-none">
      
      {/* Blurred Ambient Backdrop generated from Thumbnail */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-[100px] opacity-15 scale-110 pointer-events-none z-0 transition-all duration-1000"
        style={{ backgroundImage: `url(${resolveMediaUrl(video.thumbnail)})` }}
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
        <div className="w-full max-w-full mx-auto flex justify-center">
          <div
            className={`video-player-container relative w-full rounded-[16px] overflow-hidden border border-white/5 shadow-2xl transition-all duration-500 bg-transparent ${
              isPortrait
                ? 'max-w-full sm:max-w-[420px]'
                : 'max-w-full'
            }`}
            style={{ aspectRatio: isPortrait ? ratio : (ratio && ratio !== 16/9 ? ratio : '16/9') }}
          >
            {renderActivePlayer(source)}
          </div>
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
                      src={resolveMediaUrl(item.thumbnail)}
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
