import React, { useContext, useState } from 'react';
import { SettingsContext } from '../context/SettingsContext';

const Contact = () => {
  const { settings } = useContext(SettingsContext);
  
  // Contact Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  
  const [status, setStatus] = useState({
    submitting: false,
    success: false,
    error: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setStatus({ submitting: false, success: false, error: 'Please fill in all required fields' });
      return;
    }

    setStatus({ submitting: true, success: false, error: '' });
    
    // Simulate API request delay
    setTimeout(() => {
      setStatus({ submitting: false, success: true, error: '' });
      setFormData({ name: '', email: '', subject: '', message: '' });
      // Reset success status after 4 seconds
      setTimeout(() => setStatus((prev) => ({ ...prev, success: false })), 4000);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-28 pb-20 select-none">
      <div className="max-w-5xl mx-auto px-6 md:px-12 space-y-20">
        
        {/* Header Summary */}
        <div className="space-y-4 max-w-xl mx-auto text-center">
          <span className="text-[9px] uppercase tracking-[0.25em] text-neutral-500 font-bold">Book a Shoot</span>
          <h1 className="text-4xl md:text-5xl uppercase font-extrabold tracking-tight font-sans">Contact</h1>
          <p className="text-xs text-neutral-400 font-light leading-relaxed">
            Have a concept you want to bring to life? Send an inquiry or contact our studio director directly.
          </p>
        </div>

        {/* Contact Details and Minimal Form */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-20 items-start">
          
          {/* Details Column */}
          <div className="md:col-span-5 space-y-12">
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl uppercase font-extrabold font-sans">Get in touch</h2>
              <p className="text-neutral-500 text-xs font-light leading-relaxed">
                We generally respond to inquiries within 24 hours. For direct urgent shoots, use WhatsApp or call.
              </p>
            </div>

            <div className="space-y-8 text-xs font-light text-neutral-400">
              <div className="space-y-1" id="email-contact-box">
                <span className="block text-[8px] uppercase tracking-widest text-neutral-500 font-bold">Email Us</span>
                <a href={`mailto:${settings.contactEmail}`} className="text-white hover:text-neutral-300 transition-colors text-sm font-semibold">
                  {settings.contactEmail}
                </a>
              </div>

              <div className="space-y-1" id="phone-contact-box">
                <span className="block text-[8px] uppercase tracking-widest text-neutral-500 font-bold">Call Studio</span>
                <a href={`tel:${settings.contactPhone}`} className="text-white hover:text-neutral-300 transition-colors text-sm font-semibold">
                  {settings.contactPhone}
                </a>
              </div>

              <div className="space-y-1" id="address-contact-box">
                <span className="block text-[8px] uppercase tracking-widest text-neutral-500 font-bold">Location</span>
                <span className="text-neutral-300 text-xs leading-relaxed block max-w-xs">{settings.address}</span>
              </div>
            </div>

            {/* Flat links for Live Chats */}
            <div className="flex flex-col sm:flex-row gap-4 text-[10px] uppercase tracking-widest font-bold">
              {settings.socialLinks?.whatsapp && (
                <a
                  href={settings.socialLinks.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center border border-white/5 bg-[#171717] py-3 rounded-full text-white hover:bg-[#1f1f1f] hover:border-white/10 transition-all text-center"
                  id="whatsapp-chat-btn"
                >
                  WhatsApp
                </a>
              )}
              {settings.socialLinks?.instagram && (
                <a
                  href={settings.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center border border-white/5 bg-[#171717] py-3 rounded-full text-white hover:bg-[#1f1f1f] hover:border-white/10 transition-all text-center"
                  id="instagram-dm-btn"
                >
                  Instagram
                </a>
              )}
            </div>
          </div>

          {/* Form Column */}
          <div className="md:col-span-7 bg-[#171717] border border-white/5 rounded-[16px] p-8 md:p-10 shadow-2xl">
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <h3 className="text-xs uppercase tracking-wider font-extrabold border-b border-white/5 pb-4 text-white">
                Inquiry Sheet
              </h3>
              
              {status.error && (
                <div className="bg-red-950/20 border border-red-500/10 text-red-400 text-[10px] px-4 py-3 rounded">
                  {status.error}
                </div>
              )}

              {status.success && (
                <div className="bg-green-950/20 border border-green-500/10 text-green-400 text-[10px] px-4 py-3 rounded">
                  Inquiry sent successfully! We will reach out shortly.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label htmlFor="name-input" className="text-[9px] uppercase tracking-wider text-neutral-400 font-semibold block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name-input"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full bg-[#0A0A0A] border border-white/5 rounded px-4 py-3 text-xs text-white focus:outline-none focus:border-white/20 transition-colors"
                    placeholder="E.g. Sarah Connor"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label htmlFor="email-input" className="text-[9px] uppercase tracking-wider text-neutral-400 font-semibold block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email-input"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-[#0A0A0A] border border-white/5 rounded px-4 py-3 text-xs text-white focus:outline-none focus:border-white/20 transition-colors"
                    placeholder="E.g. sarah@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="subject-input" className="text-[9px] uppercase tracking-wider text-neutral-400 font-semibold block">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject-input"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full bg-[#0A0A0A] border border-white/5 rounded px-4 py-3 text-xs text-white focus:outline-none focus:border-white/20 transition-colors"
                  placeholder="E.g. Project Inquiry"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="message-textarea" className="text-[9px] uppercase tracking-wider text-neutral-400 font-semibold block">
                  Message Details
                </label>
                <textarea
                  id="message-textarea"
                  name="message"
                  required
                  rows="4"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full bg-[#0A0A0A] border border-white/5 rounded px-4 py-3 text-xs text-white focus:outline-none focus:border-white/20 transition-colors resize-none"
                  placeholder="Describe your project concept..."
                />
              </div>

              <button
                type="submit"
                disabled={status.submitting}
                className="w-full bg-white text-black font-bold uppercase tracking-widest text-[10px] py-4 rounded-full hover:bg-neutral-200 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                id="submit-inquiry-btn"
              >
                <span>{status.submitting ? 'Sending...' : "Let's Create Something Great"}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Google Map Embed section */}
        {settings.googleMapUrl && (
          <section className="w-full h-[350px] rounded-[16px] overflow-hidden border border-white/5 bg-black" id="location-map">
            <iframe
              src={settings.googleMapUrl}
              className="w-full h-full border-none filter invert brightness-90 contrast-[1.2] opacity-50 hover:opacity-80 transition-opacity"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Studio Location Google Map"
            />
          </section>
        )}
      </div>
    </div>
  );
};

export default Contact;
