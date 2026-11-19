const { body, param, query} = require('express-validator');

// Van DESPUÉS de Multer: hasta que Multer procesa el form-data, req.body está vacío.
// En form-data todo llega como texto, por eso idMateria se convierte con toInt().
const cargarApunteValidation = [
  body('idMateria')
    .trim().notEmpty().withMessage('Debe seleccionar una materia')
    .isInt({ min: 1 }).withMessage('La materia seleccionada no es válida')
    .toInt(),

  body('nombre')
    .trim().notEmpty().withMessage('El título es obligatorio')
    .isLength({ max: 50 }).withMessage('El título no puede superar 50 caracteres'),

  body('descripcion')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 50 }).withMessage('La descripción no puede superar 50 caracteres')
];

const eliminarApunteValidation = [
  param('id').isInt({ min: 1 }).withMessage('El identificador del apunte no es válido').toInt()
];

const buscarApuntesValidation = [
  query('idMateria').optional({ values: 'falsy' })
    .isInt({ min: 1 }).withMessage('La materia no es válida').toInt(),
  query('idCarrera').optional({ values: 'falsy' })
    .isInt({ min: 1 }).withMessage('La carrera no es válida').toInt(),
  query('q').optional().trim()
    .isLength({ max: 50 }).withMessage('La palabra clave no puede superar 50 caracteres'),
  query('page').optional({ values: 'falsy' })
    .isInt({ min: 1 }).withMessage('La página debe ser un número mayor a 0').toInt(),
  query('limit').optional({ values: 'falsy' })
    .isInt({ min: 1, max: 50 }).withMessage('El límite debe estar entre 1 y 50').toInt()
];

const descargarApunteValidation =  [
  param('id').isInt({ min: 1 }).withMessage('El identificador del apunte no es válido').toInt()
];

module.exports = { cargarApunteValidation, eliminarApunteValidation, buscarApuntesValidation, descargarApunteValidation };