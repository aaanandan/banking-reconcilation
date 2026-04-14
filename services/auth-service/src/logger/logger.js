// Step 228: Structured JSON Logger for Log Forwarding
// Outputs logs in JSON format for Filebeat → Logstash → Elasticsearch pipeline

const SERVICE_NAME = process.env.SERVICE_NAME || 'auth-service';
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = LEVELS[LOG_LEVEL] ?? LEVELS.info;

function formatLog(level, message, context = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    service: SERVICE_NAME,
    environment: NODE_ENV,
    message,
    ...context,
  });
}

const logger = {
  error: (message, context = {}) => {
    if (currentLevel >= LEVELS.error) {
      console.error(formatLog('error', message, context));
    }
  },
  warn: (message, context = {}) => {
    if (currentLevel >= LEVELS.warn) {
      console.warn(formatLog('warn', message, context));
    }
  },
  info: (message, context = {}) => {
    if (currentLevel >= LEVELS.info) {
      console.log(formatLog('info', message, context));
    }
  },
  debug: (message, context = {}) => {
    if (currentLevel >= LEVELS.debug) {
      console.log(formatLog('debug', message, context));
    }
  },

  // HTTP request logger middleware
  httpMiddleware: () => (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const level = res.statusCode >= 500 ? 'error'
        : res.statusCode >= 400 ? 'warn'
        : 'info';
      logger[level]('HTTP request', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: duration,
        tenantId: req.headers['x-tenant-id'] || null,
        requestId: req.headers['x-request-id'] || null,
        userAgent: req.headers['user-agent'] || null,
      });
    });
    next();
  },
};

module.exports = logger;
