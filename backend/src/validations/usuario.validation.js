const { body } = require('express-validator');

const editarPerfilValidation = [
  body('Telefono_P').optional().trim().isLength({ min: 7, max: 50 }).withMessage('El teléfono debe tener entre 7 y 20 caracteres').matches(/^[+]?[(]?[0-9]{1,4}[)]?[0-9\s.-]+$/).withMessage('El teléfono no tiene un formato válido'),  
  body('Direccion_P').optional().trim().isLength({ max: 100 }).withMessage('La dirección no puede superar 100 caracteres'),
  body('Descripcion_A').optional().trim().isLength({ max: 50 }).withMessage('La descripción no puede superar 50 caracteres'),
  body('Sexo_P').optional().trim().isLength({ min: 1, max: 1 }).withMessage('El sexo debe ser un solo carácter').isIn(['M', 'F', 'X']).withMessage('El sexo debe ser M, F o X')
];

const cambiarEstadoValidation = [
  body('estado').notEmpty().withMessage('El estado es obligatorio').isBoolean().withMessage('El estado debe ser true o false')
];

const editarUsuarioAdminValidation = [
  body('Nombre_P').optional().trim().isLength({ max: 50 }).withMessage('El nombre no puede superar 50 caracteres').matches(/^[A-Za-zÁ-ÿñÑ\s]+$/).withMessage('El nombre solo puede contener letras'),
  body('Apellido_P').optional().trim().isLength({ max: 50 }).withMessage('El apellido no puede superar 50 caracteres').matches(/^[A-Za-zÁ-ÿñÑ\s]+$/).withMessage('El apellido solo puede contener letras'),
  body('CorreoInstitucional_P').optional().trim().matches(/^[a-zA-Z0-9._-]+@(alumnos|docentes)\.frgp\.utn\.edu\.ar$/).withMessage('El correo debe ser institucional'),
  body('Legajo_A').optional().trim().matches(/^[0-9]{5}$/).withMessage('El legajo debe tener exactamente 5 números').not().equals('00000').withMessage('El legajo no puede ser 00000')
];

const cambiarContrasenaValidation = [
  body('contrasenaActual').notEmpty().withMessage('Debe ingresar su contraseña actual'),
  body('contrasenaNueva').isLength({ min: 8 }).withMessage('La contraseña nueva debe tener al menos 8 caracteres').matches(/[A-Z]/).withMessage('La contraseña nueva debe contener al menos una mayúscula').matches(/[a-z]/).withMessage('La contraseña nueva debe contener al menos una minúscula').matches(/[0-9]/).withMessage('La contraseña nueva debe contener al menos un número')
];

module.exports = { editarPerfilValidation, cambiarEstadoValidation, editarUsuarioAdminValidation, cambiarContrasenaValidation };