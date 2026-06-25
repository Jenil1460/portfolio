import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Film, FolderOpen, HardDrive, PlusCircle, Settings as SettingsIcon, Video, LayoutDashboard, Clock, Eye } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';
import { StatsDashboardSkeleton } from '../../components/SkeletonLoader';

const Dashboard = () => {
  const { admin } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await API.get('/auth/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('Failed to fetch administrative metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Format bytes to readable string
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0.00 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1000) return `${mb.toFixed(2)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  // Merge the 5 most recently created videos and categories
  const getCombinedActivity = () => {
    if (!stats) return [];
    const videos = (stats.recentVideos || []).map(v => ({
      _id: v._id,
      title: v.title,
      type: 'video',
      createdAt: v.createdAt
    }));
    const categories = (stats.recentCategories || []).map(c => ({
      _id: c._id,
      title: c.name,
      type: 'category',
      createdAt: c.createdAt
    }));

    return [...videos, ...categories]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  };

  const combinedActivity = getCombinedActivity();

  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-16 px-6 md:px-12">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Welcome row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/5 pb-8 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 text-neutral-400">
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-[0.25em] font-semibold">Studio Panel</span>
            </div>
            <h1 className="text-3xl md:text-4xl uppercase font-extrabold tracking-tight font-display">
              Welcome, {admin?.name || 'Administrator'}
            </h1>
            <p className="text-xs text-neutral-500 font-light">
              Management system configuration for Twoshot Video Portfolio.
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Link
              to="/admin/videos?action=add"
              className="flex items-center space-x-2 bg-white text-black px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-colors"
              id="add-video-dashboard-link"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Video</span>
            </Link>
            <Link
              to="/admin/categories?action=add"
              className="flex items-center space-x-2 border border-white/10 hover:border-white/30 px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors"
              id="add-category-dashboard-link"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Category</span>
            </Link>
          </div>
        </div>

        {/* Dashboard Grid Modules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/admin/categories"
            className="glass-card p-6 rounded-xl border border-white/5 space-y-4 hover:border-white/10 transition-all flex items-center justify-between"
            id="manage-categories-card"
          >
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold block">Categories</span>
              <span className="text-xl font-display font-extrabold block uppercase">Category Management</span>
              <p className="text-[11px] text-neutral-400 font-light leading-relaxed">Add, modify, and set list orders for film showcase tabs.</p>
            </div>
            <FolderOpen className="w-10 h-10 text-white/20 flex-shrink-0 ml-4" />
          </Link>

          <Link
            to="/admin/videos"
            className="glass-card p-6 rounded-xl border border-white/5 space-y-4 hover:border-white/10 transition-all flex items-center justify-between"
            id="manage-videos-card"
          >
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold block">Videos</span>
              <span className="text-xl font-display font-extrabold block uppercase">Video Management</span>
              <p className="text-[11px] text-neutral-400 font-light leading-relaxed">Publish new titles, map URLs, adjust durations and upload thumbnails.</p>
            </div>
            <Film className="w-10 h-10 text-white/20 flex-shrink-0 ml-4" />
          </Link>

          <Link
            to="/admin/settings"
            className="glass-card p-6 rounded-xl border border-white/5 space-y-4 hover:border-white/10 transition-all flex items-center justify-between"
            id="manage-settings-card"
          >
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold block">Branding</span>
              <span className="text-xl font-display font-extrabold block uppercase">Settings Manager</span>
              <p className="text-[11px] text-neutral-400 font-light leading-relaxed">Modify contact records, WhatsApp tags, hero overlays, and crew bios.</p>
            </div>
            <SettingsIcon className="w-10 h-10 text-white/20 flex-shrink-0 ml-4" />
          </Link>
        </div>

        {/* Statistics Row */}
        {loading ? (
          <StatsDashboardSkeleton />
        ) : error ? (
          <div className="bg-red-950/20 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-lg" id="stats-error-display">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="stats-grid">
            <div className="bg-neutral-950 border border-white/5 rounded-xl p-6 space-y-2">
              <div className="flex items-center justify-between text-neutral-500">
                <span className="text-[10px] uppercase tracking-widest font-semibold">Total Categories</span>
                <FolderOpen className="w-4 h-4" />
              </div>
              <span className="text-3xl font-display font-extrabold block" id="total-categories-stat">{stats?.totalCategories}</span>
            </div>

            <div className="bg-neutral-950 border border-white/5 rounded-xl p-6 space-y-2">
              <div className="flex items-center justify-between text-neutral-500">
                <span className="text-[10px] uppercase tracking-widest font-semibold">Total Videos</span>
                <Video className="w-4 h-4" />
              </div>
              <span className="text-3xl font-display font-extrabold block" id="total-videos-stat">{stats?.totalVideos}</span>
            </div>

            <div className="bg-neutral-950 border border-white/5 rounded-xl p-6 space-y-2">
              <div className="flex items-center justify-between text-neutral-500">
                <span className="text-[10px] uppercase tracking-widest font-semibold">Images Uploaded</span>
                <HardDrive className="w-4 h-4" />
              </div>
              <span className="text-3xl font-display font-extrabold block" id="total-images-stat">{stats?.fileCount}</span>
            </div>

            <div className="bg-neutral-950 border border-white/5 rounded-xl p-6 space-y-2">
              <div className="flex items-center justify-between text-neutral-500">
                <span className="text-[10px] uppercase tracking-widest font-semibold">Storage Used (R2)</span>
                <HardDrive className="w-4 h-4" />
              </div>
              <span className="text-3xl font-display font-extrabold block" id="total-storage-stat">{formatBytes(stats?.storageUsed || 0)}</span>
            </div>
          </div>
        )}

        {/* Unified Bottom Activity Section */}
        {!loading && stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Unified Activity Log */}
            <div className="bg-neutral-950 border border-white/5 rounded-xl p-6 space-y-6" id="activity-log-widget">
              <div className="flex items-center space-x-2 border-b border-white/5 pb-3">
                <Clock className="w-4 h-4 text-neutral-500" />
                <h3 className="text-sm uppercase tracking-wider font-extrabold font-display">Latest Activity</h3>
              </div>
              
              {combinedActivity.length > 0 ? (
                <div className="space-y-4">
                  {combinedActivity.map((activity) => {
                    const isVideo = activity.type === 'video';
                    const icon = isVideo ? <Video className="w-3.5 h-3.5 text-neutral-400" /> : <FolderOpen className="w-3.5 h-3.5 text-neutral-400" />;
                    const typeLabel = isVideo ? 'Video Added' : 'Category Created';
                    const dateStr = new Date(activity.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    
                    return (
                      <div key={`${activity.type}-${activity._id}`} className="flex items-start justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0" id={`activity-item-${activity.type}-${activity._id}`}>
                        <div className="flex items-start space-x-3 min-w-0">
                          <div className="p-2 bg-neutral-900 border border-white/5 rounded-lg flex-shrink-0 mt-0.5">
                            {icon}
                          </div>
                          <div className="min-w-0">
                            <span className="block text-xs font-bold text-white truncate">
                              {activity.title}
                            </span>
                            <span className="block text-[10px] text-neutral-500 uppercase tracking-wider mt-0.5">
                              {typeLabel} • {dateStr}
                            </span>
                          </div>
                        </div>
                        <Link
                          to={isVideo ? `/admin/videos` : `/admin/categories`}
                          className="text-[10px] text-neutral-400 hover:text-white border border-white/10 hover:border-white/20 rounded px-2.5 py-1.5 transition-all uppercase tracking-wider font-semibold flex-shrink-0"
                          id={`manage-activity-btn-${activity.type}-${activity._id}`}
                        >
                          Manage
                        </Link>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-neutral-500 font-light">No recent activity detected.</p>
              )}
            </div>

            {/* Recent Video Uploads */}
            {stats.recentVideos && (
              <div className="bg-neutral-950 border border-white/5 rounded-xl p-6 space-y-6" id="recent-uploads-widget">
                <div className="flex items-center space-x-2 border-b border-white/5 pb-3">
                  <Film className="w-4 h-4 text-neutral-500" />
                  <h3 className="text-sm uppercase tracking-wider font-extrabold font-display">Recent Video Uploads</h3>
                </div>
                
                {stats.recentVideos.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-light" id="recent-uploads-table">
                      <thead>
                        <tr className="border-b border-white/5 text-neutral-500 font-semibold uppercase tracking-wider">
                          <th className="pb-3">Title</th>
                          <th className="pb-3">Category</th>
                          <th className="pb-3">Views</th>
                          <th className="pb-3">Date Added</th>
                          <th className="pb-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentVideos.map((vid) => (
                          <tr key={vid._id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors" id={`recent-vid-row-${vid._id}`}>
                            <td className="py-4 font-semibold text-white truncate max-w-[150px]">{vid.title}</td>
                            <td className="py-4 text-neutral-400">{vid.category?.name || 'Unassigned'}</td>
                            <td className="py-4 text-neutral-400">
                              <span className="flex items-center space-x-1 font-mono">
                                <Eye className="w-3.5 h-3.5" />
                                <span>{vid.views}</span>
                              </span>
                            </td>
                            <td className="py-4 text-neutral-400">
                              {new Date(vid.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </td>
                            <td className="py-4 text-right">
                              <Link
                                to={`/video/${vid._id}`}
                                className="text-white hover:text-neutral-300 border border-white/10 hover:border-white/30 rounded px-2.5 py-1 transition-all inline-block"
                                id={`watch-recent-btn-${vid._id}`}
                              >
                                Watch
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500 font-light">No videos uploaded yet.</p>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
