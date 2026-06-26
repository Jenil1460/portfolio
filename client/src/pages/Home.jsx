import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Play, Film, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../services/api';
import Logo from '../components/Logo';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [videos, setVideos] = useState([]);
  
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingVids, setLoadingVids] = useState(true);
  
  // Filtering & Pagination State
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Default All Category representation
  const allCategory = {
    _id: 'all',
    name: 'All Works',
    slug: 'all',
    coverImage: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=600'
  };

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCats(true);
        const res = await API.get('/categories?active=true');
        if (res.data.success) {
          setCategories(res.data.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCats(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Videos
  const fetchVideos = useCallback(async () => {
    setLoadingVids(true);
    try {
      const categoryParam = activeCategory !== 'all' ? activeCategory : '';
      const res = await API.get('/videos', {
        params: {
          category: categoryParam,
          page: currentPage,
          limit: 9, // 9 items per page for a spacious grid layout
          published: 'true'
        }
      });
      if (res.data.success) {
        setVideos(res.data.data);
        setTotalPages(res.data.pages || 1);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoadingVids(false);
    }
  }, [activeCategory, currentPage]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Handle Category Switch
  const handleCategorySelect = (slug) => {
    setActiveCategory(slug);
    setCurrentPage(1);
  };

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] text-white pt-12 pb-24 select-none">
      <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-12">
        
        {/* Brand Logo & Instagram Link */}
        <div className="flex flex-col items-center">
          <Logo />
          <a
            href="https://www.instagram.com/rj.twoshot/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] uppercase tracking-[0.3em] text-neutral-500 hover:text-white transition-colors duration-300 -mt-6 pb-2 cursor-pointer font-medium"
            id="home-instagram-link"
          >
            Instagram
          </a>
        </div>
        
        {/* Category cards grid */}
        {loadingCats ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4 w-full animate-pulse">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-24 bg-[#171717] rounded-[16px] border border-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4 w-full">
            {[allCategory, ...categories].map((cat) => {
              const isActive = activeCategory === cat.slug;
              return (
                <button
                  key={cat._id}
                  onClick={() => handleCategorySelect(cat.slug)}
                  className={`group relative h-24 rounded-[16px] overflow-hidden border transition-all duration-500 text-left ${
                    isActive 
                      ? 'border-white bg-neutral-900 shadow-lg' 
                      : 'border-white/5 bg-[#171717] hover:border-white/20'
                  }`}
                  id={`cat-card-${cat.slug}`}
                >
                  {cat.coverImage && (
                    <img
                      src={cat.coverImage}
                      alt={cat.name}
                      className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
                        isActive ? 'brightness-[0.45]' : 'brightness-[0.3] group-hover:brightness-[0.4]'
                      }`}
                      loading="lazy"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-x-4 bottom-3 flex flex-col justify-end">
                    <span className="text-[8px] uppercase tracking-[0.2em] font-medium text-neutral-500 group-hover:text-neutral-400">Category</span>
                    <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-white mt-0.5 truncate">{cat.name}</h3>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Video Grid */}
        {loadingVids ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 pt-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-video bg-[#171717] rounded-[16px] border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : videos.length > 0 ? (
          <div className="space-y-12 pt-4">
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12"
            >
              <AnimatePresence mode="popLayout">
                {videos.map((video) => (
                  <motion.div
                    key={video._id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.4 }}
                    className="group border border-white/5 bg-[#171717] rounded-[16px] overflow-hidden flex flex-col justify-between hover:border-white/10 transition-colors shadow-2xl"
                  >
                    {/* Thumbnail area with slight zoom and play icon fade in */}
                    <Link to={`/video/${video._id}`} className="block relative aspect-video overflow-hidden bg-[#0A0A0A] clickable">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 filter brightness-[0.85] group-hover:brightness-[0.7]"
                        loading="lazy"
                      />
                      
                      {/* Minimal Play Hover Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-400 bg-black/30">
                        <div className="bg-white text-black p-4 rounded-full transform scale-75 group-hover:scale-100 transition-transform duration-300">
                          <Play className="w-4 h-4 fill-black text-black" />
                        </div>
                      </div>

                      {/* Info Overlays */}
                      <span className="absolute top-4 left-4 bg-black/85 border border-white/5 text-[8px] uppercase tracking-widest text-white px-2.5 py-1 rounded-full font-semibold">
                        {video.category?.name}
                      </span>
                      <span className="absolute bottom-4 right-4 bg-black/85 border border-white/5 text-[8px] uppercase tracking-widest text-white px-2.5 py-0.5 rounded font-light font-mono">
                        {video.duration || '00:00'}
                      </span>
                    </Link>
                    
                    {/* Minimal Information */}
                    <div className="p-6 space-y-2">
                      <Link to={`/video/${video._id}`} className="hover:text-neutral-300 transition-colors inline-block">
                        <h3 className="font-extrabold text-sm uppercase tracking-wider text-white truncate max-w-[250px]">{video.title}</h3>
                      </Link>
                      <p className="text-neutral-500 text-xs font-light line-clamp-2 leading-relaxed">
                        {video.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Premium Minimal Pagination UI */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-4 pt-12 border-t border-white/5 text-xs select-none">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="p-2.5 border border-white/10 hover:border-white/20 rounded-full transition-colors disabled:opacity-30 disabled:hover:border-white/10 text-neutral-400 hover:text-white"
                  id="prev-home-page-btn"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center space-x-2.5">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-9 h-9 rounded-full text-xs font-semibold transition-all duration-300 ${
                          currentPage === pageNum
                            ? 'bg-white text-black font-bold'
                            : 'border border-white/10 text-neutral-500 hover:text-white hover:border-white/20'
                        }`}
                        id={`home-page-btn-${pageNum}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="p-2.5 border border-white/10 hover:border-white/20 rounded-full transition-colors disabled:opacity-30 disabled:hover:border-white/10 text-neutral-400 hover:text-white"
                  id="next-home-page-btn"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="border border-white/5 rounded-[16px] p-16 text-center max-w-lg mx-auto bg-[#171717] mt-12">
            <Film className="w-6 h-6 mx-auto text-neutral-600 mb-4" />
            <p className="text-xs font-bold uppercase tracking-wider text-white mb-2">No Visuals Found</p>
            <p className="text-[11px] text-neutral-500 font-light leading-relaxed">
              We couldn't find any videos matching this category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
