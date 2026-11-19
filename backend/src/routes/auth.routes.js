
const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { registroValidation, loginValidation } = require('../validations/auth.validation');

const router = Router();

// R1 — Registro de alumno
router.post('/register', registroValidation, authController.register);

// R2 — Login
router.post('/login', loginValidation, authController.login);


// Público — carreras activas para el formulario de registro
router.get('/carreras', authController.carrerasParaRegistro);


module.exports = router;
