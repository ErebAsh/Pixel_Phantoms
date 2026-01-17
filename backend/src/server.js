const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Load environment variables
// Load environment variables
const path = require('path');
const envResult = dotenv.config({ path: path.join(__dirname, '../../.env') });
if (envResult.error) {
  console.error('⚠️ Warning: Failed to load .env file:', envResult.error.message);
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Environment configuration is required in production');
  }
}

// Initialize Express app
const app = express();

// Configure CORS
const corsOptions = {
  origin: '*', // ALLOW EVERYTHING FOR DEBUGGING
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Middleware
app.use(helmet()); // Security headers
app.use(cors(corsOptions)); // Enable CORS with restrictions
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Database Sync
const sequelize = require('./config/database');
const User = require('./models/User');
const Event = require('./models/Event');
const Registration = require('./models/Registration');

sequelize.sync({ alter: true })
  .then(() => console.log('✅ Database synced successfully'))
  .catch(err => console.error('❌ Error syncing database:', err));

// Routes
const registrationRoutes = require('./routes/registrationRoutes');
app.use('/api/v1', registrationRoutes);

// Health Check Endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
});

// Error Handler
app.use((err, req, res, next) => {
  // Log errors appropriately based on environment
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  } else {
    console.error('Error:', err.message);
  }

  const statusCode = err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    status: 'error',
    message:
      isProduction && statusCode === 500
        ? 'Internal Server Error'
        : err.message || 'Internal Server Error',
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📧 Email System: ${process.env.EMAIL_USER ? '✅ Configured (' + process.env.EMAIL_USER + ')' : '❌ Not Configured'}`);
});

// Graceful shutdown handling
const gracefulShutdown = signal => {
  console.log(`\n⚠️ Received ${signal}. Shutting down gracefully...`);
  server.close(err => {
    if (err) {
      console.error('❌ Error during server shutdown:', err);
      process.exit(1);
    }
    console.log('✅ All connections closed. Exiting.');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
