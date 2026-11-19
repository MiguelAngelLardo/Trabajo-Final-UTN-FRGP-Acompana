// Controller de tutorías — R7 (postulación) y R6 (búsqueda de tutores).

const { validationResult } = require('express-validator');
const tutoriaService = require('../services/tutoria.service');
const { success, error } = require('../utils/response.util');

/**
 * POST /tutorias/postulaciones
 * Body: { materias: [idMateria, ...], descripcion }
 */
async function postular(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        error('Errores de validación', errors.array().map(e => e.msg))
      );
    }

    const { materias, descripcion } = req.body;
    const resultado = await tutoriaService.postularTutoria(req.usuario.dni, materias, descripcion);
    res.status(201).json(success(resultado, 'Postulación registrada. Ya figurás como tutor de estas materias'));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /tutores?carrera=&materia=
 */
async function buscarTutores(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        error('Errores de validación', errors.array().map(e => e.msg))
      );
    }

    const { carrera, materia } = req.query;
    const tutores = await tutoriaService.buscarTutores({
      dniSolicitante: req.usuario.dni, carrera, materia
    });
    const mensaje = tutores.length > 0
      ? 'Búsqueda completada'
      : 'No se encontraron tutores disponibles para esa búsqueda';
    res.json(success(tutores, mensaje));
  } catch (err) {
    next(err);
  }
}

module.exports = { postular, buscarTutores };
