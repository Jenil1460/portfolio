require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { ensureBucketExists } = require('./config/r2');
const apiRoutes = require('./routes/api');

const app = express();

// Security and utility Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows displaying uploaded images on the frontend directly
}));
app.use(cors({
  origin: '*', // For development flexibility; can restrict in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(morgan('dev'));

// Database Seeding Logic
const seedDatabase = async () => {
  try {
    const Admin = require('./models/Admin');
    const Settings = require('./models/Settings');

    // 1. Seed Admin if empty
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      console.log('Seeding default administrator...');
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@twoshot.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword123';
      const adminName = process.env.ADMIN_NAME || 'Jenil Rachchh';

      await Admin.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'superadmin',
      });
      console.log(`Default administrator seeded successfully!`);
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
    }

    // 2. Seed Settings if empty
    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      console.log('Seeding default company settings...');
      await Settings.create({});
      console.log('Default company settings seeded successfully!');
    }
  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
};

// Initialize DB, Storage, and Seeding sequentially
const initializeServer = async () => {
  await connectDB();
  await ensureBucketExists();
  await seedDatabase();
};
initializeServer();

// API Routes
app.use('/api', apiRoutes);

// Static uploads mapping fallback
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Landing Page
app.get('/', (req, res) => {
  res.status(200).send(`
    <div style="font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #0A0A0A; color: #FFFFFF; text-align: center; padding: 20px; box-sizing: border-box; overflow: hidden; margin: -8px;">
      <h1 style="font-size: 2rem; letter-spacing: 0.25em; font-weight: 800; text-transform: uppercase; margin: 0;">RJ.TwoShot</h1>
      <span style="font-size: 0.75rem; letter-spacing: 0.2em; font-weight: 650; text-transform: uppercase; background-color: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.05); padding: 3px 8px; border-radius: 4px; color: #D4D4D4; margin-top: 12px; display: inline-block;">Portal API</span>
      <p style="color: #737373; max-width: 450px; font-size: 0.85rem; font-weight: 300; line-height: 1.6; margin-top: 20px; margin-bottom: 0;">
        The server is successfully running and connected to MongoDB Atlas.
      </p>
      <p style="color: #A3A3A3; font-size: 0.85rem; font-weight: 300; margin-top: 8px;">
        Please access the frontend site, or view <a href="/health" style="color: #FFFFFF; font-weight: bold; text-decoration: underline;">/health</a> to verify.
      </p>
    </div>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Twoshot Portfolio Server is healthy and running.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected server error occurred.',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
