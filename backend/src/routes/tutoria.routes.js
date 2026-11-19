
const { Router } = require('express');
const tutoriaController = require('../controllers/tutoria.controller');
const requireAuth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const { buscarTutoresValidation } = require('../validations/tutoria.validation');

const router = Router();

router.get('/', requireAuth, requireRole('Alumno'), buscarTutoresValidation, tutoriaController.buscarTutores);

module.exports = router;
