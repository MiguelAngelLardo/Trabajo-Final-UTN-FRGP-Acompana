const { body, param, query } = require('express-validator');

// Letras (con tildes, ñ, ü), números, espacios y , . ( ) & -
const REGEX_NOMBRE = /^[\p{L}\p{N} ,.()&-]+$/u;
const MSG_NOMBRE_VACIO = 'El nombre es obligatorio';
const MSG_NOMBRE_LARGO = 'El nombre debe tener entre 3 y 100 caracteres';
const MSG_NOMBRE_CHARS = 'El nombre solo puede contener letras, números, espacios y los signos , . ( ) - &';

// Una sola cadena con bail(): corta en el primer error de cada campo.
// isString() va antes de trim(): trim() convertiría {"nombre": 123} en "123".
const REGLAS_NOMBRE = [
  body('nombre')
    .exists().withMessage(MSG_NOMBRE_VACIO).bail()
    .isString().withMessage('El nombre debe ser un texto').bail()
    .trim()
    .notEmpty().withMessage(MSG_NOMBRE_VACIO).bail()
    .isLength({ min: 3, max: 100 }).withMessage(MSG_NOMBRE_LARGO).bail()
    .matches(REGEX_NOMBRE).withMessage(MSG_NOMBRE_CHARS)
];

// Campos que el cliente no puede mandar (undefined = no vino)
const rechazarCampo = (campo, mensaje) =>
  body(campo).custom((v) => v === undefined).withMessage(mensaje);

const MSG_SIN_ESTADO_ALTA = 'El estado no se envía en el alta: toda carrera o materia nueva queda activa';
const MSG_SIN_ESTADO_EDICION = 'El estado no se modifica desde la edición. Usá la baja o la reactivación';

const idParam = (nombre, etiqueta) =>
  param(nombre)
    .isInt({ min: 1 })
    .withMessage(`El id de ${etiqueta} debe ser un número entero mayor que 0`)
    .toInt();

// --- Listados ---
const filtrosCatalogoValidation = [
  query('estado')
    .optional()
    .isString().withMessage('El estado debe ser un solo valor').bail()
    .isIn(['true', 'false', 'todos'])
    .withMessage('El estado debe ser "true", "false" o "todos"'),

  query('q')
    .optional({ values: 'falsy' })
    .isString().withMessage('La búsqueda debe ser un solo texto').bail()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('La búsqueda debe tener entre 1 y 100 caracteres')
];

const listarCarrerasValidation = [...filtrosCatalogoValidation];

const listarMateriasValidation = [
  ...filtrosCatalogoValidation,
  query('idCarrera')
    .optional()
    .isString().withMessage('El id de la carrera debe ser un solo valor').bail()
    .isInt({ min: 1 })
    .withMessage('El id de la carrera debe ser un número entero mayor que 0')
    .toInt()
];

// --- Alta ---
const crearCarreraValidation = [
  ...REGLAS_NOMBRE,
  rechazarCampo('estado', MSG_SIN_ESTADO_ALTA)
];

const crearMateriaValidation = [
  ...REGLAS_NOMBRE,
  body('idCarrera')
    .exists().withMessage('Debe indicar a qué carrera pertenece la materia').bail()
    // Corta arrays, objetos y booleanos antes de isInt (que mira cada elemento)
    .custom((v) => typeof v === 'number' || typeof v === 'string')
    .withMessage('El id de la carrera debe ser un número entero').bail()
    .isInt({ min: 1 })
    .withMessage('El id de la carrera debe ser un número entero mayor que 0')
    .toInt(),
  rechazarCampo('estado', MSG_SIN_ESTADO_ALTA)
];

const editarCarreraValidation = [
  idParam('idCarrera', 'la carrera'),
  ...REGLAS_NOMBRE,
  rechazarCampo('estado', MSG_SIN_ESTADO_EDICION)
];

const editarMateriaValidation = [
  idParam('idMateria', 'la materia'),
  ...REGLAS_NOMBRE,
  rechazarCampo('estado', MSG_SIN_ESTADO_EDICION),
  rechazarCampo('idCarrera', 'La carrera de una materia no se puede modificar')
];

// --- Baja, reactivación y eliminación: solo id en la URL, sin body ---
const bajaCarreraValidation = [idParam('idCarrera', 'la carrera')];
const reactivarCarreraValidation = [idParam('idCarrera', 'la carrera')];
const eliminarCarreraValidation = [idParam('idCarrera', 'la carrera')];

const bajaMateriaValidation = [idParam('idMateria', 'la materia')];
const reactivarMateriaValidation = [idParam('idMateria', 'la materia')];
const eliminarMateriaValidation = [idParam('idMateria', 'la materia')];

module.exports = {
  listarCarrerasValidation,
  listarMateriasValidation,
  crearCarreraValidation,
  crearMateriaValidation,
  editarCarreraValidation,
  editarMateriaValidation,
  bajaCarreraValidation,
  reactivarCarreraValidation,
  eliminarCarreraValidation,
  bajaMateriaValidation,
  reactivarMateriaValidation,
  eliminarMateriaValidation
};