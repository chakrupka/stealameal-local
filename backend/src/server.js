// src/server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import router from './router';
import requireAuth from './middleware/require-auth';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 9090;

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev')); // Logging

// Test route to check if the server is running
app.get('/', (req, res) => {
  res.json({
    message: 'API is running',
    documentation: 'See /api routes for available endpoints',
  });
});

// Public route for authentication without token requirement
app.post('/api/auth', (req, res, next) => {
  router.handle(req, res, next);
});

// Protected routes - require authentication
app.use('/api', requireAuth, router);

// Error handling middleware
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
