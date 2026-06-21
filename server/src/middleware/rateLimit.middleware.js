const rateLimit = require('express-rate-limit');
const config = require('../config');
const logger = require('../services/logger/logger.service');

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
    });
  },
});

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again after 15 minutes',
    });
  },
});

// File upload rate limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: {
    success: false,
    message: 'Too many file uploads, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Upload rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
    });
    res.status(429).json({
      success: false,
      message: 'Too many file uploads, please try again later',
    });
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
  uploadLimiter,
};
