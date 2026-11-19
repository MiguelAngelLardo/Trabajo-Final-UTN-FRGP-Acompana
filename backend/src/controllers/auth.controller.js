// Controller de autenticación — R1 (registro) y R2 (login).
// Recibe req/res, valida inputs, llama al service y devuelve la respuesta.

const { validationResult } = require('express-validator');
const authService = require('../services/auth.service');
const { success, error } = require('../utils/response.util');

/**
 * POST /auth/register
 * Registra un nuevo alumno.
 */
async function register(req, res, next) {
  try {
    // Verificar errores de validación (express-validator)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        error('Errores de validación', errors.array().map(e => e.msg))
      );
    }

    const alumno = await authService.registrarAlumno(req.body);
    res.status(201).json(success(alumno, 'Alumno registrado exitosamente'));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/login
 * Inicia sesión y devuelve un JWT.
 */
async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        error('Errores de validación', errors.array().map(e => e.msg))
      );
    }

    const { correo, contrasena } = req.body;
    const resultado = await authService.login(correo, contrasena);
    res.json(success(resultado, 'Sesión iniciada exitosamente'));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /auth/carreras
 * Devuelve las carreras activas (público, para el formulario de registro).
 */
async function carrerasParaRegistro(req, res, next) {
  try {
    const { Carrera } = require('../models');
    const carreras = await Carrera.findAll({
      where: { Estado_Ca: true },
      attributes: ['IdCarrera_Ca', 'Nombre_Ca'],
      order: [['Nombre_Ca', 'ASC']]
    });
    res.json(success(carreras, 'Carreras obtenidas'));
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, carrerasParaRegistro };
