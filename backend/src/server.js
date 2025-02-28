import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import 'dotenv/config';
import router from './router';
import requireAuth from './middleware/require-auth';
import UserHandlers from './controllers/user_controller';

const app = express();

//middleware
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

app.get('/', (req, res) => {
  res.send('Hi');
});

//public routes.
app.post('/api/auth', UserHandlers.handleCreateUser); // Creating a user doesn't require auth
//protected routes
app.use('/api', requireAuth, (req, res, next) => {
  // Skip auth check again for user creation since we already defined that route
  if (req.path === '/auth' && req.method === 'POST') {
    return next('route');
  }
  next();
});

// Mount the router after the auth middleware
app.use('/api', router);

//mongo conntection
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
