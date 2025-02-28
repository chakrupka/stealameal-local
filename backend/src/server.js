// src/server.js

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import 'dotenv/config';
import router from './router'; // Import the actual Express Router
import requireAuth from './middleware/require-auth';

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
// Because router.js contains POST /auth and GET /auth, we can
// just mount the router on /api for everything.
// We do want to let "POST /api/auth" happen without token => see requireAuth logic
app.use('/api', router);

// ================================
// PROTECTED ROUTES
// ================================
// All other /api/... routes require authentication
// If you prefer to separate them, do:
app.use(requireAuth);
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
