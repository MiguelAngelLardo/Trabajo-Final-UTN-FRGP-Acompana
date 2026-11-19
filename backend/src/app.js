// Configuración de Express: middlewares globales y rutas.
const path = require('path');
const { UPLOADS_DIR } = require('./config/uploads');
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler.middleware');

const app = express();

// --- Middlewares globales ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Archivos subidos, servidos como estáticos ---
// Esto hace que /uploads/perfiles/33626855.jpg sea una URL real
// que el navegador puede pedir directamente, como cualquier imagen
// app.use('/uploads', express.static('uploads'));
app.use('/uploads/perfiles', express.static(path.join(UPLOADS_DIR, 'perfiles')));

// --- Rutas ---
app.use('/api', routes);

// --- Ruta de health check ---
app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'Servidor Acompaña funcionando' });
});

// --- Middleware de errores (siempre al final) ---
app.use(errorHandler);

module.exports = app;