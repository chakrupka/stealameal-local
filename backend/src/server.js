import express from 'express';
import cors from 'cors';
import path from 'path';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import apiRoutes from './router';

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());                   
app.use(express.urlencoded({ extended: true }));

// Static files and views
app.set('view engine', 'ejs');
app.use(express.static('static'));
app.set('views', path.join(__dirname, '../src/views'));

// Default Route
app.get('/', (req, res) => {
  res.send('Hi');
});

// API Routes
app.use('/api', apiRoutes);

// MongoDB Connection
const startServer = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stealameal_db';
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
