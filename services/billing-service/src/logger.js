// Shared logger for billing service (structured JSON — feeds ELK via Step 228)
const SERVICE_NAME = 'billing-service';

function log(level, message, context = {}) {
  console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
    JSON.stringify({ timestamp: new Date().toISOString(), level, service: SERVICE_NAME, message, ...context })
  );
}

module.exports = {
  info:  (msg, ctx) => log('info', msg, ctx),
  warn:  (msg, ctx) => log('warn', msg, ctx),
  error: (msg, ctx) => log('error', msg, ctx),
  debug: (msg, ctx) => log('debug', msg, ctx),
};
