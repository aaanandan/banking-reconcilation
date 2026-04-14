// Step 231: Distributed Tracing — OpenTelemetry + Jaeger
// Banking Reconciliation Platform
// Install: npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
//          @opentelemetry/exporter-jaeger @opentelemetry/exporter-otlp-http
//          @opentelemetry/sdk-trace-node @opentelemetry/resources
//          @opentelemetry/semantic-conventions

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { trace, context, propagation } = require('@opentelemetry/api');
const { W3CTraceContextPropagator } = require('@opentelemetry/core');

const SERVICE_NAME = process.env.SERVICE_NAME || 'auth-service';
const JAEGER_ENDPOINT = process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces';
const OTLP_ENDPOINT = process.env.OTLP_ENDPOINT || 'http://localhost:4318/v1/traces';

let sdk;

function initTracing() {
  const useJaeger = process.env.TRACING_EXPORTER !== 'otlp';

  const exporter = useJaeger
    ? new JaegerExporter({ endpoint: JAEGER_ENDPOINT })
    : new OTLPTraceExporter({ url: OTLP_ENDPOINT });

  sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: SERVICE_NAME,
      [SemanticResourceAttributes.SERVICE_VERSION]: process.env.APP_VERSION || '1.0.0',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
    }),
    traceExporter: exporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        // Auto-instrument HTTP, Express, pg, redis, etc.
        '@opentelemetry/instrumentation-http': { enabled: true },
        '@opentelemetry/instrumentation-express': { enabled: true },
        '@opentelemetry/instrumentation-pg': { enabled: true },
        '@opentelemetry/instrumentation-dns': { enabled: false }, // too noisy
      }),
    ],
    // W3C TraceContext propagation for cross-service tracing
    textMapPropagator: new W3CTraceContextPropagator(),
  });

  sdk.start();
  console.log(`[Tracing] OpenTelemetry initialised — service: ${SERVICE_NAME}, exporter: ${useJaeger ? 'Jaeger' : 'OTLP'}`);

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk.shutdown().then(() => console.log('[Tracing] SDK shut down')).catch(console.error);
  });
}

// Get the current active tracer
function getTracer(name) {
  return trace.getTracer(name || SERVICE_NAME);
}

// Create a manual span for a block of work
async function withSpan(spanName, attributes, fn) {
  const tracer = getTracer();
  return tracer.startActiveSpan(spanName, { attributes }, async (span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: 1 }); // OK
      return result;
    } catch (err) {
      span.setStatus({ code: 2, message: err.message }); // ERROR
      span.recordException(err);
      throw err;
    } finally {
      span.end();
    }
  });
}

// Express middleware to add trace context to response headers
function tracingMiddleware() {
  return (req, res, next) => {
    const span = trace.getActiveSpan();
    if (span) {
      const { traceId, spanId } = span.spanContext();
      res.setHeader('X-Trace-Id', traceId);
      res.setHeader('X-Span-Id', spanId);
      // Attach tenant context to span
      const tenantId = req.headers['x-tenant-id'];
      if (tenantId) span.setAttribute('tenant.id', tenantId);
    }
    next();
  };
}

module.exports = { initTracing, getTracer, withSpan, tracingMiddleware };
