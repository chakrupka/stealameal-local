// src/server.js

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import 'dotenv/config';
import router from './router';
import requireAuth from './middleware/require-auth';
import UserHandlers from './controllers/user_controller';

const app = express();

// ================================
// Middleware
// ================================
app.use(
  cors({
    origin: '*', // For dev only; restrict in production
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================================
// Default Route
// ================================
app.get('/', (req, res) => {
  res.send('Hi');
});

// ================================
// PUBLIC ROUTES
// ================================
// Only these specific routes should be accessible without authentication
app.post('/api/auth', UserHandlers.handleCreateUser); // Creating a user doesn't require auth

// ================================
// PROTECTED ROUTES
// ================================
// Apply authentication middleware to all other routes
// This ensures auth is checked before accessing protected routes
app.use('/api', requireAuth, (req, res, next) => {
  // Skip auth check again for user creation since we already defined that route
  if (req.path === '/auth' && req.method === 'POST') {
    return next('route'); // Skip to the next route handler
  }
  next(); // Continue to the router
});

// Mount the router after the auth middleware
app.use('/api', router);

// ================================
// MongoDB Connection
// ================================
const startServer = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
    await mongoose.connect(mongoURI);
    console.log(`Mongoose connected to: ${mongoURI}`);

    const port = process.env.PORT || 9090;
    app.listen(port, () => {
      console.log(`Listening on port ${port}`);
    });
  } catch (error) {
    console.error(error);
  }
};

startServer();
