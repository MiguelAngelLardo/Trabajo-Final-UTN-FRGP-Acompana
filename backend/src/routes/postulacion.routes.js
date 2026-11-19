
const { Router } = require('express');
const tutoriaController = require('../controllers/tutoria.controller');
const requireAuth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const { postulacionValidation } = require('../validations/tutoria.validation');

const router = Router();

router.post('/postulaciones', requireAuth, requireRole('Alumno'), postulacionValidation, tutoriaController.postular);

module.exports = router;
