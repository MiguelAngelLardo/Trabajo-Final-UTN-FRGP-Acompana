// Middleware global de manejo de errores.
// Captura cualquier error no manejado y devuelve una respuesta JSON uniforme.

const { error } = require('../utils/response.util');

function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err.message);
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500
    ? 'Ocurrió un error inesperado. Reintente más tarde.'
    : err.message;

  res.status(statusCode).json(error(message));
}

module.exports = errorHandler;
