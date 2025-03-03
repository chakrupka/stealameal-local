import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import router from './router';
import requireAuth from './middleware/require-auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 9090;

app.use(express.json());
app.use(cors());
app.use(morgan('dev')); // Logging

app.get('/', (req, res) => {
  res.json({
    message: 'API is running',
    documentation: 'See /api routes for available endpoints',
  });
});

// Extract the auth routes from router
// Public POST route (user creation)
app.post('/api/auth', (req, res, next) => {
  // For POST, we don't need auth - creating new users
  const originalUrl = req.originalUrl;
  const originalPath = req.path;

  // Adjust the path to match what router expects
  req.url = '/auth';
  router.handle(req, res, next);
});

// Protected GET route (user retrieval) - requires auth
app.get('/api/auth', requireAuth, (req, res, next) => {
  // For GET, we need auth - fetching existing user
  const originalUrl = req.originalUrl;
  const originalPath = req.path;

  // Adjust the path to match what router expects
  req.url = '/auth';
  router.handle(req, res, next);
});

// All other API routes - requires auth
app.use('/api', requireAuth, router);

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// Connect to MongoDB and start server
const connectAndStartServer = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/stealameal',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    );

    console.log('MongoDB connected successfully');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectAndStartServer();

export default app;
