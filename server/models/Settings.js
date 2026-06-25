const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  image: { type: String, required: true },
});

const settingsSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      default: 'TWOSHOT Studios',
    },
    logoUrl: {
      type: String,
      default: '',
    },
    heroVideoUrl: {
      type: String,
      default: 'https://assets.mixkit.co/videos/preview/mixkit-cinematic-forest-with-sunbeams-4837-large.mp4',
    },
    heroHeading: {
      type: String,
      default: 'Transforming Moments Into Cinematic Stories',
    },
    heroSubheading: {
      type: String,
      default: 'A premium video production agency dedicated to visual excellence, emotional storytelling, and state-of-the-art cinematic creations.',
    },
    socialLinks: {
      instagram: { type: String, default: 'https://instagram.com' },
      whatsapp: { type: String, default: 'https://wa.me/1234567890' },
      youtube: { type: String, default: 'https://youtube.com' },
      facebook: { type: String, default: 'https://facebook.com' },
    },
    contactEmail: {
      type: String,
      default: 'hello@twoshot.com',
    },
    contactPhone: {
      type: String,
      default: '+1 (555) 234-5678',
    },
    address: {
      type: String,
      default: '120 Awwwards Boulevard, Beverly Hills, CA 90210',
    },
    googleMapUrl: {
      type: String,
      default: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d105743.83401569421!2d-118.4907936173007!3d34.020730495816915!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c2bc047e29b7cf%3A0x111b06c5b2300b9a!2sBeverly%20Hills%2C%20CA!5e0!3m2!1sen!2sus!4v1710000000000!5m2!1sen!2sus',
    },
    footerText: {
      type: String,
      default: 'Transforming Moments Into Cinematic Stories. All rights reserved.',
    },
    aboutStory: {
      type: String,
      default: 'Founded in 2018, TWOSHOT Studios is a collective of visionary filmmakers, cinematic editors, and creative directors. We believe that every frame should tell a story and every story should evoke deep emotion. Over the years, we have worked with global brands, premium fashion labels, and private clients to capture moments that matter.',
    },
    aboutMission: {
      type: String,
      default: 'To create visually arresting, emotional, and timeless video content that elevated our clients stories to a high-art level.',
    },
    aboutVision: {
      type: String,
      default: 'To lead the next generation of creative filmmaking and premium visual content curation worldwide.',
    },
    aboutEquipment: {
      type: [String],
      default: [
        'RED V-Raptor 8K Cinema Camera',
        'Sony FX3 / FX6 Cinema Rig',
        'DJI Inspire 3 Drone with X9-8K Air Gimbal',
        'Arri Alexa Mini LF Packages',
        'Cooke Anamorphic / Full Frame Prime Lenses',
        'DaVinci Resolve Studio Color Grading Suite',
      ],
    },
    aboutTeam: {
      type: [teamMemberSchema],
      default: [
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
    },
  },
  { timestamps: true }
);

const MongooseSettings = mongoose.model('Settings', settingsSchema);
const MockSettings = require('../utils/mockModel')('settings', settingsSchema);

class SettingsProxy {
  constructor(data) {
    const Target = process.env.USE_MOCK_DB === 'true' ? MockSettings : MongooseSettings;
    return new Target(data);
  }

  static getTarget() {
    return process.env.USE_MOCK_DB === 'true' ? MockSettings : MongooseSettings;
  }

  static find(query) { return this.getTarget().find(query); }
  static findOne(query) { return this.getTarget().findOne(query); }
  static findById(id) { return this.getTarget().findById(id); }
  static create(data) { return this.getTarget().create(data); }
  static countDocuments(query) { return this.getTarget().countDocuments(query); }
  static findByIdAndUpdate(id, update, options) { return this.getTarget().findByIdAndUpdate(id, update, options); }
}

module.exports = SettingsProxy;
