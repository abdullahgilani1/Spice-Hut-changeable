// Small script to quickly verify Atlas connectivity using MONGO_URI in backend/.env
const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_URI;

(async () => {
  if (!uri) {
    console.error('MONGO_URI not set. Copy backend/.env.example -> backend/.env and fill in your Atlas URI.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Connected to MongoDB Atlas successfully');

    // Show basic info: list databases (requires privileges)
    const admin = mongoose.connection.db.admin();
    const info = await admin.serverStatus();
    console.log('MongoDB server ok:', info.ok === 1 ? 'yes' : info);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Connection failed:', err.message);
    process.exit(1);
  }
})();
