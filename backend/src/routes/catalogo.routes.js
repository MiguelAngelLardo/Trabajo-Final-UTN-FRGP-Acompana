// Rutas de catálogo — R11 (gestionar carreras y materias).
// GET    /catalogo/carreras                      → listado de carreras (filtros: estado, q)
// GET    /catalogo/materias                      → listado de materias (filtros: estado, q, idCarrera)
// GET    /catalogo/mis-carreras                  → carreras del alumno (solo alumno, R3)
// POST   /catalogo/carreras                      → alta de carrera (solo moderador)
// POST   /catalogo/materias                      → alta de materia (solo moderador)
// PATCH  /catalogo/carreras/:idCarrera           → renombrar carrera (solo moderador)
// PATCH  /catalogo/materias/:idMateria           → renombrar materia (solo moderador)
// PATCH  /catalogo/carreras/:idCarrera/baja      → baja lógica + cascada a materias (solo moderador)
// PATCH  /catalogo/materias/:idMateria/baja      → baja lógica de materia (solo moderador)
// PATCH  /catalogo/carreras/:idCarrera/reactivar → reactivar carrera + sus materias (solo moderador)
// PATCH  /catalogo/materias/:idMateria/reactivar → reactivar materia (solo moderador)
// DELETE /catalogo/carreras/:idCarrera           → eliminar carrera, solo sin dependencias (solo moderador)
// DELETE /catalogo/materias/:idMateria           → eliminar materia, solo sin dependencias (solo moderador)

const { Router } = require('express');
const catalogoController = require('../controllers/catalogo.controller');
const requireAuth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const {
  listarCarrerasValidation,
  listarMateriasValidation,
  crearCarreraValidation,
  crearMateriaValidation,
  editarCarreraValidation,
  editarMateriaValidation,
  bajaCarreraValidation,
  bajaMateriaValidation,
  reactivarCarreraValidation,
  reactivarMateriaValidation,
  eliminarCarreraValidation,
  eliminarMateriaValidation
} = require('../validations/catalogo.validation');

const router = Router();
const soloAdmin = [requireAuth, requireRole('Admin')];

// --- Listados (cualquier logueado; el service filtra según el rol) ---
router.get('/carreras', requireAuth, listarCarrerasValidation, catalogoController.listarCarreras);
router.get('/materias', requireAuth, listarMateriasValidation, catalogoController.listarMaterias);
router.get('/mis-carreras', requireAuth, requireRole('Alumno'), catalogoController.listarMisCarreras);

// --- Altas ---
router.post('/carreras', ...soloAdmin, crearCarreraValidation, catalogoController.crearCarrera);
router.post('/materias', ...soloAdmin, crearMateriaValidation, catalogoController.crearMateria);

// --- Ediciones ---
router.patch('/carreras/:idCarrera', ...soloAdmin, editarCarreraValidation, catalogoController.editarCarrera);
router.patch('/materias/:idMateria', ...soloAdmin, editarMateriaValidation, catalogoController.editarMateria);

// --- Baja lógica y reactivación (la fila no se borra, solo cambia el estado) ---
router.patch('/carreras/:idCarrera/baja', ...soloAdmin, bajaCarreraValidation, catalogoController.bajaCarrera);
router.patch('/materias/:idMateria/baja', ...soloAdmin, bajaMateriaValidation, catalogoController.bajaMateria);
router.patch('/carreras/:idCarrera/reactivar', ...soloAdmin, reactivarCarreraValidation, catalogoController.reactivarCarrera);
router.patch('/materias/:idMateria/reactivar', ...soloAdmin, reactivarMateriaValidation, catalogoController.reactivarMateria);

// --- Eliminación física (409 si tiene dependencias) ---
router.delete('/carreras/:idCarrera', ...soloAdmin, eliminarCarreraValidation, catalogoController.eliminarCarrera);
router.delete('/materias/:idMateria', ...soloAdmin, eliminarMateriaValidation, catalogoController.eliminarMateria);

module.exports = router;