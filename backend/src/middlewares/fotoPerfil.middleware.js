// Configuración de multer para fotos de perfil (R1).
// Usa memoryStorage: el archivo queda en req.file.buffer
// para subirlo a Cloudinary desde el controller.

const multer = require('multer');

const filtroDeArchivo = (req, file, cb) => {
  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
  if (tiposPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error('Solo se permiten imágenes JPG, PNG o WEBP');
    err.statusCode = 400;
    cb(err, false);
  }
};

const uploadFotoPerfil = multer({
  storage: multer.memoryStorage(),   // ← CAMBIÓ: memoria en vez de disco
  fileFilter: filtroDeArchivo,
  limits: { fileSize: 2 * 1024 * 1024 }
});

module.exports = uploadFotoPerfil;