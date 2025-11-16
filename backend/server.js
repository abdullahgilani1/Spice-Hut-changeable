const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from root directory as early as possible
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const customerRoutes = require('./routes/customerRoutes');
const profileRoutes = require('./routes/profileRoutes');
const orderRoutes = require('./routes/orderRoutes');
const menuRoutes = require('./routes/menuRoutes');
const contentRoutes = require('./routes/contentRoutes');
const branchRoutes = require('./routes/branchRoutes');
const utilsRoutes = require('./routes/utilsRoutes');
const cors = require('cors');

// Connect to database
connectDB();

const app = express();



// Middlewares
app.use(cors({
  origin: 'https://spicehut-8mqx.onrender.com',
  credentials: true,
})); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // To accept JSON data in the body

// API Routes

app.use('/api/auth', authRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/utils', utilsRoutes);


//short api to keep render alive
app.get("/ping", (req, res) => {
  res.status(200).send("OK");
});


const _dirname = path.resolve()

// Serve static files from uploads directory
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.static(path.join(_dirname, "/frontend/dist")));

// Serve React app for any non-API GET request so client-side routing works on refresh.
// Use a RegExp route to avoid path-to-regexp parsing issues with certain string patterns.
// This regexp matches any path that does NOT start with `/api`.
app.get(/^(?!\/api).*/, (req, res) => {
  // Only handle GET requests here; other methods should continue to their handlers.
  if (req.method !== 'GET') return res.status(405).end();

  // Serve the React app entrypoint so the client router can handle the path.
  res.sendFile(path.resolve(_dirname, 'frontend', 'dist', 'index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Generic error handler (catches multer and other errors and returns JSON)
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err && err.message ? err.message : err);
  const status = err && err.statusCode ? err.statusCode : 500;
  res.status(status).json({ message: err?.message || 'Server error' });
});