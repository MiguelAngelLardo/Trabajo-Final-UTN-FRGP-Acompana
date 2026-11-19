// Servicio de usuario — R1 (perfil propio) y R9 (gestión admin).
// Contiene la lógica de negocio real, hablando con la base vía Sequelize.

const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { Persona, Alumno, sequelize } = require('../models');

const SALT_ROUNDS = 10;

// Campos editables por el propio alumno, SEPARADOS por la tabla
// real a la que pertenecen — Telefono_P/Direccion_P viven en
// Personas, Descripcion_A vive en Alumnos. Un solo array plano
// no alcanza, porque cada tabla se actualiza con su propio
// modelo de Sequelize.
const CAMPOS_PERSONA = ['Telefono_P', 'Direccion_P', 'Sexo_P'];
const CAMPOS_ALUMNO = ['Descripcion_A'];

/**
 * R1 — Obtener el perfil propio (Persona + datos de Alumno si corresponde).
 */
async function obtenerPerfil(dni) {
  const persona = await Persona.findByPk(dni, {
    include: [{ model: Alumno, as: 'alumno' }]
  });

  if (!persona) {
    const err = new Error('Usuario no encontrado');
    err.statusCode = 404;
    throw err;
  }

  return {
    dni: persona.Dni_P,
    nombre: persona.Nombre_P,
    apellido: persona.Apellido_P,
    correo: persona.CorreoInstitucional_P,
    telefono: persona.Telefono_P,
    direccion: persona.Direccion_P,
    sexo: persona.Sexo_P,
    estado: persona.Estado_P,
    legajo: persona.alumno ? persona.alumno.Legajo_A : null,
    descripcion: persona.alumno ? persona.alumno.Descripcion_A : null,
    fotoPerfil: persona.alumno ? persona.alumno.FotoPerfil_A : null
  };
}

/**
 * R1 — Editar SOLO los campos permitidos del propio perfil.
 * Actualiza Persona y Alumno por separado, cada uno con su
 * propio modelo — porque son dos tablas distintas.
 */
async function editarPerfilPropio(dni, datos) {
  const persona = await Persona.findByPk(dni, {
    include: [{ model: Alumno, as: 'alumno' }]
  });

  if (!persona) {
    const err = new Error('Usuario no encontrado');
    err.statusCode = 404;
    throw err;
  }

  const cambiosPersona = {};
  for (const campo of CAMPOS_PERSONA) {
    if (datos[campo] !== undefined) {
      cambiosPersona[campo] = datos[campo];
    }
  }

  const cambiosAlumno = {};
  for (const campo of CAMPOS_ALUMNO) {
    if (datos[campo] !== undefined) {
      cambiosAlumno[campo] = datos[campo];
    }
  }

  if (Object.keys(cambiosPersona).length === 0 && Object.keys(cambiosAlumno).length === 0) {
    const err = new Error('No se enviaron campos válidos para actualizar');
    err.statusCode = 400;
    throw err;
  }

  if (Object.keys(cambiosPersona).length > 0) {
    await persona.update(cambiosPersona);
  }

  if (Object.keys(cambiosAlumno).length > 0 && persona.alumno) {
    await persona.alumno.update(cambiosAlumno);
  }

  return await obtenerPerfil(dni);
}

/**
 * R9 — Admin busca usuarios por legajo, correo o nombre.
 */
async function buscarUsuarios(q, pagina = 1, porPagina = 10) {
  const where = {};

  if (q) {
    where[Op.or] = [
      { Dni_P: { [Op.iLike]: `%${q}%` } },
      { Nombre_P: { [Op.iLike]: `%${q}%` } },
      { Apellido_P: { [Op.iLike]: `%${q}%` } },
      { CorreoInstitucional_P: { [Op.iLike]: `%${q}%` } },
      sequelize.literal(`"alumno"."legajo_a" ILIKE '%${q.replace(/'/g, "''")}%'`)
    ];
  }

  const offset = (pagina - 1) * porPagina;

  const { count, rows } = await Persona.findAndCountAll({
  where,
  include: [
    { model: Alumno, as: 'alumno', required: true },
  ],
  order: [['Apellido_P', 'ASC']],
  limit: porPagina,
  offset,
  subQuery: false
})

  return {
    usuarios: rows.map(p => ({
      dni: p.Dni_P,
      nombre: p.Nombre_P,
      apellido: p.Apellido_P,
      correo: p.CorreoInstitucional_P,
      estado: p.Estado_P,
      legajo: p.alumno ? p.alumno.Legajo_A : null
    })),
    total: count,
    pagina,
    totalPaginas: Math.ceil(count / porPagina)
  };
}

/**
 * R9 — Admin habilita o deshabilita una cuenta.
 */
async function cambiarEstado(dni, estado) {
  if (typeof estado !== 'boolean') {
    const err = new Error('El estado debe ser true o false');
    err.statusCode = 400;
    throw err;
  }

  const persona = await Persona.findByPk(dni);

  if (!persona) {
    const err = new Error('Usuario no encontrado');
    err.statusCode = 404;
    throw err;
  }

  if (persona.Estado_P === estado) {
    const err = new Error(`El usuario ya se encuentra ${estado ? 'habilitado' : 'deshabilitado'}`);
    err.statusCode = 400;
    throw err;
  }

  await persona.update({ Estado_P: estado });

  return { dni: persona.Dni_P, estado: persona.Estado_P };
}

