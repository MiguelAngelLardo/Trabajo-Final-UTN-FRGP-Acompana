const { v2: cloudinary } = require('cloudinary');
const { Readable } = require('stream');
const crypto = require('crypto');
const StorageInterface = require('./storage.interface');

class CloudinaryStorageService extends StorageInterface {
  constructor() {
    super();
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_APUNTES_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_APUNTES_API_KEY,
      api_secret: process.env.CLOUDINARY_APUNTES_API_SECRET,
      secure: true
    });
  }

  async guardar(archivo, subcarpeta = '') {
    // Para archivos "raw" el public_id incluye la extensión
    const publicId = `${subcarpeta}/${crypto.randomUUID()}.pdf`;

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'raw', type: 'authenticated', public_id: publicId, overwrite: false },
        (err, result) => (err ? reject(err) : resolve(result.public_id))
      );
      stream.end(archivo.buffer);
    });
  }

  async eliminar(ruta) {
    // Si ya no existe, Cloudinary responde "not found" sin lanzar error
    await cloudinary.uploader.destroy(ruta, {
      resource_type: 'raw',
      type: 'authenticated',
      invalidate: true
    });
  }

  async obtenerStream(ruta) {
    const url = cloudinary.url(ruta, {
      resource_type: 'raw',
      type: 'authenticated',
      sign_url: true,
      secure: true
    });

    const respuesta = await fetch(url); // fetch nativo: requiere Node 18+
    if (!respuesta.ok) {
      throw new Error(`No se pudo obtener el archivo (${respuesta.status})`);
    }
    return Readable.fromWeb(respuesta.body);
  }
}

module.exports = CloudinaryStorageService;