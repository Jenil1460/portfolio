import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Play, Film, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../services/api';
import { VideoGridSkeleton, CategoryTabsSkeleton } from '../components/SkeletonLoader';

const Work = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [categories, setCategories] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingVids, setLoadingVids] = useState(true);
  
  // Filtering & Pagination State
  const activeCategory = searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page'), 10) || 1;
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Search input state
  const [searchInput, setSearchInput] = useState(searchQuery);

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
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
          search: searchQuery,
          page: currentPage,
          limit: 6, // 6 cinematic items per page for spacious grids
          published: 'true'
        }
      });
      if (res.data.success) {
        setVideos(res.data.data);
        setTotalPages(res.data.pages || 1);
        setTotalCount(res.data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoadingVids(false);
    }
  }, [activeCategory, searchQuery, currentPage]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Handle Category Switch (Text filter click)
  const handleCategorySelect = (slug) => {
    const params = {};
    if (slug !== 'all') params.category = slug;
    if (searchQuery) params.search = searchQuery;
    params.page = '1';
    setSearchParams(params);
  };

  // Handle Search Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = {};
    if (activeCategory !== 'all') params.category = activeCategory;
    if (searchInput) params.search = searchInput;
    params.page = '1';
    setSearchParams(params);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    const params = {};
    if (activeCategory !== 'all') params.category = activeCategory;
    params.page = '1';
    setSearchParams(params);
  };

  // Handle Page Switch
  const handlePageChange = (pageNum) => {
    const params = {};
    if (activeCategory !== 'all') params.category = activeCategory;
    if (searchQuery) params.search = searchQuery;
    params.page = pageNum.toString();
    setSearchParams(params);
    window.scrollTo({ top: 150, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-28 pb-20 select-none">
      <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-12">
        
        {/* Header Summary */}
        <div className="space-y-4 max-w-xl mx-auto text-center">
          <span className="text-[9px] uppercase tracking-[0.25em] text-neutral-500 font-semibold">Showcase</span>
          <h1 className="text-4xl md:text-5xl uppercase font-extrabold tracking-tight font-sans">Our Works</h1>
          <p className="text-xs text-neutral-400 font-light leading-relaxed">
            Discover visual stories categorized by atmosphere. Every thumbnail represents deep grading, dynamic edit pacing, and creative composition.
          </p>
        </div>

        {/* Filter Toolbar (Awwwards text links + minimal search) */}
        <div className="flex flex-col space-y-6 md:space-y-0 md:flex-row md:items-center md:justify-between border-y border-white/5 py-6 gap-4">
          
          {/* Dynamic Categories text filters list */}
          {loadingCats ? (
            <CategoryTabsSkeleton />
          ) : (
            <div className="flex flex-wrap gap-x-8 gap-y-3 items-center text-[10px] uppercase tracking-[0.25em] font-semibold text-neutral-500">
              <button
                onClick={() => handleCategorySelect('all')}
                className={`relative py-1.5 transition-colors duration-300 ${
                  activeCategory === 'all' ? 'text-white' : 'hover:text-white'
                }`}
              >
                <span>All Works</span>
                {activeCategory === 'all' && (
                  <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-white rounded-full"></span>
                )}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => handleCategorySelect(cat.slug)}
                  className={`relative py-1.5 transition-colors duration-300 ${
                    activeCategory === cat.slug ? 'text-white' : 'hover:text-white'
                  }`}
                >
                  <span>{cat.name}</span>
                  {activeCategory === cat.slug && (
                    <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-white rounded-full"></span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Minimal Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Search visuals..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-[#111111] border border-white/5 rounded-full px-5 py-2.5 pl-10 pr-10 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-white/20 transition-colors"
            />
            <Search className="w-3.5 h-3.5 text-neutral-600 absolute left-4 top-1/2 -translate-y-1/2" />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>

        {/* Grid List section - generous spacing, B&W accent theme */}
        {loadingVids ? (
          <VideoGridSkeleton count={6} />
        ) : videos.length > 0 ? (
          <div className="space-y-16">
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
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="p-2.5 border border-white/10 hover:border-white/20 rounded-full transition-colors disabled:opacity-30 disabled:hover:border-white/10 text-neutral-400 hover:text-white"
                  id="prev-work-page-btn"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center space-x-2.5">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-9 h-9 rounded-full text-xs font-semibold transition-all duration-300 ${
                          currentPage === pageNum
                            ? 'bg-white text-black font-bold'
                            : 'border border-white/10 text-neutral-500 hover:text-white hover:border-white/20'
                        }`}
                        id={`work-page-btn-${pageNum}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="p-2.5 border border-white/10 hover:border-white/20 rounded-full transition-colors disabled:opacity-30 disabled:hover:border-white/10 text-neutral-400 hover:text-white"
                  id="next-work-page-btn"
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
              We couldn't find any videos matching this category filter or search input.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Work;
