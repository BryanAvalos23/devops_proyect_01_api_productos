/**
 * Bootstrap de OpenTelemetry.
 *
 * IMPORTANTE: este archivo debe importarse ANTES que cualquier otro módulo
 * en server.ts (incluido express y pg), porque la auto-instrumentación
 * funciona parcheando esos módulos en el momento en que se hace `require`.
 * Si se importa después, las trazas de HTTP/Express/pg no se generan.
 *
 * Todo se configura por variables de entorno para que, como equipo de
 * DevOps, solo tengan que apuntar OTEL_EXPORTER_OTLP_ENDPOINT a su
 * collector (Jaeger, Tempo, Grafana Alloy, el backend que sea) sin tocar
 * código.
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const otelEnabled = process.env.OTEL_ENABLED !== 'false' && process.env.NODE_ENV !== 'test';

let sdk: NodeSDK | undefined;

if (otelEnabled) {
  const serviceName = process.env.OTEL_SERVICE_NAME || 'products-api';
  // Endpoint base del collector OTLP/HTTP. Ej: http://otel-collector:4318
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';
  const headers = parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS);

  const traceExporter = new OTLPTraceExporter({ url: `${endpoint}/v1/traces`, headers });
  const metricExporter = new OTLPMetricExporter({ url: `${endpoint}/v1/metrics`, headers });

  sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
    }),
    traceExporter,
    metricReader: new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 15000,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // Ruido innecesario: instrumentar fs genera muchísimos spans irrelevantes.
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });

  sdk.start();

  // eslint-disable-next-line no-console
  console.log(`[otel] OpenTelemetry inicializado — service.name=${serviceName}, endpoint=${endpoint}`);

  const shutdown = (): void => {
    sdk
      ?.shutdown()
      // eslint-disable-next-line no-console
      .then(() => console.log('[otel] SDK apagado correctamente'))
      // eslint-disable-next-line no-console
      .catch((err) => console.error('[otel] Error apagando el SDK', err))
      .finally(() => process.exit(0));
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

function parseHeaders(raw?: string): Record<string, string> | undefined {
  // Formato esperado (igual al estándar OTEL_EXPORTER_OTLP_HEADERS): "key1=value1,key2=value2"
  if (!raw) return undefined;
  return Object.fromEntries(
    raw.split(',').map((pair) => {
      const [key, ...rest] = pair.split('=');
      return [key.trim(), rest.join('=').trim()];
    })
  );
}

export {};
