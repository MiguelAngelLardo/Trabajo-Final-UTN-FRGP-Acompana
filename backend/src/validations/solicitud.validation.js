const { body, param, query } = require('express-validator');
const { ESTADOS_SOLICITUD } = require('../models/Solicitud');
const { MEDIOS_CONTACTO } = require('../services/solicitud.service');

const crearSolicitudValidation = [
  body('dniTutor').trim().notEmpty().withMessage('El tutor es obligatorio').matches(/^[1-9][0-9]{6,7}$/).withMessage('El DNI del tutor no es válido'),
  body('idMateria').notEmpty().withMessage('La materia es obligatoria').isInt({ min: 1 }).withMessage('La materia debe ser un id válido').toInt(),
  body('medioContacto').optional({ values: 'falsy' }).isIn(Object.keys(MEDIOS_CONTACTO)).withMessage(`El medio de contacto debe ser ${Object.keys(MEDIOS_CONTACTO).join(', ')}`),
  body('apoyo').optional({ values: 'falsy' }).trim().isLength({ max: 200 }).withMessage('El apoyo no puede superar 200 caracteres')
];

const listarRecibidasValidation = [
  query('estado').optional().isIn(ESTADOS_SOLICITUD).withMessage(`El estado debe ser ${ESTADOS_SOLICITUD.join(', ')}`)
];

const responderSolicitudValidation = [
  param('id').isInt({ min: 1 }).withMessage('El id de la solicitud no es válido').toInt(),
  body('decision').isIn(['Aceptada', 'Rechazada']).withMessage('La decisión debe ser Aceptada o Rechazada')
];

const avisosValidation = [
  query('desde').optional().isISO8601({ strict: true }).withMessage('La fecha debe tener formato AAAA-MM-DD')
];

module.exports = { crearSolicitudValidation, listarRecibidasValidation, responderSolicitudValidation, avisosValidation };
