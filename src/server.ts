// Debe ser el PRIMER import del archivo: inicializa OpenTelemetry antes de
// que se carguen express/pg, para que la auto-instrumentación los parchee a tiempo.
import './tracing';

import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const app = createApp();

app.listen(env.port, () => {
  logger.info(`products-api escuchando en el puerto ${env.port} [${env.nodeEnv}]`);
});
