// Step 230: Sentry Error Tracking Integration
// Banking Reconciliation Platform
// Install: npm install @sentry/node @sentry/profiling-node

const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');

function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.warn('[Sentry] SENTRY_DSN not set — error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.APP_VERSION || '1.0.0',

    integrations: [
      nodeProfilingIntegration(),
    ],

    // Capture 100% of transactions in dev, 10% in production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Before sending, attach tenant context if available
    beforeSend(event, hint) {
      // Scrub sensitive fields
      if (event.request && event.request.data) {
        const data = event.request.data;
        if (data.password) data.password = '[Filtered]';
        if (data.token) data.token = '[Filtered]';
        if (data.secret) data.secret = '[Filtered]';
      }
      return event;
    },
  });

  console.log(`[Sentry] Initialised — env: ${process.env.NODE_ENV}, release: ${process.env.APP_VERSION || '1.0.0'}`);
}

// Express error handler middleware (add LAST in express app)
function sentryErrorHandler() {
  return Sentry.expressErrorHandler();
}

// Express request handler middleware (add FIRST in express app)
function sentryRequestHandler() {
  return Sentry.expressRequestHandler();
}

// Attach tenant context to current Sentry scope
function setSentryTenantContext({ tenantId, userId, email } = {}) {
  Sentry.setUser({ id: userId, email });
  Sentry.setTag('tenant_id', tenantId);
}

// Manually capture an exception with extra context
function captureException(error, context = {}) {
  Sentry.withScope((scope) => {
    Object.entries(context).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });
    Sentry.captureException(error);
  });
}

// Capture a custom message/event
function captureMessage(message, level = 'info', context = {}) {
  Sentry.withScope((scope) => {
    scope.setLevel(level);
    Object.entries(context).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });
    Sentry.captureMessage(message);
  });
}

module.exports = {
  initSentry,
  sentryRequestHandler,
  sentryErrorHandler,
  setSentryTenantContext,
  captureException,
  captureMessage,
  Sentry,
};
