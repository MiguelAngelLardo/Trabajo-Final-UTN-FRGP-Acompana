const { validationResult } = require('express-validator');
const apunteService = require('../services/apunte.service');
const { success, error } = require('../utils/response.util');
const { pipeline } = require('stream');

function hayErroresDeValidacion(req, res) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return false;

  res.status(400).json(
    error('Errores de validación', errors.array().map((e) => e.msg))
  );
  return true;
}

async function cargar(req, res, next) {
  try {
    if (hayErroresDeValidacion(req, res)) return;

    const apunte = await apunteService.cargarApunte({
      dni: req.usuario.dni,
      idMateria: req.body.idMateria,
      nombre: req.body.nombre,
      descripcion: req.body.descripcion,
      archivo: req.file
    });

    res.status(201).json(success(apunte, 'Apunte cargado correctamente'));
  } catch (err) {
    next(err);
  }
}

async function eliminar(req, res, next) {
  try {
    if (hayErroresDeValidacion(req, res)) return;

    await apunteService.eliminarApunte({
      dni: req.usuario.dni,
      idApunte: req.params.id
    });

    res.json(success(null, 'Apunte eliminado correctamente'));
  } catch (err) {
    next(err);
  }
}

async function listarMios(req, res, next) {
  try {
    const apuntes = await apunteService.listarMisApuntes(req.usuario.dni);
    res.json(success(apuntes, 'Apuntes obtenidos correctamente'));
  } catch (err) {
    next(err);
  }
}

async function buscar(req, res, next) {
  try {
    if (hayErroresDeValidacion(req, res)) return;

    const resultado = await apunteService.buscarApuntes(req.query);
    const mensaje = resultado.paginacion.total === 0
      ? 'No se encontraron apuntes para el criterio ingresado.'
      : 'Apuntes obtenidos correctamente';

    res.json(success(resultado, mensaje));
  } catch (err) {
    next(err);
  }
}

async function descargar(req, res, next) {
  try {
    if (hayErroresDeValidacion(req, res)) return;

    const { stream, nombreArchivo } = await apunteService.obtenerArchivoApunte(req.params.id);

    res.attachment(nombreArchivo);

    pipeline(stream, res, (err) => {
      if (!err) return;
      console.error('Falló la descarga:', err.message);
      if (res.headersSent) return res.destroy(); 
      res.removeHeader('Content-Disposition');
      next(err);
    });
  } catch (err) {
    next(err);
  }
}
module.exports = { cargar, eliminar, listarMios, buscar, descargar };