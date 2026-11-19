// Contrato que deben cumplir todas las implementaciones (local, S3, etc.)

class StorageInterface {
  async guardar(archivo, subcarpeta) {
    throw new Error('guardar() no implementado');
  }

  async eliminar(ruta) {
    throw new Error('eliminar() no implementado');
  }

  /** @returns {Promise<import('stream').Readable>} contenido del archivo, para reenviarlo al cliente (R5) */
  async obtenerStream(ruta) {
    throw new Error('obtenerStream() no implementado');
  }
}
module.exports = StorageInterface;