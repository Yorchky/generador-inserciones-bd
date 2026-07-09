const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const generatorRoutes = require('./routes/generator.routes');
const { testConnection } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.originalUrl}`);
  if (req.method === 'POST' && req.body && Object.keys(req.body).length > 0) {
    console.log(`[HTTP]   Body:`, JSON.stringify(req.body, null, 2).substring(0, 300));
  }
  next();
});

app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api', generatorRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/main', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'main.html'));
});

app.use((err, req, res, next) => {
  console.error(`[ERROR] No manejado:`, err);
  res.status(500).json({
    error: err.message || 'Error interno del servidor',
    url: req.originalUrl,
  });
});

async function start() {
  console.log('========================================');
  console.log('  Smart Data Generator');
  console.log('========================================');
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Puerto:  ${PORT}`);

  const connected = await testConnection();

  if (!connected) {
    console.warn('\n⚠ No se pudo conectar a MySQL. El servidor arrancará igual.');
    console.warn('  Revisa que Docker esté corriendo y el .env sea correcto.');
    console.warn('  docker-compose up -d\n');
  }

  app.listen(PORT, () => {
    console.log(`\nServidor listo: http://localhost:${PORT}`);
    console.log('========================================\n');
  });
}

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Promesa rechazada sin manejar:', reason);
});

process.on('SIGINT', () => {
  console.log('\n[SHUTDOWN] Cerrando servidor...');
  process.exit(0);
});

start();
