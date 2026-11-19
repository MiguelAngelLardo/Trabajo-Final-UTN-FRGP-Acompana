const { body } = require('express-validator');

const validarLegajo = body('legajo').trim().notEmpty().withMessage('El legajo es obligatorio').matches(/^[0-9]{5}$/).withMessage('El legajo debe tener exactamente 5 números').not().equals('00000').withMessage('El legajo no puede ser 00000');const validarContrasena = body('contrasena').isLength({ min: 8, max: 50 }).withMessage('La contraseña debe tener al menos 8 caracteres').matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una mayúscula').matches(/[a-z]/).withMessage('La contraseña debe contener al menos una minúscula').matches(/[0-9]/).withMessage('La contraseña debe contener al menos un número');

// --- Registro ---
const registroValidation = [
  body('dni').trim().notEmpty().withMessage('El DNI es obligatorio').matches(/^[1-9][0-9]{6,7}$/).withMessage('El DNI debe tener 7 u 8 dígitos y no empezar con 0'),
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio').isLength({ max: 50 }).withMessage('El nombre no puede superar 50 caracteres').matches(/^[A-Za-zÁ-ÿñÑ\s]+$/).withMessage('El nombre solo puede contener letras'),
  body('apellido').trim().notEmpty().withMessage('El apellido es obligatorio').isLength({ max: 50 }).withMessage('El apellido no puede superar 50 caracteres').matches(/^[A-Za-zÁ-ÿñÑ\s]+$/).withMessage('El apellido solo puede contener letras'),
  body('correo').trim().notEmpty().withMessage('El correo institucional es obligatorio').matches(/^[a-zA-Z0-9._-]+@alumnos\.frgp\.utn\.edu\.ar$/).withMessage('El correo debe ser institucional (@alumnos.frgp.utn.edu.ar)'),
  body('sexo').trim().notEmpty().withMessage('El sexo es obligatorio').isLength({ min: 1, max: 1 }).withMessage('El sexo debe ser un solo carácter').isIn(['M', 'F', 'X']).withMessage('El sexo debe ser M, F o X'),
  body('direccion').trim().notEmpty().withMessage('La dirección es obligatoria').isLength({ max: 100 }).withMessage('La dirección no puede superar 100 caracteres'),
  body('telefono').trim().notEmpty().withMessage('El teléfono es obligatorio').isLength({ min: 7, max: 20 }).withMessage('El teléfono debe tener entre 7 y 20 caracteres').matches(/^[+]?[(]?[0-9]{1,4}[)]?[0-9\s.-]+$/).withMessage('El teléfono no tiene un formato válido'),  validarLegajo,
  validarContrasena,

  body('descripcion').optional().trim().isLength({ max: 50 }).withMessage('La descripción no puede superar 50 caracteres'),

  body('carrera').trim().notEmpty().withMessage('Debe seleccionar al menos una carrera'),
];

// --- Login ---
const loginValidation = [
  body('correo').trim().notEmpty().withMessage('El correo es obligatorio').matches(/^[a-zA-Z0-9._-]+@(alumnos|docentes)\.frgp\.utn\.edu\.ar$/).withMessage('El correo debe ser institucional'),
  body('contrasena').notEmpty().withMessage('La contraseña es obligatoria')
];

module.exports = { registroValidation, loginValidation };