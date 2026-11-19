// Controller de usuario — R1 (perfil propio) y R9 (gestión admin).
// Recibe req/res, valida inputs, llama al service y devuelve la respuesta.

const { validationResult } = require('express-validator');
const usuarioService = require('../services/usuario.service');
const authService = require('../services/auth.service');
const { success, error } = require('../utils/response.util');

const { v2: cloudinary } = require('cloudinary');


/**
 * GET /usuarios/me
 * Devuelve el perfil del usuario logueado (sacado del token, no de la URL).
 */
async function obtenerMiPerfil(req, res, next) {
  try {
    const perfil = await usuarioService.obtenerPerfil(req.usuario.dni);
    res.json(success(perfil, 'Perfil obtenido correctamente'));
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /usuarios/me
 * Edita SOLO los campos permitidos del propio perfil.
 */
async function editarMiPerfil(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        error('Errores de validación', errors.array().map(e => e.msg))
      );
    }

    const perfilActualizado = await usuarioService.editarPerfilPropio(req.usuario.dni, req.body);
    res.json(success(perfilActualizado, 'Perfil actualizado correctamente'));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /usuarios?q=texto
 * Solo admin. Busca por DNI, legajo, correo o nombre.
 */
async function buscarUsuarios(req, res, next) {
  try {
    const { q, pagina, porPagina } = req.query;
    const resultado = await usuarioService.buscarUsuarios(
      q || null,
      parseInt(pagina) || 1,
      parseInt(porPagina) || 10
    );
    res.json(success(resultado, 'Búsqueda completada'));
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /usuarios/:dni/estado
 * Solo admin. Habilita o deshabilita una cuenta.
 */
async function cambiarEstado(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        error('Errores de validación', errors.array().map(e => e.msg))
      );
    }

    const { dni } = req.params;
    const { estado } = req.body;
    const resultado = await usuarioService.cambiarEstado(dni, estado);
    res.json(success(resultado, 'Estado actualizado correctamente'));
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /usuarios/me/foto
 * Sube y guarda la foto de perfil del usuario logueado.
 */
async function subirFotoPerfil(req, res, next) { 
  try {
    if (!req.file) {
      return res.status(400).json(error('No se recibió ningún archivo'));
    }

    // Setear credenciales de fotos justo antes de subir
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_FOTOS_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_FOTOS_API_KEY,
      api_secret: process.env.CLOUDINARY_FOTOS_API_SECRET
    });

    const url = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'perfiles',
          public_id: req.usuario.dni,
          overwrite: true,
          resource_type: 'image'
        },
        (err, result) => err ? reject(err) : resolve(result.secure_url)
      );
      stream.end(req.file.buffer);
    });

    const resultado = await usuarioService.guardarFotoPerfil(req.usuario.dni, url);
    res.json(success(resultado, 'Foto de perfil actualizada correctamente'));
  } catch (err) {
    next(err);
  }
}


/**
 * POST /usuarios
 * Solo admin. Da de alta una cuenta nueva (reusa la lógica de R1,
 * misma validación y transacción, protegida por rol en vez de pública).
 */
async function crearUsuarioAdmin(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        error('Errores de validación', errors.array().map(e => e.msg))
      );
    }

    const alumno = await authService.registrarAlumno(req.body);
    res.status(201).json(success(alumno, 'Usuario registrado por el administrador'));
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /usuarios/:dni
 * Solo admin. Edita datos de OTRO usuario (nombre, apellido, correo, legajo).
 */
async function editarUsuarioAdmin(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        error('Errores de validación', errors.array().map(e => e.msg))
      );
    }

    const { dni } = req.params;
    const resultado = await usuarioService.editarUsuarioAdmin(dni, req.body);
    res.json(success(resultado, 'Usuario actualizado correctamente'));
  } catch (err) {
    next(err);
  }
}


/**
 * PATCH /usuarios/me/contrasena
 * El usuario logueado cambia su propia contraseña.
 */
async function cambiarContrasenaPropia(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        error('Errores de validación', errors.array().map(e => e.msg))
      );
    }

    const { contrasenaActual, contrasenaNueva } = req.body;
    const resultado = await usuarioService.cambiarContrasenaPropia(req.usuario.dni, contrasenaActual, contrasenaNueva);
    res.json(success(resultado, 'Contraseña actualizada correctamente'));
  } catch (err) {
    next(err);
  }
}

module.exports = { obtenerMiPerfil, editarMiPerfil, buscarUsuarios, cambiarEstado, subirFotoPerfil, crearUsuarioAdmin, editarUsuarioAdmin, cambiarContrasenaPropia };