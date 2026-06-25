import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Save, ArrowLeft, CheckCircle, Upload, Plus, Trash2, X, Sparkles, RefreshCw } from 'lucide-react';
import { SettingsContext } from '../../context/SettingsContext';
import API from '../../services/api';

const SettingsManager = () => {
  const { settings, refreshSettings } = useContext(SettingsContext);
  
  const [activeTab, setActiveTab] = useState('branding');

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [heroVideoUrl, setHeroVideoUrl] = useState('');
  const [heroHeading, setHeroHeading] = useState('');
  const [heroSubheading, setHeroSubheading] = useState('');
  
  // Socials
  const [instagram, setInstagram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [youtube, setYoutube] = useState('');
  const [facebook, setFacebook] = useState('');

  // Contacts
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [googleMapUrl, setGoogleMapUrl] = useState('');
  const [footerText, setFooterText] = useState('');

  // About Page configs
  const [aboutStory, setAboutStory] = useState('');
  const [aboutMission, setAboutMission] = useState('');
  const [aboutVision, setAboutVision] = useState('');
  
  // Equipment list
  const [aboutEquipment, setAboutEquipment] = useState([]);
  const [newEquipmentItem, setNewEquipmentItem] = useState('');

  // Team list
  const [aboutTeam, setAboutTeam] = useState([]);
  const [newMember, setNewMember] = useState({ name: '', role: '', image: '' });

  // Status hooks
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingMember, setUploadingMember] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Upload Progress & Retry states
  const [logoProgress, setLogoProgress] = useState(0);
  const [logoError, setLogoError] = useState(null);
  const [pendingLogoFile, setPendingLogoFile] = useState(null);

  const [memberProgress, setMemberProgress] = useState(0);
  const [memberError, setMemberError] = useState(null);
  const [pendingMemberFile, setPendingMemberFile] = useState(null);

  // Sync state with settings on mount/change
  useEffect(() => {
    if (settings) {
      setCompanyName(settings.companyName || '');
      setLogoUrl(settings.logoUrl || '');
      setHeroVideoUrl(settings.heroVideoUrl || '');
      setHeroHeading(settings.heroHeading || '');
      setHeroSubheading(settings.heroSubheading || '');
      
      setInstagram(settings.socialLinks?.instagram || '');
      setWhatsapp(settings.socialLinks?.whatsapp || '');
      setYoutube(settings.socialLinks?.youtube || '');
      setFacebook(settings.socialLinks?.facebook || '');

      setContactEmail(settings.contactEmail || '');
      setContactPhone(settings.contactPhone || '');
      setAddress(settings.address || '');
      setGoogleMapUrl(settings.googleMapUrl || '');
      setFooterText(settings.footerText || '');

      setAboutStory(settings.aboutStory || '');
      setAboutMission(settings.aboutMission || '');
      setAboutVision(settings.aboutVision || '');
      setAboutEquipment(settings.aboutEquipment || []);
      setAboutTeam(settings.aboutTeam || []);
    }
  }, [settings]);

  const showToast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  // Generic Image Upload
  const uploadImageFile = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const res = await API.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url;
  };

  const handleLogoUpload = async (e) => {
    const file = e && e.target ? e.target.files[0] : e;
    if (!file) return;

    setPendingLogoFile(file);
    setLogoError(null);
    setLogoProgress(10);
    setUploadingLogo(true);

    const progressInterval = setInterval(() => {
      setLogoProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 150);

    try {
      const url = await uploadImageFile(file);
      clearInterval(progressInterval);
      setLogoProgress(100);
      setTimeout(() => {
        setLogoProgress(0);
        setPendingLogoFile(null);
      }, 800);
      setLogoUrl(url);
      showToast('Logo uploaded to Cloudflare R2!');
    } catch (err) {
      clearInterval(progressInterval);
      setLogoProgress(0);
      setLogoError('Upload failed. R2 might be misconfigured.');
      console.error(err);
      showToast('Failed to upload logo image', 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleMemberImageUpload = async (e) => {
    const file = e && e.target ? e.target.files[0] : e;
    if (!file) return;

    setPendingMemberFile(file);
    setMemberError(null);
    setMemberProgress(10);
    setUploadingMember(true);

    const progressInterval = setInterval(() => {
      setMemberProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 150);

    try {
      const url = await uploadImageFile(file);
      clearInterval(progressInterval);
      setMemberProgress(100);
      setTimeout(() => {
        setMemberProgress(0);
        setPendingMemberFile(null);
      }, 800);
      setNewMember((prev) => ({ ...prev, image: url }));
      showToast('Member photo uploaded to Cloudflare R2!');
    } catch (err) {
      clearInterval(progressInterval);
      setMemberProgress(0);
      setMemberError('Upload failed. R2 might be misconfigured.');
      console.error(err);
      showToast('Failed to upload photo', 'error');
    } finally {
      setUploadingMember(false);
    }
  };

  // Equipment array methods
  const handleAddEquipment = (e) => {
    e.preventDefault();
    if (!newEquipmentItem.trim()) return;
    setAboutEquipment((prev) => [...prev, newEquipmentItem.trim()]);
    setNewEquipmentItem('');
  };

  const handleRemoveEquipment = (index) => {
    setAboutEquipment((prev) => prev.filter((_, i) => i !== index));
  };

  // Team array methods
  const handleAddTeamMember = (e) => {
    e.preventDefault();
    if (!newMember.name || !newMember.role || !newMember.image) {
      showToast('Please provide name, role and photo for team member', 'error');
      return;
    }
    setAboutTeam((prev) => [...prev, newMember]);
    setNewMember({ name: '', role: '', image: '' });
  };

  const handleRemoveTeamMember = (index) => {
    setAboutTeam((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Update
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      companyName,
      logoUrl,
      heroVideoUrl,
      heroHeading,
      heroSubheading,
      socialLinks: { instagram, whatsapp, youtube, facebook },
      contactEmail,
      contactPhone,
      address,
      googleMapUrl,
      footerText,
      aboutStory,
      aboutMission,
      aboutVision,
      aboutEquipment,
      aboutTeam,
    };

    try {
      const res = await API.put('/settings', payload);
      if (res.data.success) {
        showToast('Website configurations saved successfully!');
        refreshSettings();
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      showToast(err.response?.data?.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'branding', label: 'Branding & Hero' },
    { id: 'contact', label: 'Contact & Socials' },
    { id: 'about', label: 'About Story & Crew' },
  ];

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
            <h1 className="text-2xl uppercase tracking-wider font-extrabold font-display">System Settings</h1>
          </div>
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

        {/* Settings Tab controls */}
        <div className="flex border-b border-white/5 pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-xs uppercase tracking-wider font-bold transition-all border-b-2 -mb-[2px] ${
                activeTab === tab.id
                  ? 'border-white text-white font-extrabold'
                  : 'border-transparent text-neutral-500 hover:text-white'
              }`}
              id={`tab-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settings Form */}
        <form onSubmit={handleFormSubmit} className="bg-neutral-950 border border-white/5 rounded-xl p-6 md:p-8 space-y-8">
          
          {/* 1. Branding & Hero */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              <h3 className="text-base uppercase tracking-wider font-extrabold font-display border-b border-white/5 pb-3">Branding & Landing Info</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label htmlFor="company-name-input" className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Agency Name</label>
                  <input
                    id="company-name-input"
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-xs text-white focus:outline-none focus:border-white/30"
                    placeholder="E.g. TWOSHOT Studios"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Logo File (R2)</label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4">
                      {logoUrl ? (
                        <div className="relative h-12 w-28 bg-black rounded-lg border border-white/15 overflow-hidden flex items-center justify-center p-2">
                          <img src={logoUrl} alt="Logo preview" className="h-full w-auto object-contain" />
                          <button
                            type="button"
                            onClick={() => setLogoUrl('')}
                            className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-red-400 transition-opacity"
                            id="remove-logo-btn"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <label htmlFor="logo-upload" className="border border-white/10 hover:border-white/20 bg-black rounded-lg px-4 py-3 text-xs text-neutral-400 cursor-pointer block text-center flex-1" id="logo-upload-label">
                            <span>Upload Logo Image</span>
                          </label>
                          <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploadingLogo} />
                        </>
                      )}
                    </div>

                    {uploadingLogo && (
                      <div className="space-y-1.5" id="logo-progress-container">
                        <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden border border-white/5">
                          <div 
                            className="bg-white h-1.5 rounded-full transition-all duration-300" 
                            style={{ width: `${logoProgress}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[9px] text-neutral-400">
                          <span className="animate-pulse">Uploading logo to R2...</span>
                          <span>{logoProgress}%</span>
                        </div>
                      </div>
                    )}

                    {logoError && (
                      <div className="flex items-center justify-between bg-red-950/20 border border-red-500/10 p-3 rounded-lg" id="logo-error-container">
                        <p className="text-[10px] text-red-400 font-light">{logoError}</p>
                        <button
                          type="button"
                          onClick={() => handleLogoUpload(pendingLogoFile)}
                          className="text-[10px] bg-red-900/40 text-red-200 border border-red-500/20 px-2.5 py-1 rounded hover:bg-red-800/60 transition-all font-semibold uppercase tracking-wider flex items-center space-x-1"
                          id="retry-logo-upload-btn"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Retry</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="hero-video-url-input" className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Hero Background Video URL</label>
                <input
                  id="hero-video-url-input"
                  type="url"
                  required
                  value={heroVideoUrl}
                  onChange={(e) => setHeroVideoUrl(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-xs text-white focus:outline-none focus:border-white/30"
                  placeholder="Cinematic video link (direct MP4)"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="hero-heading-input" className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Hero Title Heading</label>
                <input
                  id="hero-heading-input"
                  type="text"
                  required
                  value={heroHeading}
                  onChange={(e) => setHeroHeading(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-xs text-white focus:outline-none focus:border-white/30"
                  placeholder="Transforming Moments Into Cinematic Stories"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="hero-subheading-input" className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Hero Subtitle Paragraph</label>
                <textarea
                  id="hero-subheading-input"
                  rows="3"
                  required
                  value={heroSubheading}
                  onChange={(e) => setHeroSubheading(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-xs text-white focus:outline-none focus:border-white/30 resize-none"
                  placeholder="Brief pitch overlay details..."
                />
              </div>
            </div>
          )}

          {/* 2. Contact & Socials */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <h3 className="text-base uppercase tracking-wider font-extrabold font-display border-b border-white/5 pb-3">Contact Details & Social Links</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label htmlFor="contact-email-input" className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Email Address</label>
                  <input
                    id="contact-email-input"
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-xs text-white focus:outline-none focus:border-white/30"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label htmlFor="contact-phone-input" className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Phone Number</label>
                  <input
                    id="contact-phone-input"
                    type="text"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-xs text-white focus:outline-none focus:border-white/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="footer-text-input" className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Footer Text Copyright</label>
                  <input
                    id="footer-text-input"
                    type="text"
                    required
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-xs text-white focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label htmlFor="address-input" className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Physical Address</label>
                  <input
                    id="address-input"
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-xs text-white focus:outline-none focus:border-white/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="google-map-url-input" className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Google Map iframe Embed link</label>
                  <input
                    id="google-map-url-input"
                    type="url"
                    value={googleMapUrl}
                    onChange={(e) => setGoogleMapUrl(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-xs text-white focus:outline-none focus:border-white/30"
                    placeholder="https://google.com/maps/embed?pb=..."
                  />
                </div>
              </div>

              <h4 className="text-xs uppercase tracking-wider font-extrabold font-display border-b border-white/5 pt-4 pb-2">Social Channels Mapping</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label htmlFor="instagram-url-input" className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Instagram URL</label>
                  <input
                    id="instagram-url-input"
                    type="url"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-xs text-white focus:outline-none"
                    placeholder="https://instagram.com/profile"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="whatsapp-url-input" className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">WhatsApp API link</label>
                  <input
                    id="whatsapp-url-input"
                    type="url"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-xs text-white focus:outline-none"
                    placeholder="https://wa.me/1234567890"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="youtube-url-input" className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Youtube Channel URL</label>
                  <input
                    id="youtube-url-input"
                    type="url"
                    value={youtube}
                    onChange={(e) => setYoutube(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="facebook-url-input" className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Facebook Page URL</label>
                  <input
                    id="facebook-url-input"
                    type="url"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. About Story & Crew */}
          {activeTab === 'about' && (
            <div className="space-y-8">
              <h3 className="text-base uppercase tracking-wider font-extrabold font-display border-b border-white/5 pb-3">About Story & Creative Crew</h3>
              
              <div className="space-y-1.5">
                <label htmlFor="about-story-textarea" className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Our Story Narrative</label>
                <textarea
                  id="about-story-textarea"
                  rows="5"
                  required
                  value={aboutStory}
                  onChange={(e) => setAboutStory(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-xs text-white focus:outline-none focus:border-white/30 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label htmlFor="about-mission-textarea" className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Mission Statement</label>
                  <textarea
                    id="about-mission-textarea"
                    rows="2"
                    required
                    value={aboutMission}
                    onChange={(e) => setAboutMission(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-xs text-white focus:outline-none focus:border-white/30 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="about-vision-textarea" className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Vision Statement</label>
                  <textarea
                    id="about-vision-textarea"
                    rows="2"
                    required
                    value={aboutVision}
                    onChange={(e) => setAboutVision(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-xs text-white focus:outline-none focus:border-white/30 resize-none"
                  />
                </div>
              </div>

              {/* Equipment management */}
              <div className="space-y-4">
                <h4 className="text-xs uppercase tracking-wider font-extrabold font-display border-b border-white/5 pb-2">Production Gear Rigs</h4>
                
                <div className="flex space-x-2">
                  <input
                    id="new-equipment-input"
                    type="text"
                    value={newEquipmentItem}
                    onChange={(e) => setNewEquipmentItem(e.target.value)}
                    className="bg-black border border-white/10 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none flex-1"
                    placeholder="E.g. RED V-Raptor 8K Camera"
                  />
                  <button
                    type="button"
                    onClick={handleAddEquipment}
                    className="bg-white text-black text-xs font-bold uppercase px-4 py-2.5 rounded-lg flex items-center space-x-1"
                    id="add-equipment-btn"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {aboutEquipment.map((eq, index) => (
                    <div key={index} className="flex items-center justify-between bg-black border border-white/5 px-4 py-2.5 rounded-lg">
                      <span className="text-xs text-neutral-300 truncate">{eq}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEquipment(index)}
                        className="text-neutral-500 hover:text-red-400 transition-colors p-1"
                        id={`remove-eq-${index}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team management */}
              <div className="space-y-4 pt-4">
                <h4 className="text-xs uppercase tracking-wider font-extrabold font-display border-b border-white/5 pb-2">Core Crew Members</h4>
                
                {/* Team member builder */}
                <div className="border border-white/5 bg-black/45 p-6 rounded-xl space-y-4">
                  <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold block">Create Crew Profile</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="member-name-input" className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Member Name</label>
                      <input
                        id="member-name-input"
                        type="text"
                        value={newMember.name}
                        onChange={(e) => setNewMember((prev) => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-black border border-white/10 rounded px-3 py-2 text-xs text-white placeholder-neutral-700"
                        placeholder="Member Full Name"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label htmlFor="member-role-input" className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Member Role</label>
                      <input
                        id="member-role-input"
                        type="text"
                        value={newMember.role}
                        onChange={(e) => setNewMember((prev) => ({ ...prev, role: e.target.value }))}
                        className="w-full bg-black border border-white/10 rounded px-3 py-2 text-xs text-white placeholder-neutral-700"
                        placeholder="Role / Title"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Member Photo</label>
                      <div className="space-y-2">
                        {newMember.image ? (
                          <div className="flex items-center justify-between border border-white/10 bg-black rounded px-3 py-2 text-xs">
                            <span className="truncate max-w-[120px] text-green-400">Photo Loaded</span>
                            <button
                              type="button"
                              onClick={() => setNewMember((prev) => ({ ...prev, image: '' }))}
                              className="text-red-400 hover:text-red-300"
                              id="remove-member-image-btn"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <label htmlFor="member-upload" className="border border-white/10 hover:border-white/20 bg-black rounded-lg px-3 py-2 text-xs text-neutral-400 cursor-pointer block text-center" id="member-upload-label">
                              <span>Upload Crew Photo</span>
                            </label>
                            <input id="member-upload" type="file" accept="image/*" onChange={handleMemberImageUpload} className="hidden" disabled={uploadingMember} />
                          </>
                        )}

                        {uploadingMember && (
                          <div className="space-y-1" id="member-progress-container">
                            <div className="w-full bg-neutral-900 rounded-full h-1 overflow-hidden border border-white/5">
                              <div 
                                className="bg-white h-1 rounded-full transition-all duration-300" 
                                style={{ width: `${memberProgress}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-[8px] text-neutral-400">
                              <span>Uploading...</span>
                              <span>{memberProgress}%</span>
                            </div>
                          </div>
                        )}

                        {memberError && (
                          <div className="flex items-center justify-between bg-red-950/20 border border-red-500/10 p-2 rounded" id="member-error-container">
                            <p className="text-[8px] text-red-400 truncate max-w-[100px]">{memberError}</p>
                            <button
                              type="button"
                              onClick={() => handleMemberImageUpload(pendingMemberFile)}
                              className="text-[8px] bg-red-900/40 text-red-200 border border-red-500/20 px-2 py-0.5 rounded hover:bg-red-800/60 transition-all font-semibold uppercase tracking-wider flex items-center space-x-1"
                              id="retry-member-upload-btn"
                            >
                              <RefreshCw className="w-2 h-2" />
                              <span>Retry</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleAddTeamMember}
                      className="bg-white text-black font-bold uppercase tracking-wider text-[10px] px-4 py-2 rounded flex items-center space-x-1"
                      id="assemble-member-btn"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Assemble Member</span>
                    </button>
                  </div>
                </div>

                {/* Team member list preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {aboutTeam.map((member, index) => (
                    <div key={index} className="relative group border border-white/5 bg-black rounded-lg p-4 flex items-center space-x-4">
                      <img src={member.image} alt={member.name} className="w-12 h-12 rounded-full object-cover border border-white/10" />
                      <div className="flex-1 min-w-0">
                        <span className="block font-bold text-xs uppercase tracking-wide text-white truncate">{member.name}</span>
                        <span className="block text-[10px] text-neutral-500 uppercase tracking-widest truncate">{member.role}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTeamMember(index)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 transition-all p-1"
                        id={`remove-member-${index}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="flex justify-end pt-6 border-t border-white/5">
            <button
              type="submit"
              disabled={saving || uploadingLogo || uploadingMember}
              className="flex items-center space-x-2 bg-white text-black px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors disabled:opacity-50 cursor-pointer"
              id="save-settings-btn"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Configurations...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsManager;
