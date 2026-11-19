const { Router } = require('express');
const apunteController = require('../controllers/apunte.controller');
const requireAuth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const subirArchivoApunte = require('../middlewares/uploadApunte.middleware');
const {
cargarApunteValidation,
  eliminarApunteValidation,
  buscarApuntesValidation,
  descargarApunteValidation
} = require('../validations/apunte.validation');

const router = Router();

router.post(
  '/',
  requireAuth,
  requireRole('Alumno'),
  subirArchivoApunte,
  cargarApunteValidation,
  apunteController.cargar
);

router.get('/mios', requireAuth, requireRole('Alumno'), apunteController.listarMios);
router.delete('/:id', requireAuth, requireRole('Alumno'), eliminarApunteValidation, apunteController.eliminar);
router.get('/', requireAuth, buscarApuntesValidation, apunteController.buscar);
router.get('/:id/descargar', requireAuth, descargarApunteValidation, apunteController.descargar);

module.exports = router;