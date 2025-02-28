// src/server.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import morgan from 'morgan';
import mongoose from 'mongoose';
import 'dotenv/config';
import apiRoutes from './router';
import requireAuth from './middleware/require-auth';

const app = express();

// ================================
// Middleware
// ================================
app.use(
  cors({
    origin: '*', // For development only; restrict in production
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================================
// Static files and views
// ================================
app.set('view engine', 'ejs');
app.use(express.static('static'));
app.set('views', path.join(__dirname, '../src/views'));

// ================================
// Default Route
// ================================
app.get('/', (req, res) => {
  res.send('Hi');
});

// ================================
// PUBLIC ROUTES
// ================================
// For POST /api/auth => create user
app.use('/api/auth', apiRoutes);

// ================================
// PROTECTED ROUTES
// ================================
// All other /api/... routes require authentication
app.use(requireAuth);
app.use('/api', apiRoutes);

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
