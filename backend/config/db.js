const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('\n[MONGO] Missing MONGO_URI environment variable.');
    console.error('Please create a `backend/.env` file (not committed) with a line like:');
    console.error("  MONGO_URI=mongodb+srv://<username>:<password>@cluster0.abcd.mongodb.net/<dbname>?retryWrites=true&w=majority\n");
    process.exit(1);
  }

  try {
    // Connect with the provided URI. Mongoose 8+ doesn't require the legacy options,
    // but specifying them does no harm for compatibility.
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('\n[MONGO] Connection error:', error.message);
    console.error('Double-check your MONGO_URI, username/password, and Atlas network access (IP whitelist).');
    console.error('If your password has special characters, URL-encode it with:');
    console.error("  [uri]::EscapeDataString('yourPassword')  (PowerShell)\n");
    process.exit(1);
  }
};

module.exports = connectDB;