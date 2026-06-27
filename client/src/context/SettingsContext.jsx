import React, { createContext, useState, useEffect } from 'react';
import API from '../services/api';

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    companyName: 'TWOSHOT Studios',
    logoUrl: '',
    heroVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-cinematic-forest-with-sunbeams-4837-large.mp4',
    heroHeading: 'Transforming Moments Into Cinematic Stories',
    heroSubheading: 'A premium video production agency dedicated to visual excellence, emotional storytelling, and state-of-the-art cinematic creations.',
    socialLinks: {
      instagram: 'https://instagram.com',
      whatsapp: 'https://wa.me/1234567890',
      youtube: 'https://youtube.com',
      facebook: 'https://facebook.com',
    },
    contactEmail: 'hello@twoshot.com',
    contactPhone: '+1 (555) 234-5678',
    address: '120 Awwwards Boulevard, Beverly Hills, CA 90210',
    googleMapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d105743.83401569421!2d-118.4907936173007!3d34.020730495816915!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c2bc047e29b7cf%3A0x111b06c5b2300b9a!2sBeverly%20Hills%2C%20CA!5e0!3m2!1sen!2sus!4v1710000000000!5m2!1sen!2sus',
    footerText: 'Transforming Moments Into Cinematic Stories. All rights reserved.',
    aboutStory: 'Founded in 2018, TWOSHOT Studios is a collective of visionary filmmakers, cinematic editors, and creative directors. We believe that every frame should tell a story and every story should evoke deep emotion. Over the years, we have worked with global brands, premium fashion labels, and private clients to capture moments that matter.',
    aboutMission: 'To create visually arresting, emotional, and timeless video content that elevated our clients stories to a high-art level.',
    aboutVision: 'To lead the next generation of creative filmmaking and premium visual content curation worldwide.',
    aboutEquipment: [
      'RED V-Raptor 8K Cinema Camera',
      'Sony FX3 / FX6 Cinema Rig',
      'DJI Inspire 3 Drone with X9-8K Air Gimbal',
      'Arri Alexa Mini LF Packages',
      'Cooke Anamorphic / Full Frame Prime Lenses',
      'DaVinci Resolve Studio Color Grading Suite',
    ],
    aboutTeam: [
      {
        name: 'Jenil Rachchh',
        role: 'Creative Director & Founder',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
      },
      {
        name: 'Sarah Connor',
        role: 'Lead Cinematographer',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
      },
      {
        name: 'David Vance',
        role: 'Chief Editor & Colorist',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
      },
    ],
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const response = await API.get('/settings');
      if (response.data.success) {
        setSettings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching global settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
