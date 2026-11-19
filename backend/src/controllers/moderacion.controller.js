// Controller de moderación — R10.

const moderacionService = require('../services/moderacion.service');
const { success, error } = require('../utils/response.util');

/**
 * GET /moderacion?carrera=&materia=&nombre=&estado=&pagina=&porPagina=
 */
async function listarApuntes(req, res, next) {
  try {
    const { carrera, materia, nombre, estado, pagina, porPagina } = req.query;
    const resultado = await moderacionService.listarApuntes({
      carrera, materia, nombre, estado, pagina, porPagina
    });
    res.json(success(resultado, 'Búsqueda completada'));
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /moderacion/:id/estado
 */
async function cambiarEstadoApunte(req, res, next) {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const resultado = await moderacionService.cambiarEstadoApunte(id, estado);
    res.json(success(resultado, 'Estado del apunte actualizado correctamente'));
  } catch (err) {
    next(err);
  }
}

module.exports = { listarApuntes, cambiarEstadoApunte };