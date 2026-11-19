

const { sequelize, Materia, AlumnoXMateria } = require('../models');
const { QueryTypes } = require('sequelize');

function crearError(mensaje, statusCode) {
  const err = new Error(mensaje);
  err.statusCode = statusCode;
  return err;
}

/**
 * R7 — Valida que todas las materias existan, estén activas y figuren
 * como aprobadas (EsAprobada_AxM) para el alumno.
 */
function validarMateriasAprobadas(ids, materias, filasDelAlumno) {
  const encontradas = new Set(materias.map(m => m.IdMateria_Ma));
  const inexistentes = ids.filter(id => !encontradas.has(id));
  if (inexistentes.length > 0) {
    throw crearError(`No existen materias con id: ${inexistentes.join(', ')}`, 404);
  }

  const inactivas = materias.filter(m => !m.Estado_Ma);
  if (inactivas.length > 0) {
    throw crearError(`Las siguientes materias no están activas: ${inactivas.map(m => m.Nombre_Ma).join(', ')}`, 400);
  }

  const aprobadas = new Set(filasDelAlumno.filter(f => f.EsAprobada_AxM).map(f => f.IdMateria_Ma_AxM));
  const noAprobadas = materias.filter(m => !aprobadas.has(m.IdMateria_Ma));
  if (noAprobadas.length > 0) {
    throw crearError(
      `Solo podés postularte para materias que tenés aprobadas. No aprobadas: ${noAprobadas.map(m => m.Nombre_Ma).join(', ')}`,
      400
    );
  }
}

/**
 * R7 — Evita postulaciones duplicadas: si ya es tutor de alguna, se rechaza todo.
 */
function verificarPostulacionesDuplicadas(materias, filasDelAlumno) {
  const yaEsTutor = new Set(filasDelAlumno.filter(f => f.EsTutor_AxM).map(f => f.IdMateria_Ma_AxM));
  const duplicadas = materias.filter(m => yaEsTutor.has(m.IdMateria_Ma));
  if (duplicadas.length > 0) {
    throw crearError(`Ya existe una postulación activa para: ${duplicadas.map(m => m.Nombre_Ma).join(', ')}`, 409);
  }
}

/**
 * R7 — Postular al alumno como tutor de una o más materias aprobadas.
 * Marca EsTutor_AxM = true y guarda la descripción en DescripcionTutor_AxM.
 *
 * @param {string} dni - DNI del alumno logueado
 * @param {number[]} idsMaterias
 * @param {string} descripcion - Propuesta o disponibilidad
 */
async function postularTutoria(dni, idsMaterias, descripcion) {
  const ids = [...new Set(idsMaterias)];

  const materias = await Materia.findAll({ where: { IdMateria_Ma: ids } });
  const filasDelAlumno = await AlumnoXMateria.findAll({
    where: { Dni_A_AxM: dni, IdMateria_Ma_AxM: ids }
  });

  validarMateriasAprobadas(ids, materias, filasDelAlumno);
  verificarPostulacionesDuplicadas(materias, filasDelAlumno);

  // El WHERE repite las validaciones: si otra petición se coló en el medio,
  // la cantidad de filas no coincide y la transacción se revierte
  await sequelize.transaction(async (transaction) => {
    const [filasActualizadas] = await AlumnoXMateria.update(
      { EsTutor_AxM: true, DescripcionTutor_AxM: descripcion },
      {
        where: { Dni_A_AxM: dni, IdMateria_Ma_AxM: ids, EsAprobada_AxM: true, EsTutor_AxM: false },
        transaction
      }
    );
    if (filasActualizadas !== ids.length) {
      throw crearError('Ya existe una postulación activa para alguna de las materias', 409);
    }
  });

  return {
    descripcion,
    materias: materias.map(m => ({ idMateria: m.IdMateria_Ma, nombre: m.Nombre_Ma }))
  };
}

async function buscarTutores({ dniSolicitante, carrera, materia }) {
  const condiciones = [
    'axm.estutor_axm = true',
    'axm.esaprobada_axm = true',
    'p.estado_p = true',
    'm.estado_ma = true',
    'c.estado_ca = true',
    'p.dni_p <> :dniSolicitante'
  ];
  const replacements = { dniSolicitante };

  if (carrera) {
    condiciones.push('c.idcarrera_ca = :carrera');
    replacements.carrera = carrera;
  }
  if (materia) {
    condiciones.push('m.idmateria_ma = :materia');
    replacements.materia = materia;
  }

  return sequelize.query(`
    SELECT
      p.dni_p                   AS "dni",
      p.nombre_p                AS "nombre",
      p.apellido_p              AS "apellido",
      p.correoinstitucional_p   AS "correo",
      a.fotoperfil_a            AS "fotoPerfil",
      a.descripcion_a           AS "bio",
      axm.descripciontutor_axm  AS "descripcionTutoria",
      m.idmateria_ma            AS "idMateria",
      m.nombre_ma               AS "materia",
      c.idcarrera_ca            AS "idCarrera",
      c.nombre_ca               AS "carrera"
    FROM alumnosxmaterias axm
    JOIN alumnos a   ON axm.dni_a_axm = a.dni_p_a
    JOIN personas p  ON a.dni_p_a = p.dni_p
    JOIN materias m  ON axm.idmateria_ma_axm = m.idmateria_ma
    JOIN carreras c  ON m.idcarrera_ca_ma = c.idcarrera_ca
    WHERE ${condiciones.join(' AND ')}
    ORDER BY m.nombre_ma, p.apellido_p, p.nombre_p;
  `, { replacements, type: QueryTypes.SELECT });
}

module.exports = {
  validarMateriasAprobadas,
  verificarPostulacionesDuplicadas,
  postularTutoria,
  buscarTutores
};
