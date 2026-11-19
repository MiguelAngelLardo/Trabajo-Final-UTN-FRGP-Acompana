
const { Router } = require('express');
const materiaAprobadaController = require('../controllers/materiaAprobada.controller');
const requireAuth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const {
  listarMateriasAprobadasValidation,
  listarMateriasDisponiblesValidation,
  registrarMateriaAprobadaValidation
} = require('../validations/materiaAprobada.validation');

const router = Router();

router.get('/', requireAuth, requireRole('Alumno'), listarMateriasAprobadasValidation, materiaAprobadaController.listarMateriasAprobadas);
router.get('/disponibles', requireAuth, requireRole('Alumno'), listarMateriasDisponiblesValidation, materiaAprobadaController.listarMateriasDisponibles);
router.post('/', requireAuth, requireRole('Alumno'), registrarMateriaAprobadaValidation, materiaAprobadaController.registrarMateriaAprobada);

module.exports = router;
