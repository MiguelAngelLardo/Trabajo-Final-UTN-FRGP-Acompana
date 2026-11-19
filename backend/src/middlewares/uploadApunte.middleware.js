const multer = require('multer');

const TAMANO_MAX_MB = 10;
const TAMANO_MAX_BYTES = TAMANO_MAX_MB * 1024 * 1024;
const MENSAJE_FORMATO = `Formato de archivo inválido. Solo se permiten archivos PDF de hasta ${TAMANO_MAX_MB} MB.`;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANO_MAX_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    const esPdf =
      file.mimetype === 'application/pdf' &&
      file.originalname.toLowerCase().endsWith('.pdf');

    if (!esPdf) {
      const err = new Error(MENSAJE_FORMATO);
      err.code = 'FORMATO_INVALIDO';
      return cb(err);
    }
    cb(null, true);
  }
}).single('archivo');

function subirArchivoApunte(req, res, next) {
  upload(req, res, (err) => {
    if (err) {
      if (err.code === 'FORMATO_INVALIDO' || err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ ok: false, message: MENSAJE_FORMATO });
      }
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          ok: false,
          message: "Debe enviarse un único archivo PDF en el campo 'archivo'."
        });
      }
      return next(err); 
    }

    if (!req.file) {
      return res.status(400).json({
        ok: false,
        message: 'Debe adjuntar un archivo PDF.'
      });
    }

    // El mimetype y la extensión los declara el cliente y se pueden falsificar.
    // Todo PDF real empieza con "%PDF-", así que lo verificamos en el contenido.
    if (req.file.buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
      return res.status(400).json({ ok: false, message: MENSAJE_FORMATO });
    }

    next();
  });
}

module.exports = subirArchivoApunte;