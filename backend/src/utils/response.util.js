// Utilidad para estandarizar todas las respuestas de la API.
// Uso: res.json(success(data)) o res.status(400).json(error('mensaje'))

/**
 * Respuesta exitosa
 * @param {*} data - Datos a devolver
 * @param {string} [message] - Mensaje opcional
 */
function success(data, message = 'OK') {
  return {
    ok: true,
    message,
    data
  };
}

/**
 * Respuesta de error
 * @param {string} message - Mensaje de error
 * @param {*} [details] - Detalles adicionales (ej: errores de validación)
 */
function error(message, details = null) {
  const response = {
    ok: false,
    message
  };
  if (details) response.details = details;
  return response;
}

module.exports = { success, error };
