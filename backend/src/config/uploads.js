const path = require('path');

const RAIZ_PROYECTO = path.resolve(__dirname, '../..');

// Si UPLOADS_DIR es relativo (ej. "uploads"), se resuelve contra la raíz
// del proyecto y no contra el directorio desde el que se ejecuta node.
// Si es absoluto, se respeta tal cual.
const UPLOADS_DIR = path.resolve(RAIZ_PROYECTO, process.env.UPLOADS_DIR || 'uploads');

module.exports = { UPLOADS_DIR };