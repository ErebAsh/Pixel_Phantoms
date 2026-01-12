/**
 * Sample Express Server with Global Error Handling
 * 
 * This file demonstrates how to integrate the errorMiddleware.js
 * into your Express application for centralized error handling.
 * 
 * @module server
 */

const express = require('express');
const cors = require('cors');
const { 
  errorHandler, 
  notFoundHandler, 
  asyncHandler,
  ApiError 
} = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*',
  credentials: true,
}));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString() 
  });
});

// Example routes demonstrating error handling

// 1. Synchronous error example
app.get('/api/sync-error', (req, res) => {
  // This will be caught by the error middleware
  throw new ApiError(400, 'This is a synchronous error example');
});

// 2. Async error example using asyncHandler
app.get('/api/async-error', asyncHandler(async (req, res) => {
  // Simulate an async operation
  await new Promise(resolve => setTimeout(resolve, 100));
  // This will be caught by asyncHandler and passed to error middleware
  throw new ApiError(500, 'This is an async error example');
}));

// 3. Validation error example
app.post('/api/validate', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  const errors = [];
  if (!email) errors.push({ field: 'email', message: 'Email is required' });
  if (!password) errors.push({ field: 'password', message: 'Password is required' });
  
  if (errors.length > 0) {
    throw new ApiError(422, 'Validation failed', errors);
  }
  
  res.status(200).json({ 
    success: true, 
    message: 'Validation passed' 
  });
}));

// 4. Database error simulation
app.get('/api/database-error', asyncHandler(async (req, res) => {
  // Simulate a database connection error
  throw new ApiError(503, 'Database connection failed', [
    { code: 'DB_CONNECTION_ERROR', message: 'Unable to connect to database' }
  ]);
}));

// 5. Successful response example
app.get('/api/success', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Request successful',
    data: { 
      user: 'John Doe',
      role: 'admin' 
    }
  });
});

// Sample API routes (add your routes here)
// app.use('/api/users', userRoutes);
// app.use('/api/auth', authRoutes);

// 404 Handler - Must be placed after all other routes
app.use(notFoundHandler);

// Global Error Handler - Must be the last middleware
app.use(errorHandler);

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`Health check available at: http://localhost:${PORT}/health`);
  });
}

module.exports = app;