/**
 * R1 — Guardar la ruta de la foto de perfil recién subida.
 * @param {string} dni
 * @param {string} rutaArchivo - ruta relativa donde multer guardó el archivo
 */
async function guardarFotoPerfil(dni, rutaArchivo) {
  const persona = await Persona.findByPk(dni, {
    include: [{ model: Alumno, as: 'alumno' }]
  });

  if (!persona || !persona.alumno) {
    const err = new Error('Usuario no encontrado');
    err.statusCode = 404;
    throw err;
  }

  await persona.alumno.update({ FotoPerfil_A: rutaArchivo });

  return await obtenerPerfil(dni);
}


// Campos que el ADMIN sí puede editar de un usuario ajeno
// (identidad institucional — distinto de la lista blanca del
// propio alumno, que solo toca teléfono/dirección/descripción)
const CAMPOS_ADMIN_PUEDE_EDITAR_PERSONA = ['Nombre_P', 'Apellido_P', 'CorreoInstitucional_P'];
const CAMPOS_ADMIN_PUEDE_EDITAR_ALUMNO = ['Legajo_A'];

/**
 * R9 — Admin edita los datos de OTRO usuario (no el estado, eso
 * va por cambiarEstado). Nunca toca Dni_P — es inmutable siempre.
 */
async function editarUsuarioAdmin(dni, datos) {
  const persona = await Persona.findByPk(dni, {
    include: [{ model: Alumno, as: 'alumno' }]
  });

  if (!persona) {
    const err = new Error('Usuario no encontrado');
    err.statusCode = 404;
    throw err;
  }

  // Si cambia el correo, validar que no esté en uso por otra persona
  if (datos.CorreoInstitucional_P && datos.CorreoInstitucional_P !== persona.CorreoInstitucional_P) {
    const correoExistente = await Persona.findOne({ where: { CorreoInstitucional_P: datos.CorreoInstitucional_P } });
    if (correoExistente) {
      const err = new Error('El correo ya está en uso por otro usuario');
      err.statusCode = 400;
      throw err;
    }
  }

  // Si cambia el legajo (solo aplica si es alumno), validar unicidad
  if (datos.Legajo_A && persona.alumno && datos.Legajo_A !== persona.alumno.Legajo_A) {
    const legajoExistente = await Alumno.findOne({ where: { Legajo_A: datos.Legajo_A } });
    if (legajoExistente) {
      const err = new Error('El legajo ya está en uso por otro usuario');
      err.statusCode = 400;
      throw err;
    }
  }

  const cambiosPersona = {};
  for (const campo of CAMPOS_ADMIN_PUEDE_EDITAR_PERSONA) {
    if (datos[campo] !== undefined) cambiosPersona[campo] = datos[campo];
  }

  const cambiosAlumno = {};
  for (const campo of CAMPOS_ADMIN_PUEDE_EDITAR_ALUMNO) {
    if (datos[campo] !== undefined) cambiosAlumno[campo] = datos[campo];
  }

  if (Object.keys(cambiosPersona).length === 0 && Object.keys(cambiosAlumno).length === 0) {
    const err = new Error('No se enviaron campos válidos para actualizar');
    err.statusCode = 400;
    throw err;
  }

  if (Object.keys(cambiosPersona).length > 0) {
    await persona.update(cambiosPersona);
  }
  if (Object.keys(cambiosAlumno).length > 0 && persona.alumno) {
    await persona.alumno.update(cambiosAlumno);
  }

  return await obtenerPerfil(dni);
}


/**
 * R1 — El propio alumno cambia SU contraseña.
 * Exige la contraseña ACTUAL para evitar que alguien con el
 * token robado (pero sin la clave) pueda secuestrar la cuenta.
 */
async function cambiarContrasenaPropia(dni, contrasenaActual, contrasenaNueva) {
  const persona = await Persona.findByPk(dni);

  if (!persona) {
    const err = new Error('Usuario no encontrado');
    err.statusCode = 404;
    throw err;
  }

  const actualValida = await bcrypt.compare(contrasenaActual, persona.Contrasena_P);
  if (!actualValida) {
    const err = new Error('La contraseña actual es incorrecta');
    err.statusCode = 401;
    throw err;
  }

  const hashNuevo = await bcrypt.hash(contrasenaNueva, SALT_ROUNDS);
  await persona.update({ Contrasena_P: hashNuevo });

  // No devolvemos el perfil completo con la contraseña —
  // devolvemos solo una confirmación simple
  return { dni: persona.Dni_P, mensaje: 'Contraseña actualizada' };
}

module.exports = { obtenerPerfil, editarPerfilPropio, buscarUsuarios, cambiarEstado, guardarFotoPerfil, editarUsuarioAdmin, cambiarContrasenaPropia };