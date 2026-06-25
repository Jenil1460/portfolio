import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PlusCircle, Edit, Trash2, X, Upload, Save, CheckCircle, ArrowLeft, Star, Eye, Search, ArrowUpDown, RefreshCw } from 'lucide-react';
import API from '../../services/api';

const VideoManager = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [category, setCategory] = useState('');
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(true);
  const [duration, setDuration] = useState('00:00');

  // Status hooks
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showForm, setShowForm] = useState(false);

  // Upload Progress & Retry
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);

  // Search, Sorting, Filter, and Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt'); // title, category, duration, views, published, createdAt
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Load Videos and Categories
  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch categories first to populate dropdowns
      const catRes = await API.get('/categories');
      if (catRes.data.success) {
        setCategories(catRes.data.data);
      }
      
      // Fetch all videos for admin dashboard (including draft/unpublished)
      const vidRes = await API.get('/videos');
      if (vidRes.data.success) {
        setVideos(vidRes.data.data);
      }
    } catch (err) {
      console.error('Error loading admin panel data:', err);
      showToast('Failed to load portfolio items', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const action = searchParams.get('action');
    if (action === 'add') {
      setShowForm(true);
    }
    const catId = searchParams.get('category');
    if (catId) {
      setCategoryFilter(catId);
    }
  }, [searchParams]);

  const showToast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleEditClick = (vid) => {
    setEditingId(vid._id);
    setTitle(vid.title);
    setDescription(vid.description || '');
    setVideoUrl(vid.videoUrl);
    setThumbnail(vid.thumbnail);
    setCategory(vid.category?._id || '');
    setFeatured(vid.featured);
    setPublished(vid.published);
    setDuration(vid.duration || '00:00');
    setShowForm(true);
    
    // Reset file upload state
    setUploadProgress(0);
    setUploadError(null);
    setPendingFile(null);
  };

  const handleCancelForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setVideoUrl('');
    setThumbnail('');
    setCategory('');
    setFeatured(false);
    setPublished(true);
    setDuration('00:00');
    setShowForm(false);
    setUploadProgress(0);
    setUploadError(null);
    setPendingFile(null);
  };

  // Upload Thumbnail handler
  const handleThumbnailUpload = async (e) => {
    const file = e && e.target ? e.target.files[0] : e;
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Image size exceeds 10MB limit', 'error');
      return;
    }

    setPendingFile(file);
    setUploadError(null);
    setUploadProgress(10);
    setUploading(true);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 150);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await API.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      clearInterval(progressInterval);
      setUploadProgress(100);
      setTimeout(() => {
        setUploadProgress(0);
        setPendingFile(null);
      }, 800);
      if (res.data.success) {
        setThumbnail(res.data.url);
        showToast('Thumbnail uploaded successfully!');
      }
    } catch (err) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      setUploadError('Upload failed. R2 might be misconfigured.');
      console.error('Upload error:', err);
      showToast(err.response?.data?.message || 'Failed to upload thumbnail', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Submit Handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!title || !videoUrl || !thumbnail || !category) {
      showToast('Please fill in all required fields (Title, Video URL, Category, Thumbnail)', 'error');
      return;
    }

    const payload = {
      title,
      description,
      videoUrl,
      thumbnail,
      category,
      featured,
      published,
      duration,
    };

    setSaving(true);
    try {
      if (editingId) {
        const res = await API.put(`/videos/${editingId}`, payload);
        if (res.data.success) {
          showToast('Video item updated successfully!');
          handleCancelForm();
          loadData();
        }
      } else {
        const res = await API.post('/videos', payload);
        if (res.data.success) {
          showToast('Video item published successfully!');
          handleCancelForm();
          loadData();
        }
      }
    } catch (err) {
      console.error('Save video error:', err);
      showToast(err.response?.data?.message || 'Failed to save video item', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete Handler
  const handleDeleteVideo = async (id) => {
    if (!window.confirm('Are you sure you want to delete this video item?')) return;
    try {
      const res = await API.delete(`/videos/${id}`);
      if (res.data.success) {
        showToast('Video item deleted successfully!');
        loadData();
      }
    } catch (err) {
      console.error('Delete video error:', err);
      showToast(err.response?.data?.message || 'Failed to delete video item', 'error');
    }
  };

  // Sort and filter helper functions
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (e) => {
    setCategoryFilter(e.target.value);
    setCurrentPage(1);
  };

  const triggerSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const filteredVideos = videos.filter((vid) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      vid.title.toLowerCase().includes(search) || 
      (vid.description && vid.description.toLowerCase().includes(search));
    const matchesCategory = !categoryFilter || vid.category?._id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const sortedVideos = [...filteredVideos].sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    if (sortBy === 'title') {
      valA = (a.title || '').toLowerCase();
      valB = (b.title || '').toLowerCase();
    } else if (sortBy === 'category') {
      valA = (a.category?.name || '').toLowerCase();
      valB = (b.category?.name || '').toLowerCase();
    } else if (sortBy === 'createdAt') {
      valA = new Date(a.createdAt || 0).getTime();
      valB = new Date(b.createdAt || 0).getTime();
    } else if (sortBy === 'views') {
      valA = Number(a.views) || 0;
      valB = Number(b.views) || 0;
    } else if (sortBy === 'published') {
      valA = a.published ? 1 : 0;
      valB = b.published ? 1 : 0;
    } else {
      // duration MM:SS
      const getSec = (durStr) => {
        if (!durStr) return 0;
        const pts = durStr.split(':').map(Number);
        if (pts.length === 2) return pts[0] * 60 + pts[1];
        if (pts.length === 3) return pts[0] * 3600 + pts[1] * 60 + pts[2];
        return 0;
      };
      valA = getSec(a.duration);
      valB = getSec(b.duration);
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalItems = sortedVideos.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVideos = sortedVideos.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-16 px-6 md:px-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Navigation title row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-6 gap-4">
          <div className="space-y-1">
            <Link to="/admin" className="flex items-center space-x-1 text-xs text-neutral-400 hover:text-white transition-colors" id="back-to-dashboard-link">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-2xl uppercase tracking-wider font-extrabold font-display">Video Management</h1>
          </div>
          
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center justify-center space-x-2 bg-white text-black px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-colors"
              id="publish-video-btn"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publish Video</span>
            </button>
          )}
        </div>

        {/* Global Toasts */}
        {message.text && (
          <div className={`p-4 rounded-lg flex items-center space-x-2 text-xs border ${
            message.type === 'error'
              ? 'bg-red-950/40 border-red-500/20 text-red-400'
              : 'bg-green-950/40 border-green-500/20 text-green-400'
          }`} id="global-toast-message">
            {message.type !== 'error' && <CheckCircle className="w-4 h-4 text-green-400" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Add/Edit Video Form Slider */}
        {showForm && (
          <div className="bg-neutral-950 border border-white/5 p-6 md:p-8 rounded-xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-base uppercase tracking-wider font-extrabold font-display">
                {editingId ? 'Modify Video Details' : 'Publish Video Piece'}
              </h3>
              <button onClick={handleCancelForm} className="text-neutral-500 hover:text-white transition-colors" id="close-form-btn">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="vid-title-input" className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Video Title</label>
                  <input
                    id="vid-title-input"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-white/30 transition-colors"
                    placeholder="E.g. A Breath of Wilderness Commercial"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="vid-desc-input" className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Description</label>
                  <textarea
                    id="vid-desc-input"
                    rows="4"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-white/30 transition-colors resize-none"
                    placeholder="Describe the mood, team credits, locations..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="vid-cat-select" className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Category</label>
                    <select
                      id="vid-cat-select"
                      required
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="vid-duration-input" className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Duration (MM:SS)</label>
                    <input
                      id="vid-duration-input"
                      type="text"
                      required
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-white/30 transition-colors"
                      placeholder="03:45"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="vid-url-input" className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Video Link (MP4 URL / Drive / YouTube)</label>
                  <input
                    id="vid-url-input"
                    type="url"
                    required
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-white/30 transition-colors"
                    placeholder="https://drive.google.com/file/d/FILE_ID/view?usp=sharing"
                  />
                  <p className="text-[9px] text-neutral-500 font-light mt-1">
                    Accepts direct MP4 paths, Google Drive sharing previews, and YouTube video links.
                  </p>
                </div>
              </div>

              {/* Cover photo upload layout */}
              <div className="space-y-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Video Thumbnail</label>
                  
                  {thumbnail ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-white/15 group">
                      <img src={thumbnail} alt="Preview Thumbnail" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setThumbnail('')}
                        className="absolute top-2 right-2 bg-black/85 text-red-400 hover:text-red-300 p-2 rounded-full transition-colors border border-white/5"
                        id="remove-thumbnail-btn"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-white/10 hover:border-white/20 rounded-lg aspect-video flex flex-col items-center justify-center space-y-3 p-6 transition-colors">
                      <div className="bg-neutral-900 border border-white/5 p-3 rounded-full">
                        <Upload className="w-6 h-6 text-neutral-500" />
                      </div>
                      <div className="text-center">
                        <label htmlFor="thumbnail-upload" className="text-xs font-semibold cursor-pointer text-white underline hover:text-neutral-300" id="thumbnail-upload-label">
                          Upload thumbnail photo
                        </label>
                        <input id="thumbnail-upload" type="file" className="hidden" accept="image/*" onChange={handleThumbnailUpload} disabled={uploading} />
                        <p className="text-[10px] text-neutral-500 font-light mt-1">PNG, JPG, JPEG, WEBP up to 10MB</p>
                      </div>
                    </div>
                  )}

                  {/* Simulated Upload Progress & Retry */}
                  {uploading && (
                    <div className="space-y-1.5" id="upload-progress-container">
                      <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden border border-white/5">
                        <div 
                          className="bg-white h-1.5 rounded-full transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[9px] text-neutral-400">
                        <span className="animate-pulse">Uploading file to Cloudflare R2...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <div className="flex items-center justify-between bg-red-950/20 border border-red-500/10 p-3 rounded-lg" id="upload-error-container">
                      <p className="text-[10px] text-red-400 font-light">{uploadError}</p>
                      <button
                        type="button"
                        onClick={() => handleThumbnailUpload(pendingFile)}
                        className="text-[10px] bg-red-900/40 text-red-200 border border-red-500/20 px-2.5 py-1 rounded hover:bg-red-800/60 transition-all font-semibold uppercase tracking-wider flex items-center space-x-1"
                        id="retry-upload-btn"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-6 border border-white/5 bg-black/40 p-4 rounded-lg">
                  <label className="flex items-center space-x-2 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="rounded bg-black border-white/20 text-white focus:ring-0 focus:ring-offset-0 w-4 h-4"
                      id="featured-checkbox"
                    />
                    <span>Feature on Homepage</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={published}
                      onChange={(e) => setPublished(e.target.checked)}
                      className="rounded bg-black border-white/20 text-white focus:ring-0 focus:ring-offset-0 w-4 h-4"
                      id="published-checkbox"
                    />
                    <span>Publish Immediately</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-white/5">
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="border border-white/10 hover:border-white/30 px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors"
                    id="cancel-form-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || uploading}
                    className="flex items-center space-x-2 bg-white text-black px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-colors disabled:opacity-50"
                    id="submit-form-btn"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Publish Video'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Video Index Table & Tools */}
        <div className="bg-neutral-950 border border-white/5 rounded-xl p-6 space-y-6">
          
          {/* Filtering/Search Controls Row */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 w-full md:max-w-2xl">
              {/* Search input */}
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-neutral-500" />
                </span>
                <input
                  id="video-search-input"
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Search by title or description..."
                  className="w-full bg-black border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-white/30 transition-colors"
                />
                {searchTerm && (
                  <button
                    onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter dropdown */}
              <div className="w-full sm:w-48">
                <select
                  id="category-filter-select"
                  value={categoryFilter}
                  onChange={handleCategoryFilterChange}
                  className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Entries select */}
            <div className="flex items-center space-x-2 text-xs text-neutral-400 self-end md:self-auto">
              <span>Show</span>
              <select
                id="items-per-page-select"
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-black border border-white/10 rounded px-2.5 py-1 text-white focus:outline-none text-xs"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>
          </div>

          {loading ? (
            <p className="text-xs text-neutral-500 animate-pulse">Loading video items list...</p>
          ) : paginatedVideos.length > 0 ? (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-light">
                  <thead>
                    <tr className="border-b border-white/5 text-neutral-500 font-semibold uppercase tracking-wider select-none">
                      <th className="pb-3">Thumbnail</th>
                      <th className="pb-3 cursor-pointer hover:text-white transition-colors" onClick={() => triggerSort('title')}>
                        <div className="flex items-center space-x-1">
                          <span>Title</span>
                          <ArrowUpDown className="w-3 h-3 text-neutral-600" />
                        </div>
                      </th>
                      <th className="pb-3 cursor-pointer hover:text-white transition-colors" onClick={() => triggerSort('category')}>
                        <div className="flex items-center space-x-1">
                          <span>Category</span>
                          <ArrowUpDown className="w-3 h-3 text-neutral-600" />
                        </div>
                      </th>
                      <th className="pb-3 cursor-pointer hover:text-white transition-colors" onClick={() => triggerSort('duration')}>
                        <div className="flex items-center space-x-1">
                          <span>Duration</span>
                          <ArrowUpDown className="w-3 h-3 text-neutral-600" />
                        </div>
                      </th>
                      <th className="pb-3 cursor-pointer hover:text-white transition-colors" onClick={() => triggerSort('views')}>
                        <div className="flex items-center space-x-1">
                          <span>Views</span>
                          <ArrowUpDown className="w-3 h-3 text-neutral-600" />
                        </div>
                      </th>
                      <th className="pb-3 cursor-pointer hover:text-white transition-colors" onClick={() => triggerSort('published')}>
                        <div className="flex items-center space-x-1">
                          <span>Stats</span>
                          <ArrowUpDown className="w-3 h-3 text-neutral-600" />
                        </div>
                      </th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedVideos.map((vid) => (
                      <tr key={vid._id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="py-4">
                          <img src={vid.thumbnail} alt={vid.title} className="w-16 aspect-video object-cover rounded border border-white/10" />
                        </td>
                        <td className="py-4 font-semibold text-white">
                          <div className="flex items-center space-x-2">
                            <span className="truncate max-w-[200px]">{vid.title}</span>
                            {vid.featured && <Star className="w-3.5 h-3.5 fill-white text-white flex-shrink-0" title="Featured" />}
                          </div>
                        </td>
                        <td className="py-4 text-neutral-400">{vid.category?.name || 'Unassigned'}</td>
                        <td className="py-4 text-neutral-400 font-mono">{vid.duration || '00:00'}</td>
                        <td className="py-4 text-neutral-400 font-mono">
                          <span className="flex items-center space-x-1">
                            <Eye className="w-3.5 h-3.5 text-neutral-500" />
                            <span>{vid.views}</span>
                          </span>
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                            vid.published ? 'bg-green-950/40 text-green-400 border border-green-500/20' : 'bg-neutral-800 text-neutral-400 border border-white/5'
                          }`}>
                            {vid.published ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end space-x-2.5">
                            <Link
                              to={`/video/${vid._id}`}
                              className="p-1.5 border border-white/10 hover:border-white/30 rounded text-neutral-400 hover:text-white transition-colors"
                              title="Preview Video"
                              id={`preview-vid-${vid._id}`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => handleEditClick(vid)}
                              className="p-1.5 border border-white/10 hover:border-white/30 rounded text-neutral-400 hover:text-white transition-colors"
                              title="Edit"
                              id={`edit-vid-${vid._id}`}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteVideo(vid._id)}
                              className="p-1.5 border border-white/10 hover:border-red-900/40 rounded text-neutral-400 hover:text-red-400 hover:border-red-500/20 transition-colors"
                              title="Delete"
                              id={`delete-vid-${vid._id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination UI */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-white/5 pt-4 gap-4 text-xs">
                  <div className="text-neutral-500">
                    Showing <span className="font-semibold text-white">{startIndex + 1}</span> to{' '}
                    <span className="font-semibold text-white">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of{' '}
                    <span className="font-semibold text-white">{totalItems}</span> videos
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3.5 py-1.5 border border-white/10 hover:border-white/20 rounded disabled:opacity-30 disabled:hover:border-white/10 text-neutral-400 hover:text-white transition-all"
                      id="prev-page-btn"
                    >
                      Previous
                    </button>
                    <span className="text-neutral-500 px-2">
                      Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{totalPages}</span>
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3.5 py-1.5 border border-white/10 hover:border-white/20 rounded disabled:opacity-30 disabled:hover:border-white/10 text-neutral-400 hover:text-white transition-all"
                      id="next-page-btn"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-neutral-500 font-light">
              {searchTerm || categoryFilter 
                ? 'No videos matched your filter/search parameters.' 
                : 'No videos published yet. Click "Publish Video" to load one.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoManager;
