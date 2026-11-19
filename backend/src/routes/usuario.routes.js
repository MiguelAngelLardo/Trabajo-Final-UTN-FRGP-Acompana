// Rutas de usuario — R1 (perfil propio) y R9 (gestión admin).
// GET   /usuarios/me            → cualquier logueado, ver su propio perfil
// PATCH /usuarios/me            → cualquier logueado, editar su propio perfil (parcial)
// PATCH /usuarios/me/foto       → cualquier logueado, subir/reemplazar su foto
// PATCH /usuarios/me/contrasena → cualquier logueado, cambiar su propia contraseña
// GET   /usuarios               → solo admin, buscar cualquier usuario
// POST  /usuarios               → solo admin, dar de alta una cuenta nueva
// PATCH /usuarios/:dni          → solo admin, editar datos de otro usuario
// PATCH /usuarios/:dni/estado   → solo admin, habilitar/deshabilitar (parcial)

const { Router } = require('express');
const usuarioController = require('../controllers/usuario.controller');
const requireAuth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const { editarPerfilValidation, cambiarEstadoValidation, editarUsuarioAdminValidation, cambiarContrasenaValidation } = require('../validations/usuario.validation');
const { registroValidation } = require('../validations/auth.validation');
const uploadFotoPerfil = require('../middlewares/fotoPerfil.middleware');

const router = Router();

// R1 — Ver mi propio perfil
router.get('/me', requireAuth, usuarioController.obtenerMiPerfil);

// R1 — Editar mi propio perfil (cambio parcial: Telefono_P, Direccion_P, Sexo_P, Descripcion_A)
router.patch('/me', requireAuth, editarPerfilValidation, usuarioController.editarMiPerfil);





// R1 — Subir/reemplazar mi foto de perfil
router.patch('/me/foto', requireAuth, (req, res, next) => {
  uploadFotoPerfil.single('foto')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ ok: false, message: 'La imagen no puede superar los 2MB' });
      }
      return res.status(400).json({ ok: false, message: err.message });
    }
    next();
  });
}, usuarioController.subirFotoPerfil);





// R1 — Cambiar mi propia contraseña (exige la actual)
router.patch('/me/contrasena', requireAuth, cambiarContrasenaValidation, usuarioController.cambiarContrasenaPropia);

// R9 — Admin busca usuarios (por DNI, legajo, correo o nombre)
router.get('/', requireAuth, requireRole('Admin'), usuarioController.buscarUsuarios);

// R9 — Admin da de alta una cuenta nueva (reusa la validación y
// la lógica transaccional de R1 — mismo registro, protegido por rol)
router.post('/', requireAuth, requireRole('Admin'), registroValidation, usuarioController.crearUsuarioAdmin);

// R9 — Admin edita datos de otro usuario (nombre, apellido, correo, legajo)
router.patch('/:dni', requireAuth, requireRole('Admin'), editarUsuarioAdminValidation, usuarioController.editarUsuarioAdmin);

// R9 — Admin habilita/deshabilita una cuenta (cambio parcial)
router.patch('/:dni/estado', requireAuth, requireRole('Admin'), cambiarEstadoValidation, usuarioController.cambiarEstado);

module.exports = router;