const storage = require('./storage');
const { Op } = require('sequelize');
const { Apunte, AlumnoXMateria, Materia, Carrera, Alumno, Persona } = require('../models');

const LIMITE_POR_DEFECTO = 10;
const LIMITE_MAXIMO = 50;

function crearError(message, statusCode) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}
const INCLUIR_MATERIA = {
  model: Materia,
  as: 'materia',
  attributes: ['IdMateria_Ma', 'Nombre_Ma']
};

async function validarMateriaAprobada(dni, idMateria) {
  const registro = await AlumnoXMateria.findOne({
    where: {
      Dni_A_AxM: dni,
      IdMateria_Ma_AxM: idMateria,
      EsAprobada_AxM: true
    }
  });

  if (!registro) {
    throw crearError('No puede subir apuntes de una materia no aprobada.', 400);
  }
}

function formatearApunte(apunte) {
  return {
    id: apunte.IdApuntes_Ap,
    idMateria: apunte.IdMateria_Ma_Ap,
    nombre: apunte.Nombre_Ap,
    descripcion: apunte.Descripcion_Ap,
    estado: apunte.Estado_Ap
  };
}

async function cargarApunte({ dni, idMateria, nombre, descripcion, archivo }) {
  await validarMateriaAprobada(dni, idMateria);

  const ruta = await storage.guardar(archivo, `apuntes/${dni}`);

  try {
    const apunte = await Apunte.create({
      Dni_A_Ap: dni,
      IdMateria_Ma_Ap: idMateria,
      Nombre_Ap: nombre,
      Descripcion_Ap: descripcion || null,
      RutaArchivo_Ap: ruta,
      Estado_Ap: true
    });
    return formatearApunte(apunte);
  } catch (error) {
    await storage.eliminar(ruta).catch(() => {}); 
    throw error;
  }
}

async function eliminarApunte({ dni, idApunte }) {
  const apunte = await Apunte.findByPk(idApunte);

  if (!apunte || !apunte.Estado_Ap) {
    throw crearError('El apunte no existe.', 404);
  }

  if (String(apunte.Dni_A_Ap) !== String(dni)) {
    throw crearError('No puede eliminar un apunte que no le pertenece.', 400);
  }

  await apunte.update({ Estado_Ap: false });
}

async function listarMisApuntes(dni) {
  const apuntes = await Apunte.findAll({
    where: { Dni_A_Ap: dni, Estado_Ap: true },
    include: [INCLUIR_MATERIA],
    order: [['IdApuntes_Ap', 'DESC']] // los más recientes primero
  });

  return apuntes.map(formatearApunte);
}
function escaparLike(texto) {
  return texto.replace(/[\\%_]/g, '\\$&');
}

function formatearResultado(apunte) {
  const materia = apunte.materia;
  const persona = apunte.alumno && apunte.alumno.persona;
  return {
    id: apunte.IdApuntes_Ap,
    idMateria: apunte.IdMateria_Ma_Ap,
    nombre: apunte.Nombre_Ap,
    descripcion: apunte.Descripcion_Ap,
    materia: materia ? materia.Nombre_Ma : null,
    carrera: materia && materia.carrera ? materia.carrera.Nombre_Ca : null,
    autor: persona ? `${persona.Nombre_P} ${persona.Apellido_P}` : null
  };
}

async function buscarApuntes({ idMateria, idCarrera, q, page, limit }) {
  const pagina = Number(page) || 1;
  const limite = Math.min(Number(limit) || LIMITE_POR_DEFECTO, LIMITE_MAXIMO);

  const where = { Estado_Ap: true };
  if (idMateria) where.IdMateria_Ma_Ap = idMateria;
  if (q) where.Nombre_Ap = { [Op.iLike]: `%${escaparLike(q)}%` };

  // La carrera se filtra a través de la materia
  const incluirMateria = {
    model: Materia,
    as: 'materia',
    attributes: ['IdMateria_Ma', 'Nombre_Ma'],
    required: true,
    include: [{ model: Carrera, as: 'carrera', attributes: ['IdCarrera_Ca', 'Nombre_Ca'] }]
  };
  if (idCarrera) incluirMateria.where = { IdCarrera_Ca_Ma: idCarrera };

  const { count, rows } = await Apunte.findAndCountAll({
    where,
    include: [
      incluirMateria,
      {
        model: Alumno,
        as: 'alumno',
        attributes: ['Dni_P_A'],
        include: [{ model: Persona, as: 'persona', attributes: ['Nombre_P', 'Apellido_P'] }]
      }
    ],
    order: [['IdApuntes_Ap', 'DESC']],
    limit: limite,
    offset: (pagina - 1) * limite
  });

  return {
    resultados: rows.map(formatearResultado),
    paginacion: {
      pagina,
      limite,
      total: count,
      totalPaginas: Math.ceil(count / limite)
    }
  };
}

async function obtenerArchivoApunte(idApunte) {
  const apunte = await Apunte.findOne({
    where: { IdApuntes_Ap: idApunte, Estado_Ap: true }
  });

  if (!apunte) {
    throw crearError('El apunte no existe.', 404);
  }

  try {
    const stream = await storage.obtenerStream(apunte.RutaArchivo_Ap);
    return { stream, nombreArchivo: `${apunte.Nombre_Ap}.pdf` };
  } catch (err) {
    // El detalle real queda en la terminal; al alumno le llega un mensaje genérico
    console.error(`No se pudo leer el archivo del apunte ${idApunte}:`, err.message);
    throw crearError('El apunte no puede descargarse en este momento.', 404);
  }
}

module.exports = { cargarApunte, eliminarApunte, listarMisApuntes, buscarApuntes, obtenerArchivoApunte };