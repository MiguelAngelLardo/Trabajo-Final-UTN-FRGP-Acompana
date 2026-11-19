// Controller de solicitudes de tutoría — R6.

const { validationResult } = require('express-validator');
const solicitudService = require('../services/solicitud.service');
const { success, error } = require('../utils/response.util');

/**
 * POST /solicitudes
 * Body: { dniTutor, idMateria }
 */
async function crearSolicitud(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        error('Errores de validación', errors.array().map(e => e.msg))
      );
    }

    const { dniTutor, idMateria, medioContacto, apoyo } = req.body;
    const solicitud = await solicitudService.crearSolicitud(req.usuario.dni, { dniTutor, idMateria, medioContacto, apoyo });
    res.status(201).json(success(solicitud, 'Solicitud enviada al tutor'));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /solicitudes/recibidas?estado=
 */
async function listarRecibidas(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        error('Errores de validación', errors.array().map(e => e.msg))
      );
    }

    const solicitudes = await solicitudService.listarRecibidas(req.usuario.dni, req.query.estado);
    res.json(success(solicitudes));
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /solicitudes/:id
 * Body: { decision: 'Aceptada' | 'Rechazada' }
 */
async function responderSolicitud(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        error('Errores de validación', errors.array().map(e => e.msg))
      );
    }

    const resultado = await solicitudService.responderSolicitud(req.params.id, req.usuario.dni, req.body.decision);
    const mensaje = resultado.estado === 'Aceptada'
      ? 'Solicitud aceptada. Contactá al alumno para coordinar la tutoría'
      : 'Solicitud rechazada. Se le avisará al alumno';
    res.json(success(resultado, mensaje));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /solicitudes/avisos?desde=AAAA-MM-DD
 */
async function listarAvisos(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        error('Errores de validación', errors.array().map(e => e.msg))
      );
    }

    const avisos = await solicitudService.listarAvisos(req.usuario.dni, req.query.desde);
    res.json(success(avisos));
  } catch (err) {
    next(err);
  }
}

module.exports = { crearSolicitud, listarRecibidas, responderSolicitud, listarAvisos };
