
const { body, query } = require('express-validator');

const AVISO_ID_CARRERA = 'El id de la carrera debe ser un número entero mayor o igual a 1';
const AVISO_ID_MATERIA = 'El id de la materia debe ser un número entero mayor o igual a 1';

function reglasCarreraObligatoria() {
  return [
    query('idCarrera')
      .notEmpty().withMessage('Debe indicar de qué carrera quiere ver las materias')
      .bail()
      .isString().withMessage('Debe indicar una sola carrera')
      .bail()
      .isInt({ min: 1 }).withMessage(AVISO_ID_CARRERA)
      .toInt()
  ];
}

// --- Historial del alumno (GET /materias-aprobadas) ---
const listarMateriasAprobadasValidation = reglasCarreraObligatoria();
// --- Materias que puede registrar (GET /materias-aprobadas/disponibles) ---
const listarMateriasDisponiblesValidation = reglasCarreraObligatoria();

// --- Alta de materia aprobada (POST /materias-aprobadas) ---
const registrarMateriaAprobadaValidation = [
  body('idMateria')
    .notEmpty().withMessage('Debe indicar la materia que quiere registrar como aprobada')
    .bail()
    .isInt({ min: 1 }).withMessage(AVISO_ID_MATERIA)
    .toInt()
];

module.exports = {
  listarMateriasAprobadasValidation,
  listarMateriasDisponiblesValidation,
  registrarMateriaAprobadaValidation
};
