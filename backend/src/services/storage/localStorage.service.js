const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const StorageInterface = require('./storage.interface');
const { createReadStream } = require('fs');

class LocalStorageService extends StorageInterface {
  constructor(baseDir) {
    super();
    this.baseDir = path.resolve(baseDir);
  }

  // Resuelve la ruta y evita que salga de baseDir (path traversal)
  _resolver(ruta) {
    const absoluta = path.resolve(this.baseDir, ruta);
    if (!absoluta.startsWith(this.baseDir + path.sep)) {
      throw new Error('Ruta de archivo inválida');
    }
    return absoluta;
  }

  async guardar(archivo, subcarpeta = '') {
    // Nunca usamos el nombre original como nombre en disco
    const extension = path.extname(archivo.originalname).toLowerCase();
    const nombre = `${crypto.randomUUID()}${extension}`;

    const ruta = path.posix.join(subcarpeta, nombre);
    const absoluta = this._resolver(ruta);

    await fs.mkdir(path.dirname(absoluta), { recursive: true });
    await fs.writeFile(absoluta, archivo.buffer);

    return ruta;
  }

  async eliminar(ruta) {
    try {
      await fs.unlink(this._resolver(ruta));
    } catch (err) {
      if (err.code !== 'ENOENT') throw err; // si ya no existe, no es un error
    }
  }

//   async obtenerStream(ruta) {
//   return createReadStream(this._resolver(ruta));
// }
async obtenerStream(ruta) {
  const absoluta = this._resolver(ruta);
  await fs.access(absoluta); // lanza si el archivo no existe
  return createReadStream(absoluta);
}
}

module.exports = LocalStorageService;