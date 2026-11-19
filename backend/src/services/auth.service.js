const bcrypt = require('bcryptjs');   // antes decía 'bcrypt'
const jwt = require('jsonwebtoken');
const { Persona, Alumno, Administrador, AlumnoXCarrera, Carrera, sequelize } = require('../models');

const SALT_ROUNDS = 10;

/**
 * Determina el rol de una persona según en qué subtabla está su DNI.
 * @param {string} dni
 * @returns {Promise<string>} 'Admin' | 'Alumno'
 */
async function determinarRol(dni) {
  const admin = await Administrador.findByPk(dni);
  if (admin) return 'Admin';
  return 'Alumno';
}

/**
 * R1 — Registrar un nuevo alumno.
 * Inserta en Personas, Alumnos y ALUMNOSxCARRERAS dentro de una transacción.
 *
 * @param {Object} datos - Datos del formulario de registro
 * @returns {Object} El alumno creado con sus datos de persona
 * @throws {Error} Si el DNI, correo o legajo ya están registrados
 */
async function registrarAlumno(datos) {
  const { dni, nombre, apellido, correo, telefono, contrasena, legajo, sexo, direccion, descripcion, carrera } = datos;

  // --- Validaciones de unicidad ---
  const personaExistente = await Persona.findByPk(dni);
  if (personaExistente) {
    const err = new Error('El DNI ya está registrado');
    err.statusCode = 400;
    throw err;
  }

  const correoExistente = await Persona.findOne({ where: { CorreoInstitucional_P: correo } });
  if (correoExistente) {
    const err = new Error('El correo institucional ya está en uso');
    err.statusCode = 400;
    throw err;
  }

  const legajoExistente = await Alumno.findOne({ where: { Legajo_A: legajo } });
  if (legajoExistente) {
    const err = new Error('El legajo ya está registrado');
    err.statusCode = 400;
    throw err;
  }

  // Verificar que la carrera exista
  const carreraExiste = await Carrera.findByPk(carrera);
  if (!carreraExiste) {
    const err = new Error('La carrera seleccionada no existe');
    err.statusCode = 400;
    throw err;
  }

  // --- Transacción: insertar Persona + Alumno + AlumnoXCarrera ---
  const transaction = await sequelize.transaction();

  try {
    // Hashear contraseña
    const contrasenaHash = await bcrypt.hash(contrasena, SALT_ROUNDS);

    // 1. Crear Persona
    const persona = await Persona.create({
      Dni_P: dni,
      CorreoInstitucional_P: correo,
      Contrasena_P: contrasenaHash,      // ← corregido
      Nombre_P: nombre,
      Apellido_P: apellido,
      Sexo_P: sexo,
      Direccion_P: direccion,
      Telefono_P: telefono,
      Estado_P: true
    }, { transaction });

    // 2. Crear Alumno
    const alumno = await Alumno.create({
      Dni_P_A: dni,
      Legajo_A: legajo,
      FotoPerfil_A: null,
      Descripcion_A: descripcion || null
    }, { transaction });

    // 3. Asociar con la carrera
    await AlumnoXCarrera.create({
      Dni_A_AxC: dni,               // ← corregido
      IdCarrera_Ca_AxC: carrera     // ← corregido
    }, { transaction });

    await transaction.commit();

    // Retornar sin la contraseña
    return {
      dni: persona.Dni_P,
      nombre: persona.Nombre_P,
      apellido: persona.Apellido_P,
      correo: persona.CorreoInstitucional_P,
      sexo: persona.Sexo_P,
      direccion: persona.Direccion_P,
      telefono: persona.Telefono_P,
      legajo: alumno.Legajo_A,
      carrera: carrera,
      estado: persona.Estado_P
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * R2 — Iniciar sesión.
 * Busca por correo, compara contraseña con bcrypt, genera JWT.
 * El rol se determina chequeando si el DNI está en Administradores o Alumnos.
 *
 * @param {string} correo - Correo institucional
 * @param {string} contrasena - Contraseña en texto plano
 * @returns {Object} Token JWT y datos del usuario
 * @throws {Error} Si las credenciales son incorrectas o la cuenta está deshabilitada
 */
async function login(correo, contrasena) {
  // Buscar persona por correo
  const persona = await Persona.findOne({
    where: { CorreoInstitucional_P: correo },
    include: [{ model: Alumno, as: 'alumno' }]
  });

  if (!persona) {
    const err = new Error('Correo o contraseña incorrectos');
    err.statusCode = 401;
    throw err;
  }

  // Verificar que no esté deshabilitada (Estado_P = false)
  if (!persona.Estado_P) {
    const err = new Error('La cuenta se encuentra deshabilitada. Contacte al administrador.');
    err.statusCode = 403;
    throw err;
  }

  // Comparar contraseña
  const contrasenaValida = await bcrypt.compare(contrasena, persona.Contrasena_P);
  if (!contrasenaValida) {
    const err = new Error('Correo o contraseña incorrectos');
    err.statusCode = 401;
    throw err;
  }

  // Determinar rol (chequear en qué subtabla está)
  const rol = await determinarRol(persona.Dni_P);

  // Generar JWT
  const payload = {
    dni: persona.Dni_P,
    correo: persona.CorreoInstitucional_P,
    rol: rol
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });

  return {
    token,
    usuario: {
      dni: persona.Dni_P,
      nombre: persona.Nombre_P,
      apellido: persona.Apellido_P,
      correo: persona.CorreoInstitucional_P,
      rol: rol,
      legajo: persona.alumno ? persona.alumno.Legajo_A : null
    }
  };
}

module.exports = { registrarAlumno, login };
