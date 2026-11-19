
const { Router } = require('express');
const solicitudController = require('../controllers/solicitud.controller');
const requireAuth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const {
  crearSolicitudValidation,
  listarRecibidasValidation,
  responderSolicitudValidation,
  avisosValidation
} = require('../validations/solicitud.validation');

const router = Router();

// R6 — el alumno le pide tutoría a un tutor
router.post('/', requireAuth, requireRole('Alumno'), crearSolicitudValidation, solicitudController.crearSolicitud);

// R8 — bandeja del tutor, decisión ✔/✘ y avisos de rechazo para el alumno
router.get('/recibidas', requireAuth, requireRole('Alumno'), listarRecibidasValidation, solicitudController.listarRecibidas);
router.get('/avisos', requireAuth, requireRole('Alumno'), avisosValidation, solicitudController.listarAvisos);
router.patch('/:id', requireAuth, requireRole('Alumno'), responderSolicitudValidation, solicitudController.responderSolicitud);

module.exports = router;
