const { body, query } = require('express-validator');

const postulacionValidation = [
  body('materias').isArray({ min: 1 }).withMessage('Debe seleccionar al menos una materia'),
  body('materias.*').isInt({ min: 1 }).withMessage('Cada materia debe ser un id válido').toInt(),
  body('descripcion').trim().notEmpty().withMessage('La descripción de la postulación es obligatoria').isLength({ max: 200 }).withMessage('La descripción no puede superar 200 caracteres')
];

const buscarTutoresValidation = [
  query('carrera').if(query('materia').not().exists()).exists().withMessage('Debe indicar una carrera o una materia'),
  query('carrera').optional().isInt({ min: 1 }).withMessage('La carrera debe ser un id válido').toInt(),
  query('materia').optional().isInt({ min: 1 }).withMessage('La materia debe ser un id válido').toInt()
];

module.exports = { postulacionValidation, buscarTutoresValidation };
