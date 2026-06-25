import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PlusCircle, Edit, Trash2, X, Upload, Save, CheckCircle, ArrowLeft, Eye, Search, ArrowUpDown, RefreshCw } from 'lucide-react';
import API from '../../services/api';

const CategoryManager = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  
  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [order, setOrder] = useState(0);
  const [active, setActive] = useState(true);
  
  // Status hooks
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showForm, setShowForm] = useState(false);

  // Upload Progress & Retry
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);

  // Search, Sorting, and Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('order'); // name, videoCount, createdAt, order
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Load categories
  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await API.get('/categories'); // Loads all categories for admin
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      showToast('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    // Check search params if starting in add mode
    if (searchParams.get('action') === 'add') {
      setShowForm(true);
      setSearchParams({}); // Clear param after triggering
    }
  }, [searchParams]);

  const showToast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleEditClick = (cat) => {
    setEditingId(cat._id);
    setName(cat.name);
    setDescription(cat.description || '');
    setCoverImage(cat.coverImage);
    setOrder(cat.order || 0);
    setActive(cat.active);
    setShowForm(true);
    // Reset file upload states
    setUploadProgress(0);
    setUploadError(null);
    setPendingFile(null);
  };

  const handleCancelForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setCoverImage('');
    setOrder(0);
    setActive(true);
    setShowForm(false);
    setUploadProgress(0);
    setUploadError(null);
    setPendingFile(null);
  };

  // Image Upload handler
  const handleImageUpload = async (e) => {
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
        setCoverImage(res.data.url);
        showToast('Image uploaded successfully!');
      }
    } catch (err) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      setUploadError('Upload failed. R2 might be misconfigured.');
      console.error('Upload error:', err);
      showToast(err.response?.data?.message || 'Failed to upload cover photo', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Submit Handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!name || !coverImage) {
      showToast('Name and Cover Image are required fields', 'error');
      return;
    }

    const payload = { name, description, coverImage, order: Number(order), active };
    
    setSaving(true);
    try {
      if (editingId) {
        // Update category
        const res = await API.put(`/categories/${editingId}`, payload);
        if (res.data.success) {
          showToast('Category updated successfully!');
          handleCancelForm();
          loadCategories();
        }
      } else {
        // Create category
        const res = await API.post('/categories', payload);
        if (res.data.success) {
          showToast('Category created successfully!');
          handleCancelForm();
          loadCategories();
        }
      }
    } catch (err) {
      console.error('Save category error:', err);
      showToast(err.response?.data?.message || 'Failed to save category', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete Handler
  const handleDeleteCategory = async (id, forceCascade = false) => {
    const confirmMsg = forceCascade 
      ? 'Are you sure you want to FORCE delete this category and ALL its associated videos? This cannot be undone.'
      : 'Are you sure you want to delete this category?';
    
    if (!window.confirm(confirmMsg)) return;

    try {
      const url = forceCascade ? `/categories/${id}?cascade=true` : `/categories/${id}`;
      const res = await API.delete(url);
      if (res.data.success) {
        showToast(forceCascade ? 'Category and all associated videos deleted!' : 'Category deleted successfully!');
        loadCategories();
      }
    } catch (err) {
      console.error('Delete category error:', err);
      if (err.response?.data?.hasVideos) {
        const count = err.response.data.videosCount;
        if (window.confirm(`This category contains ${count} videos. Deleting it directly will fail unless you also delete all associated videos.\n\nDo you want to delete all ${count} videos and delete this category?`)) {
          handleDeleteCategory(id, true);
        }
      } else {
        showToast(err.response?.data?.message || 'Failed to delete category', 'error');
      }
    }
  };

  // Search and Sort calculations
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
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

  const filteredCategories = categories.filter((cat) => {
    const search = searchTerm.toLowerCase();
    return (
      cat.name.toLowerCase().includes(search) ||
      (cat.description && cat.description.toLowerCase().includes(search))
    );
  });

  const sortedCategories = [...filteredCategories].sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    if (sortBy === 'name') {
      valA = (a.name || '').toLowerCase();
      valB = (b.name || '').toLowerCase();
    } else if (sortBy === 'createdAt') {
      valA = new Date(a.createdAt || 0).getTime();
      valB = new Date(b.createdAt || 0).getTime();
    } else if (sortBy === 'videoCount') {
      valA = a.videoCount || 0;
      valB = b.videoCount || 0;
    } else {
      // order / other numbers
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination calculations
  const totalItems = sortedCategories.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCategories = sortedCategories.slice(startIndex, startIndex + itemsPerPage);

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
            <h1 className="text-2xl uppercase tracking-wider font-extrabold font-display">Category Management</h1>
          </div>
          
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center justify-center space-x-2 bg-white text-black px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-colors"
              id="new-category-btn"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Category</span>
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

        {/* Add/Edit Category Form Slider */}
        {showForm && (
          <div className="bg-neutral-950 border border-white/5 p-6 md:p-8 rounded-xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-base uppercase tracking-wider font-extrabold font-display">
                {editingId ? 'Modify Category' : 'Create Category'}
              </h3>
              <button onClick={handleCancelForm} className="text-neutral-500 hover:text-white transition-colors" id="close-form-btn">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="cat-name-input" className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Category Name</label>
                  <input
                    id="cat-name-input"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-white/30 transition-colors"
                    placeholder="E.g. Wedding Documentaries"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="cat-desc-input" className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Description</label>
                  <textarea
                    id="cat-desc-input"
                    rows="3"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-white/30 transition-colors resize-none"
                    placeholder="Brief collection summary details..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="cat-order-input" className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Order Number</label>
                    <input
                      id="cat-order-input"
                      type="number"
                      required
                      value={order}
                      onChange={(e) => setOrder(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-white/30 transition-colors"
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="cat-active-select" className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Active Status</label>
                    <select
                      id="cat-active-select"
                      value={active}
                      onChange={(e) => setActive(e.target.value === 'true')}
                      className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                    >
                      <option value="true">Active (Show on Menu)</option>
                      <option value="false">Inactive (Hidden)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Cover photo upload layout */}
              <div className="space-y-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Cover Image Photo</label>
                  
                  {coverImage ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-white/15 group">
                      <img src={coverImage} alt="Preview Cover" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setCoverImage('')}
                        className="absolute top-2 right-2 bg-black/85 text-red-400 hover:text-red-300 p-2 rounded-full transition-colors border border-white/5"
                        id="remove-cover-btn"
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
                        <label htmlFor="cover-upload" className="text-xs font-semibold cursor-pointer text-white underline hover:text-neutral-300" id="cover-upload-label">
                          Upload cover image
                        </label>
                        <input id="cover-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
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
                        onClick={() => handleImageUpload(pendingFile)}
                        className="text-[10px] bg-red-900/40 text-red-200 border border-red-500/20 px-2.5 py-1 rounded hover:bg-red-800/60 transition-all font-semibold uppercase tracking-wider flex items-center space-x-1"
                        id="retry-upload-btn"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                    </div>
                  )}
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
                    <span>{saving ? 'Saving...' : 'Save Category'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Categories List Table & Tools */}
        <div className="bg-neutral-950 border border-white/5 rounded-xl p-6 space-y-6">
          
          {/* Table Actions / Filter Row */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search filter */}
            <div className="relative w-full md:max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-neutral-500" />
              </span>
              <input
                id="category-search-input"
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search categories by name or description..."
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

            {/* Items Per Page dropdown */}
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
            <p className="text-xs text-neutral-500 animate-pulse">Loading categories list...</p>
          ) : paginatedCategories.length > 0 ? (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-light">
                  <thead>
                    <tr className="border-b border-white/5 text-neutral-500 font-semibold uppercase tracking-wider select-none">
                      <th className="pb-3">Cover</th>
                      <th className="pb-3 cursor-pointer hover:text-white transition-colors" onClick={() => triggerSort('name')}>
                        <div className="flex items-center space-x-1">
                          <span>Name</span>
                          <ArrowUpDown className="w-3 h-3 text-neutral-600" />
                        </div>
                      </th>
                      <th className="pb-3 cursor-pointer hover:text-white transition-colors" onClick={() => triggerSort('videoCount')}>
                        <div className="flex items-center space-x-1">
                          <span>Video Count</span>
                          <ArrowUpDown className="w-3 h-3 text-neutral-600" />
                        </div>
                      </th>
                      <th className="pb-3 cursor-pointer hover:text-white transition-colors" onClick={() => triggerSort('createdAt')}>
                        <div className="flex items-center space-x-1">
                          <span>Created Date</span>
                          <ArrowUpDown className="w-3 h-3 text-neutral-600" />
                        </div>
                      </th>
                      <th className="pb-3 cursor-pointer hover:text-white transition-colors" onClick={() => triggerSort('order')}>
                        <div className="flex items-center space-x-1">
                          <span>Order</span>
                          <ArrowUpDown className="w-3 h-3 text-neutral-600" />
                        </div>
                      </th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCategories.map((cat) => (
                      <tr key={cat._id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="py-4">
                          <img src={cat.coverImage} alt={cat.name} className="w-16 aspect-video object-cover rounded border border-white/10" />
                        </td>
                        <td className="py-4 font-semibold text-white">{cat.name}</td>
                        <td className="py-4 text-neutral-400 font-mono">{cat.videoCount || 0}</td>
                        <td className="py-4 text-neutral-400">{cat.createdAt ? new Date(cat.createdAt).toLocaleDateString() : 'N/A'}</td>
                        <td className="py-4 text-neutral-400 font-mono">{cat.order}</td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                            cat.active ? 'bg-green-950/40 text-green-400 border border-green-500/20' : 'bg-red-950/40 text-red-400 border border-red-500/20'
                          }`}>
                            {cat.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={`/admin/videos?category=${cat._id}`}
                              className="p-1.5 border border-white/10 hover:border-white/30 rounded text-neutral-400 hover:text-white transition-colors flex items-center space-x-1 text-[10px]"
                              title="View Videos"
                              id={`view-videos-${cat._id}`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">View Videos</span>
                            </Link>
                            <button
                              onClick={() => handleEditClick(cat)}
                              className="p-1.5 border border-white/10 hover:border-white/30 rounded text-neutral-400 hover:text-white transition-colors"
                              title="Edit"
                              id={`edit-cat-${cat._id}`}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat._id)}
                              className="p-1.5 border border-white/10 hover:border-red-900/40 rounded text-neutral-400 hover:text-red-400 hover:border-red-500/20 transition-colors"
                              title="Delete"
                              id={`delete-cat-${cat._id}`}
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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-white/5 pt-4 gap-4 text-xs">
                  <div className="text-neutral-500">
                    Showing <span className="font-semibold text-white">{startIndex + 1}</span> to{' '}
                    <span className="font-semibold text-white">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of{' '}
                    <span className="font-semibold text-white">{totalItems}</span> categories
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
              {searchTerm ? 'No categories matched your search term.' : 'No categories created yet. Click "New Category" to add one.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
