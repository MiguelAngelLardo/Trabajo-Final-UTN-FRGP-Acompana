const { Router } = require('express');
const authRoutes = require('./auth.routes');
const usuarioRoutes = require('./usuario.routes');
const moderacionRoutes = require('./moderacion.routes'); // Fase 5
const tutoriaRoutes = require('./tutoria.routes');
const postulacionRoutes = require('./postulacion.routes');
const solicitudRoutes = require('./solicitud.routes');
const catalogoRoutes = require('./catalogo.routes');
const materiaAprobadaRoutes = require('./materiaAprobada.routes');
const apunteRoutes = require('./apunte.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/moderacion', moderacionRoutes);
router.use('/tutores', tutoriaRoutes);
router.use('/tutorias', postulacionRoutes);
router.use('/solicitudes', solicitudRoutes);

router.use('/catalogo', catalogoRoutes);
router.use('/materias-aprobadas', materiaAprobadaRoutes);
router.use('/apuntes', apunteRoutes);
module.exports = router;