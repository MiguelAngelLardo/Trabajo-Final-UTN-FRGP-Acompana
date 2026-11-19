// Rutas de moderación de apuntes — R10. Solo Admin.

const { Router } = require('express');
const moderacionController = require('../controllers/moderacion.controller');
const requireAuth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');

const router = Router();

router.get('/', requireAuth, requireRole('Admin'), moderacionController.listarApuntes);
router.patch('/:id/estado', requireAuth, requireRole('Admin'), moderacionController.cambiarEstadoApunte);

module.exports = router;