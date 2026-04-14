// libs/shared/src/config/security.config.ts

import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/**
 * CORS Configuration
 *
 * Configures Cross-Origin Resource Sharing (CORS) to control which origins
 * can access the API. This is essential for browser-based applications.
 */
export const getCorsConfig = (): CorsOptions => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:4200',
        'http://localhost:8080',
      ];

  return {
    // List of allowed origins
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, curl)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }

      // Reject origin
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    },

    // Allowed HTTP methods
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    // Allowed headers
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-API-Key',
      'X-Tenant-ID',
      'Accept',
      'Origin',
    ],

    // Exposed headers (accessible to browser JavaScript)
    exposedHeaders: [
      'X-Total-Count',
      'X-Page-Count',
      'X-Request-ID',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],

    // Allow credentials (cookies, authorization headers)
    credentials: true,

    // Preflight request cache duration (in seconds)
    maxAge: 86400, // 24 hours

    // Allow preflight to succeed even for non-successful status codes
    preflightContinue: false,

    // Pass the CORS preflight response to the next handler
    optionsSuccessStatus: 204,
  };
};

/**
 * Helmet.js Configuration
 *
 * Configures security headers to protect against common web vulnerabilities.
 * Helmet sets various HTTP headers to improve security.
 */
export const getHelmetConfig = () => {
  return {
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },

    // Cross-Origin-Embedder-Policy
    crossOriginEmbedderPolicy: true,

    // Cross-Origin-Opener-Policy
    crossOriginOpenerPolicy: { policy: 'same-origin' },

    // Cross-Origin-Resource-Policy
    crossOriginResourcePolicy: { policy: 'same-origin' },

    // DNS Prefetch Control
    dnsPrefetchControl: { allow: false },

    // Frameguard (X-Frame-Options)
    frameguard: { action: 'deny' },

    // Hide Powered-By header
    hidePoweredBy: true,

    // HTTP Strict Transport Security (HSTS)
    hsts: {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true,
    },

    // IE No Open
    ieNoOpen: true,

    // Don't Sniff Mimetype
    noSniff: true,

    // Origin Agent Cluster
    originAgentCluster: true,

    // Permitted Cross-Domain Policies
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },

    // Referrer Policy
    referrerPolicy: { policy: 'no-referrer' },

    // X-XSS-Protection
    xssFilter: true,
  };
};

/**
 * Additional Security Headers
 *
 * Custom security headers that can be added manually
 */
export const additionalSecurityHeaders = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Prevent MIME sniffing
  'X-Content-Type-Options': 'nosniff',

  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',

  // Referrer policy
  'Referrer-Policy': 'no-referrer',

  // Permissions policy (formerly Feature Policy)
  'Permissions-Policy':
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()',

  // Cache control for sensitive data
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

/**
 * Rate Limit Headers
 *
 * Information about rate limiting that should be included in responses
 */
export const rateLimitHeaders = {
  enabled: true,
  headers: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
};

/**
 * Security Configuration for Different Environments
 */
export const getEnvironmentSecurityConfig = (environment: string = 'production') => {
  const baseConfig = {
    cors: getCorsConfig(),
    helmet: getHelmetConfig(),
    additionalHeaders: additionalSecurityHeaders,
  };

  // Environment-specific overrides
  switch (environment) {
    case 'development':
      return {
        ...baseConfig,
        cors: {
          ...baseConfig.cors,
          origin: true, // Allow all origins in development
        },
        helmet: {
          ...baseConfig.helmet,
          contentSecurityPolicy: false, // Disable CSP in development for easier debugging
        },
      };

    case 'test':
      return {
        ...baseConfig,
        cors: {
          ...baseConfig.cors,
          origin: true,
        },
        helmet: {
          ...baseConfig.helmet,
          contentSecurityPolicy: false,
        },
      };

    case 'staging':
    case 'production':
    default:
      return baseConfig;
  }
};

/**
 * Trusted Proxy Configuration
 *
 * Configure Express to trust proxy headers (important for load balancers)
 */
export const getTrustedProxyConfig = () => {
  const environment = process.env.NODE_ENV || 'development';

  if (environment === 'production' || environment === 'staging') {
    // In production, trust first proxy (load balancer)
    return 1;
  }

  // In development, don't trust any proxies
  return false;
};

/**
 * Session Security Configuration
 */
export const getSessionSecurityConfig = () => {
  return {
    secret: process.env.SESSION_SECRET || 'change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // Prevent XSS attacks
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict' as const, // CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };
};
