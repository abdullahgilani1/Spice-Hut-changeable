const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
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

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();



// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5000',
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

const _dirname = path.resolve()

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.static(path.join(_dirname, "/frontend/dist")));
// app.get("*", (_, res) => {
//   res.sendFile(path.resolve(_dirname, "frontend", "dist", "index.html"))
// });

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