const { validationResult } = require('express-validator');
const materiaAprobadaService = require('../services/materiasAprobadas.service');
const { success, error } = require('../utils/response.util');


async function listarMateriasAprobadas(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        error('Errores de validación', errors.array().map(e => e.msg))
      );
    }
    const { dni } = req.usuario;
    const { idCarrera } = req.query;
    const resultado = await materiaAprobadaService.listarMateriasAprobadas(dni, idCarrera);
    res.json(success(resultado, 'Materias aprobadas obtenidas correctamente'));
  } catch (err) {
    next(err);
  }
}

async function listarMateriasDisponibles(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        error('Errores de validación', errors.array().map(e => e.msg))
      );
    }
    const { dni } = req.usuario;
    const { idCarrera } = req.query;
    const resultado = await materiaAprobadaService.listarMateriasDisponibles(dni, idCarrera);
    res.json(success(resultado, 'Materias disponibles obtenidas correctamente'));
  } catch (err) {
    next(err);
  }
}

async function registrarMateriaAprobada(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        error('Errores de validación', errors.array().map(e => e.msg))
      );
    }
    const { dni } = req.usuario;
    const resultado = await materiaAprobadaService.registrarMateriaAprobada(dni, req.body);
    res.status(201).json(success(resultado, 'Materia registrada como aprobada'));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listarMateriasAprobadas,
  listarMateriasDisponibles,
  registrarMateriaAprobada
};
