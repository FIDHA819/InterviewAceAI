import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import path from "path";
dotenv.config({
   path: path.resolve(process.cwd(), '.env'),
});
import authRoutes from './interfaces/routes/auth.routes.js';
import userRoutes from './interfaces/routes/user.routes.js';
import interviewRoutes from './interfaces/routes/interview.routes.js';  
import sessionRoutes from './interfaces/routes/session.routes.js';



const app = express();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use(
  "/uploads",
  express.static("uploads")
);
app.use('/api/interviews', interviewRoutes);                

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Connect DB then start server
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('DB connection failed:', err);
    process.exit(1);
  });