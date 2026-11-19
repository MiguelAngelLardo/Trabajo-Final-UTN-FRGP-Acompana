const { validationResult } = require('express-validator');
const catalogoService = require('../services/catalogo.service');
const { success, error } = require('../utils/response.util');

// Devuelve true si respondió con 400 (y el handler debe cortar)
function hayErroresDeValidacion(req, res) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return false;
  res.status(400).json(
    error('Errores de validación', errors.array().map(e => e.msg))
  );
  return true;
}

// --- Listados (admin y alumno; el service filtra según el rol) ---

async function listarCarreras(req, res, next) {
  try {
    if (hayErroresDeValidacion(req, res)) return;

    const { estado, q } = req.query;
    const carreras = await catalogoService.listarCarreras({
      estado, q, rol: req.usuario.rol
    });
    res.json(success(carreras, 'Carreras obtenidas correctamente'));
  } catch (err) {
    next(err);
  }
}

async function listarMaterias(req, res, next) {
  try {
    if (hayErroresDeValidacion(req, res)) return;
    const { estado, q, idCarrera } = req.query;
    const materias = await catalogoService.listarMaterias({
      estado, q, idCarrera, rol: req.usuario.rol
    });
    res.json(success(materias, 'Materias obtenidas correctamente'));
  } catch (err) {
    next(err);
  }
}

// --- Alta ---

async function crearCarrera(req, res, next) {
  try {
    if (hayErroresDeValidacion(req, res)) return;
    const { nombre } = req.body;
    const carrera = await catalogoService.crearCarrera({ nombre });
    res.status(201).json(success(carrera, 'Carrera registrada correctamente'));
  } catch (err) {
    next(err);
  }
}

async function crearMateria(req, res, next) {
  try {
    if (hayErroresDeValidacion(req, res)) return;
    const { nombre, idCarrera } = req.body;
    const materia = await catalogoService.crearMateria({ nombre, idCarrera });
    res.status(201).json(success(materia, 'Materia registrada correctamente'));
  } catch (err) {
    next(err);
  }
}

// --- Edición ---

async function editarCarrera(req, res, next) {
  try {
    if (hayErroresDeValidacion(req, res)) return;
    const { idCarrera } = req.params;
    const { nombre } = req.body;
    const carrera = await catalogoService.editarCarrera(
      idCarrera,
      { nombre }
    );
    res.json(success(carrera, 'Carrera actualizada correctamente'));
  } catch (err) {
    next(err);
  }
}

async function editarMateria(req, res, next) {
  try {
    if (hayErroresDeValidacion(req, res)) return;
    const { idMateria } = req.params;
    const { nombre } = req.body;
    const materia = await catalogoService.editarMateria(
      idMateria,
      { nombre }
    );
    res.json(success(materia, 'Materia actualizada correctamente'));
  } catch (err) {
    next(err);
  }
}

// --- Baja lógica (PATCH /:id/baja) ---

async function bajaCarrera(req, res, next) {
  try {
    if (hayErroresDeValidacion(req, res)) return;

    const { idCarrera } = req.params;
    const r = await catalogoService.bajaCarrera(idCarrera);
    res.json(success(
      r,
      `Se dio de baja la carrera "${r.carrera.nombre}" y ${r.materiasDadasDeBaja} materia(s) activa(s)`
    ));
  } catch (err) {
    next(err);
  }
}

async function bajaMateria(req, res, next) {
  try {
    if (hayErroresDeValidacion(req, res)) return;

    const { idMateria } = req.params;
    const materia = await catalogoService.bajaMateria(idMateria);
    res.json(success(materia, `Se dio de baja la materia "${materia.nombre}"`));
  } catch (err) {
    next(err);
  }
}

// --- Reactivación (PATCH /:id/reactivar) ---

async function reactivarCarrera(req, res, next) {
  try {
    if (hayErroresDeValidacion(req, res)) return;

    const { idCarrera } = req.params;
    const r = await catalogoService.reactivarCarrera(idCarrera);
    res.json(success(
      r,
      `Se reactivó la carrera "${r.carrera.nombre}" y ${r.materiasReactivadas} de sus ${r.totalMaterias} materia(s)`
    ));
  } catch (err) {
    next(err);
  }
}

async function reactivarMateria(req, res, next) {
  try {
    if (hayErroresDeValidacion(req, res)) return;

    const { idMateria } = req.params;
    const materia = await catalogoService.reactivarMateria(idMateria);
    res.json(success(materia, `Se reactivó la materia "${materia.nombre}"`));
  } catch (err) {
    next(err);
  }
}

// --- Eliminación física (DELETE /:id, solo sin dependencias) ---

async function eliminarCarrera(req, res, next) {
  try {
    if (hayErroresDeValidacion(req, res)) return;

    const carrera = await catalogoService.eliminarCarrera(req.params.idCarrera);
    res.json(success(carrera, `Se eliminó la carrera "${carrera.nombre}" del catálogo`));
  } catch (err) {
    next(err);
  }
}

async function eliminarMateria(req, res, next) {
  try {
    if (hayErroresDeValidacion(req, res)) return;

    const materia = await catalogoService.eliminarMateria(req.params.idMateria);
    res.json(success(materia, `Se eliminó la materia "${materia.nombre}" del catálogo`));
  } catch (err) {
    next(err);
  }
}

async function listarMisCarreras(req, res, next) {
  try {
    const carreras = await catalogoService.listarMisCarreras(req.usuario.dni);
    res.json(success(carreras, 'Carreras del alumno obtenidas correctamente'));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listarCarreras,
  listarMaterias,
  crearCarrera,
  crearMateria,
  editarCarrera,
  editarMateria,
  bajaCarrera,
  bajaMateria,
  reactivarCarrera,
  reactivarMateria,
  eliminarCarrera,
  eliminarMateria,
  listarMisCarreras
};