import React, { useContext, useEffect, useState } from 'react';
import { PlusCircle, Edit, Trash2, X, Upload, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';

const Dashboard = () => {
  const { admin } = useContext(AuthContext);

  // Lists
  const [categories, setCategories] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingVids, setLoadingVids] = useState(true);

  // Modals status
  const [catModal, setCatModal] = useState({ open: false, mode: 'add', data: null });
  const [vidModal, setVidModal] = useState({ open: false, mode: 'add', data: null });

  // Category Form values
  const [catName, setCatName] = useState('');
  const [catCoverImage, setCatCoverImage] = useState('');
  const [catUploading, setCatUploading] = useState(false);
  const [catSaving, setCatSaving] = useState(false);

  // Video Form values
  const [vidTitle, setVidTitle] = useState('');
  const [vidCategory, setVidCategory] = useState('');
  const [vidVideoUrl, setVidVideoUrl] = useState('');
  const [vidThumbnail, setVidThumbnail] = useState('');
  const [vidUploading, setVidUploading] = useState(false);
  const [vidSaving, setVidSaving] = useState(false);

  // Toast status
  const [toast, setToast] = useState({ text: '', type: 'success' });

  // Fetch Data
  const fetchCategories = async () => {
    try {
      setLoadingCats(true);
      const res = await API.get('/categories');
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      showToast('Failed to load categories', 'error');
    } finally {
      setLoadingCats(false);
    }
  };

  const fetchVideos = async () => {
    try {
      setLoadingVids(true);
      const res = await API.get('/videos');
      if (res.data.success) {
        setVideos(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching videos:', err);
      showToast('Failed to load videos', 'error');
    } finally {
      setLoadingVids(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchVideos();
  }, []);

  // Utility to show toasts
  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: '', type: 'success' }), 4000);
  };

  // Image Upload handler
  const handleImageUpload = async (e, setUrl, setUploading) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Image size exceeds 10MB limit', 'error');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await API.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setUrl(res.data.url);
        showToast('Image uploaded successfully');
      }
    } catch (err) {
      console.error('Upload error:', err);
      showToast(err.response?.data?.message || 'Failed to upload image', 'error');
    } finally {
      setUploading(false);
    }
  };

  // --- Category CRUD Handlers ---

  const openAddCategory = () => {
    setCatName('');
    setCatCoverImage('');
    setCatModal({ open: true, mode: 'add', data: null });
  };

  const openEditCategory = (cat) => {
    setCatName(cat.name);
    setCatCoverImage(cat.coverImage);
    setCatModal({ open: true, mode: 'edit', data: cat });
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();

    // Frontend validations
    if (!catName.trim()) {
      showToast('Category name is required', 'error');
      return;
    }
    if (!catCoverImage) {
      showToast('Cover image is required', 'error');
      return;
    }

    // Frontend duplicate validation
    const editingId = catModal.data?._id;
    const isDuplicate = categories.some(
      (cat) =>
        cat.name.toLowerCase().trim() === catName.toLowerCase().trim() &&
        cat._id !== editingId
    );
    if (isDuplicate) {
      showToast('Duplicate category names are not allowed', 'error');
      return;
    }

    const payload = {
      name: catName.trim(),
      coverImage: catCoverImage,
    };

    setCatSaving(true);
    try {
      if (catModal.mode === 'edit') {
        const res = await API.put(`/categories/${editingId}`, payload);
        if (res.data.success) {
          showToast('Category updated successfully');
          setCatModal({ open: false, mode: 'add', data: null });
          fetchCategories();
          fetchVideos();
        }
      } else {
        const res = await API.post('/categories', payload);
        if (res.data.success) {
          showToast('Category created successfully');
          setCatModal({ open: false, mode: 'add', data: null });
          fetchCategories();
        }
      }
    } catch (err) {
      console.error('Save category error:', err);
      showToast(err.response?.data?.message || 'Failed to save category', 'error');
    } finally {
      setCatSaving(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (cat.videoCount > 0) {
      const confirmText = `This category contains ${cat.videoCount} videos. Delete the category and all related videos?`;
      if (window.confirm(confirmText)) {
        try {
          const res = await API.delete(`/categories/${cat._id}?cascade=true`);
          if (res.data.success) {
            showToast('Category and all related videos deleted successfully');
            fetchCategories();
            fetchVideos();
          }
        } catch (err) {
          console.error('Delete cascade category error:', err);
          showToast(err.response?.data?.message || 'Failed to delete category', 'error');
        }
      }
    } else {
      if (window.confirm('Are you sure you want to delete this category?')) {
        try {
          const res = await API.delete(`/categories/${cat._id}`);
          if (res.data.success) {
            showToast('Category deleted successfully');
            fetchCategories();
          }
        } catch (err) {
          console.error('Delete category error:', err);
          showToast(err.response?.data?.message || 'Failed to delete category', 'error');
        }
      }
    }
  };

  // --- Video CRUD Handlers ---

  const openAddVideo = () => {
    setVidTitle('');
    setVidCategory('');
    setVidVideoUrl('');
    setVidThumbnail('');
    setVidModal({ open: true, mode: 'add', data: null });
  };

  const openEditVideo = (vid) => {
    setVidTitle(vid.title);
    setVidCategory(vid.category?._id || vid.category || '');
    setVidVideoUrl(vid.videoUrl);
    setVidThumbnail(vid.thumbnail);
    setVidModal({ open: true, mode: 'edit', data: vid });
  };

  const handleVideoSubmit = async (e) => {
    e.preventDefault();

    // Frontend validations
    if (!vidTitle.trim()) {
      showToast('Video title is required', 'error');
      return;
    }
    if (!vidCategory) {
      showToast('Category selection is required', 'error');
      return;
    }
    if (!vidVideoUrl.trim()) {
      showToast('Video link is required', 'error');
      return;
    }
    if (!vidThumbnail) {
      showToast('Thumbnail is required', 'error');
      return;
    }

    const payload = {
      title: vidTitle.trim(),
      category: vidCategory,
      videoUrl: vidVideoUrl.trim(),
      thumbnail: vidThumbnail,
    };

    setVidSaving(true);
    try {
      if (vidModal.mode === 'edit') {
        const editingId = vidModal.data?._id;
        const res = await API.put(`/videos/${editingId}`, payload);
        if (res.data.success) {
          showToast('Video updated successfully');
          setVidModal({ open: false, mode: 'add', data: null });
          fetchVideos();
          fetchCategories();
        }
      } else {
        const res = await API.post('/videos', payload);
        if (res.data.success) {
          showToast('Video created successfully');
          setVidModal({ open: false, mode: 'add', data: null });
          fetchVideos();
          fetchCategories();
        }
      }
    } catch (err) {
      console.error('Save video error:', err);
      showToast(err.response?.data?.message || 'Failed to save video', 'error');
    } finally {
      setVidSaving(false);
    }
  };

  const handleDeleteVideo = async (vid) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        const res = await API.delete(`/videos/${vid._id}`);
        if (res.data.success) {
          showToast('Video deleted successfully');
          fetchVideos();
          fetchCategories();
        }
      } catch (err) {
        console.error('Delete video error:', err);
        showToast(err.response?.data?.message || 'Failed to delete video', 'error');
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24 md:pt-28 pb-12 md:pb-16 px-4 md:px-12 select-none">
      {/* Toast Alert */}
      {toast.text && (
        <div
          className={`fixed top-24 right-4 sm:right-6 z-50 p-4 rounded-xl flex items-center space-x-2 text-xs border shadow-2xl transition-all duration-300 animate-slide-in max-w-[90vw] ${
            toast.type === 'error'
              ? 'bg-red-950/95 border-red-500/20 text-red-400'
              : 'bg-green-950/95 border-green-500/20 text-green-400'
          }`}
          id="admin-toast-message"
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
          )}
          <span className="truncate">{toast.text}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-10 md:space-y-12">
        {/* Categories Section */}
        <div className="space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4 gap-4">
            <div>
              <h2 className="text-lg md:text-2xl font-display font-extrabold uppercase tracking-wider text-white">Categories</h2>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">Manage film collections</p>
            </div>
            <button
              onClick={openAddCategory}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white text-black px-5 py-3 md:py-2.5 rounded-xl min-h-[44px] text-sm md:text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors cursor-pointer shadow-md"
              id="add-category-btn"
            >
              <PlusCircle className="w-5 h-5 md:w-4 md:h-4" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="bg-neutral-950 border border-white/5 rounded-xl overflow-hidden shadow-2xl">
            {loadingCats ? (
              <div className="p-8 flex items-center justify-center space-x-2 text-neutral-400 text-xs font-light">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading Categories...</span>
              </div>
            ) : categories.length > 0 ? (
              <>
                {/* Mobile Card List */}
                <div className="block sm:hidden space-y-4 p-4">
                  {categories.map((cat) => (
                    <div key={cat._id} className="bg-neutral-900/40 border border-white/5 p-4 rounded-xl space-y-4 shadow-sm">
                      <div className="aspect-video rounded-lg overflow-hidden border border-white/10">
                        <img src={cat.coverImage} alt={cat.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-base font-bold text-white truncate">{cat.name}</span>
                        <span className="text-xs bg-white/5 border border-white/5 px-2.5 py-1 rounded-full font-mono text-neutral-400 flex-shrink-0">
                          {cat.videoCount || 0} {cat.videoCount === 1 ? 'Video' : 'Videos'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <button
                          onClick={() => openEditCategory(cat)}
                          className="flex items-center justify-center space-x-2 border border-white/10 hover:border-white/30 rounded-xl min-h-[44px] text-sm font-semibold text-neutral-300 hover:text-white cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="flex items-center justify-center space-x-2 border border-red-500/10 hover:border-red-500/30 rounded-xl min-h-[44px] text-sm font-semibold text-red-400 hover:text-red-300 cursor-pointer bg-red-950/10"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs font-light">
                    <thead>
                      <tr className="border-b border-white/5 text-neutral-500 font-semibold uppercase tracking-wider">
                        <th className="px-6 py-4">Cover Image</th>
                        <th className="px-6 py-4">Category Name</th>
                        <th className="px-6 py-4">Total Videos</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {categories.map((cat) => (
                        <tr key={cat._id} className="hover:bg-white/2 transition-colors">
                          <td className="px-6 py-4">
                            <img
                              src={cat.coverImage}
                              alt={cat.name}
                              className="w-20 aspect-video object-cover rounded border border-white/10 shadow-inner"
                            />
                          </td>
                          <td className="px-6 py-4 font-semibold text-white text-sm">{cat.name}</td>
                          <td className="px-6 py-4 text-neutral-400 font-mono font-medium">{cat.videoCount || 0}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-3">
                              <button
                                onClick={() => openEditCategory(cat)}
                                className="p-2 border border-white/10 hover:border-white/30 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer min-h-[36px] flex items-center justify-center"
                                title="Edit Category"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat)}
                                className="p-2 border border-white/10 hover:border-red-500/30 rounded-lg text-neutral-400 hover:text-red-400 transition-colors cursor-pointer min-h-[36px] flex items-center justify-center"
                                title="Delete Category"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-xs text-neutral-500 font-light">
                No categories created yet. Click "Add Category" to create one.
              </div>
            )}
          </div>
        </div>

        {/* Videos Section */}
        <div className="space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4 gap-4">
            <div>
              <h2 className="text-lg md:text-2xl font-display font-extrabold uppercase tracking-wider text-white">Videos</h2>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">Manage film showcases</p>
            </div>
            <button
              onClick={openAddVideo}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white text-black px-5 py-3 md:py-2.5 rounded-xl min-h-[44px] text-sm md:text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors cursor-pointer shadow-md disabled:opacity-50"
              id="add-video-btn"
              disabled={categories.length === 0}
              title={categories.length === 0 ? 'Create a category first before adding videos' : ''}
            >
              <PlusCircle className="w-5 h-5 md:w-4 md:h-4" />
              <span>Add Video</span>
            </button>
          </div>

          <div className="bg-neutral-950 border border-white/5 rounded-xl overflow-hidden shadow-2xl">
            {loadingVids ? (
              <div className="p-8 flex items-center justify-center space-x-2 text-neutral-400 text-xs font-light">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading Videos...</span>
              </div>
            ) : videos.length > 0 ? (
              <>
                {/* Mobile Card List */}
                <div className="block sm:hidden space-y-4 p-4">
                  {videos.map((vid) => (
                    <div key={vid._id} className="bg-neutral-900/40 border border-white/5 p-4 rounded-xl space-y-4 shadow-sm">
                      <div className="aspect-video rounded-lg overflow-hidden border border-white/10">
                        <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="space-y-1">
                        <span className="block text-base font-bold text-white truncate pr-2">{vid.title}</span>
                        <span className="inline-block text-xs bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-full uppercase font-semibold text-neutral-300">
                          {vid.category?.name || (categories.find(c => c._id === vid.category)?.name) || 'Unassigned'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <button
                          onClick={() => openEditVideo(vid)}
                          className="flex items-center justify-center space-x-2 border border-white/10 hover:border-white/30 rounded-xl min-h-[44px] text-sm font-semibold text-neutral-300 hover:text-white cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteVideo(vid)}
                          className="flex items-center justify-center space-x-2 border border-red-500/10 hover:border-red-500/30 rounded-xl min-h-[44px] text-sm font-semibold text-red-400 hover:text-red-300 cursor-pointer bg-red-950/10"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs font-light">
                    <thead>
                      <tr className="border-b border-white/5 text-neutral-500 font-semibold uppercase tracking-wider">
                        <th className="px-6 py-4">Thumbnail</th>
                        <th className="px-6 py-4">Title</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {videos.map((vid) => (
                        <tr key={vid._id} className="hover:bg-white/2 transition-colors">
                          <td className="px-6 py-4">
                            <img
                              src={vid.thumbnail}
                              alt={vid.title}
                              className="w-20 aspect-video object-cover rounded border border-white/10 shadow-inner"
                            />
                          </td>
                          <td className="px-6 py-4 font-semibold text-white text-sm">{vid.title}</td>
                          <td className="px-6 py-4 text-neutral-400">
                            <span className="bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-full text-[10px] tracking-wide uppercase font-semibold text-neutral-300">
                              {vid.category?.name || (categories.find(c => c._id === vid.category)?.name) || 'Unassigned'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-3">
                              <button
                                onClick={() => openEditVideo(vid)}
                                className="p-2 border border-white/10 hover:border-white/30 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer min-h-[36px] flex items-center justify-center"
                                title="Edit Video"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteVideo(vid)}
                                className="p-2 border border-white/10 hover:border-red-500/30 rounded-lg text-neutral-400 hover:text-red-400 transition-colors cursor-pointer min-h-[36px] flex items-center justify-center"
                                title="Delete Video"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-xs text-neutral-500 font-light">
                {categories.length === 0
                  ? 'Please create a category first before adding videos.'
                  : 'No videos created yet. Click "Add Video" to add one.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Category Modal --- */}
      {catModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 sm:p-6 animate-fade-in">
          <div className="bg-neutral-950 border border-white/10 p-5 sm:p-8 rounded-xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto space-y-6 relative shadow-2xl animate-scale-up">
            <button
              onClick={() => setCatModal({ open: false, mode: 'add', data: null })}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors cursor-pointer p-1 min-w-[36px] min-h-[36px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1.5 border-b border-white/5 pb-3">
              <h3 className="text-lg sm:text-xl uppercase tracking-wider font-extrabold font-display text-white">
                {catModal.mode === 'edit' ? 'Modify Category' : 'Add Category'}
              </h3>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-0.5">
                Category details and showcase cover
              </p>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold block">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-700 focus:outline-none focus:border-white/30 transition-colors min-h-[44px]"
                  placeholder="e.g. Narrative Films"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold block">
                  Cover Image
                </label>
                {catCoverImage ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-white/15 group max-w-full">
                    <img src={catCoverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setCatCoverImage('')}
                      className="absolute top-2.5 right-2.5 bg-black/80 text-red-400 hover:text-red-300 p-2.5 rounded-full transition-colors border border-white/5 cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-white/10 hover:border-white/20 rounded-xl aspect-video flex flex-col items-center justify-center p-6 transition-colors max-w-full">
                    <div className="bg-neutral-900 border border-white/5 p-3 rounded-full mb-2.5">
                      <Upload className="w-6 h-6 text-neutral-400" />
                    </div>
                    <label className="text-sm font-bold cursor-pointer text-white underline hover:text-neutral-300 min-h-[44px] flex items-center justify-center px-4">
                      Upload Cover Image
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, setCatCoverImage, setCatUploading)}
                        disabled={catUploading}
                      />
                    </label>
                    <span className="text-[10px] text-neutral-500 mt-1 uppercase tracking-widest font-light">
                      PNG, JPG up to 10MB
                    </span>
                  </div>
                )}

                {catUploading && (
                  <div className="flex items-center space-x-2 text-xs text-neutral-400 animate-pulse pt-1">
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Uploading Cover Image to R2...</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setCatModal({ open: false, mode: 'add', data: null })}
                  className="w-full sm:w-auto border border-white/10 hover:border-white/30 px-5 py-3 sm:py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer text-neutral-300 hover:text-white min-h-[44px] flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={catSaving || catUploading}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white text-black px-5 py-3 sm:py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors disabled:opacity-50 cursor-pointer min-h-[44px]"
                >
                  {catSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Video Modal --- */}
      {vidModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 sm:p-6 animate-fade-in">
          <div className="bg-neutral-950 border border-white/10 p-5 sm:p-8 rounded-xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-6 relative shadow-2xl animate-scale-up">
            <button
              onClick={() => setVidModal({ open: false, mode: 'add', data: null })}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors cursor-pointer p-1 min-w-[36px] min-h-[36px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1.5 border-b border-white/5 pb-3">
              <h3 className="text-lg sm:text-xl uppercase tracking-wider font-extrabold font-display text-white">
                {vidModal.mode === 'edit' ? 'Modify Video' : 'Add Video'}
              </h3>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-0.5">
                Video details and file linkage mappings
              </p>
            </div>

            <form onSubmit={handleVideoSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold block">
                  Video Title
                </label>
                <input
                  type="text"
                  required
                  value={vidTitle}
                  onChange={(e) => setVidTitle(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-700 focus:outline-none focus:border-white/30 transition-colors min-h-[44px]"
                  placeholder="e.g. Wedding Highlight Reel"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold block">
                  Category Mapping
                </label>
                <select
                  required
                  value={vidCategory}
                  onChange={(e) => setVidCategory(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors min-h-[44px]"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold block">
                  Video URL
                </label>
                <input
                  type="url"
                  required
                  value={vidVideoUrl}
                  onChange={(e) => setVidVideoUrl(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-700 focus:outline-none focus:border-white/30 transition-colors min-h-[44px]"
                  placeholder="e.g. https://drive.google.com/file/d/.../view"
                />
                <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-light block mt-1">
                  Accepts Google Drive Preview URL or direct MP4 URL
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold block">
                  Thumbnail
                </label>
                {vidThumbnail ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-white/15 group max-w-full">
                    <img src={vidThumbnail} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setVidThumbnail('')}
                      className="absolute top-2.5 right-2.5 bg-black/80 text-red-400 hover:text-red-300 p-2.5 rounded-full transition-colors border border-white/5 cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-white/10 hover:border-white/20 rounded-xl aspect-video flex flex-col items-center justify-center p-6 transition-colors max-w-full">
                    <div className="bg-neutral-900 border border-white/5 p-3 rounded-full mb-2.5">
                      <Upload className="w-6 h-6 text-neutral-400" />
                    </div>
                    <label className="text-sm font-bold cursor-pointer text-white underline hover:text-neutral-300 min-h-[44px] flex items-center justify-center px-4">
                      Upload Thumbnail
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, setVidThumbnail, setVidUploading)}
                        disabled={vidUploading}
                      />
                    </label>
                    <span className="text-[10px] text-neutral-500 mt-1 uppercase tracking-widest font-light">
                      PNG, JPG up to 10MB
                    </span>
                  </div>
                )}

                {vidUploading && (
                  <div className="flex items-center space-x-2 text-xs text-neutral-400 animate-pulse pt-1">
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Uploading Thumbnail to R2...</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setVidModal({ open: false, mode: 'add', data: null })}
                  className="w-full sm:w-auto border border-white/10 hover:border-white/30 px-5 py-3 sm:py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer text-neutral-300 hover:text-white min-h-[44px] flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={vidSaving || vidUploading}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-white text-black px-5 py-3 sm:py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors disabled:opacity-50 cursor-pointer min-h-[44px]"
                >
                  {vidSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
