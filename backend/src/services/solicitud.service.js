

const { Op, QueryTypes } = require('sequelize');
const { sequelize, Persona, Solicitud } = require('../models');

function crearError(mensaje, statusCode) {
  const err = new Error(mensaje);
  err.statusCode = statusCode;
  return err;
}


const MEDIOS_CONTACTO = {
  Mail: 'mail',
  WhatsApp: 'WhatsApp',
  Llamada: 'llamada telefónica'
};

function generarMensaje({ nombre, apellido }, nombreMateria, { medioContacto, apoyo } = {}) {
  const partes = [
    `Hola, soy ${nombre} ${apellido}. Quiero contactarte por ${nombreMateria}.`
  ];
  if (medioContacto) {
    partes.push(`Prefiero que me contacten por ${MEDIOS_CONTACTO[medioContacto]}.`);
  }
  if (apoyo) {
    partes.push(`Apoyo que necesito: ${apoyo}`);
  }
  return partes.join(' ');
}

/**
 * R6 — Verifica que el tutor ofrezca tutoría en esa materia y esté disponible.
 * @returns {Promise<Object>} Nombre de la materia
 */
async function obtenerTutoriaDisponible(dniTutor, idMateria) {
  const [tutoria] = await sequelize.query(`
    SELECT m.nombre_ma AS "materia"
    FROM alumnosxmaterias axm
    JOIN personas p ON axm.dni_a_axm = p.dni_p
    JOIN materias m ON axm.idmateria_ma_axm = m.idmateria_ma
    WHERE axm.dni_a_axm = :dniTutor
      AND axm.idmateria_ma_axm = :idMateria
      AND axm.estutor_axm = true
      AND axm.esaprobada_axm = true
      AND p.estado_p = true
      AND m.estado_ma = true;
  `, { replacements: { dniTutor, idMateria }, type: QueryTypes.SELECT });

  if (!tutoria) {
    throw crearError('El tutor seleccionado no está disponible para esa materia', 404);
  }
  return tutoria;
}


async function crearSolicitud(dniSolicitante, { dniTutor, idMateria, medioContacto, apoyo }) {
  if (dniSolicitante === dniTutor) {
    throw crearError('No podés solicitarte tutoría a vos mismo', 400);
  }

  const { materia } = await obtenerTutoriaDisponible(dniTutor, idMateria);

  const duplicada = await Solicitud.findOne({
    where: {
      DniSolicitante_A_So: dniSolicitante,
      DniTutor_A_So: dniTutor,
      IdMateria_Ma_So: idMateria,
      Estado_So: { [Op.in]: ['Pendiente', 'Aceptada'] }
    }
  });
  if (duplicada) {
    throw crearError(
      `Ya tenés una solicitud ${duplicada.Estado_So.toLowerCase()} con este tutor para esa materia`,
      409
    );
  }

  const solicitante = await Persona.findByPk(dniSolicitante);
  const mensaje = generarMensaje({
    nombre: solicitante.Nombre_P,
    apellido: solicitante.Apellido_P
  }, materia, { medioContacto, apoyo });

  const solicitud = await Solicitud.create({
    DniSolicitante_A_So: dniSolicitante,
    DniTutor_A_So: dniTutor,
    IdMateria_Ma_So: idMateria,
    Estado_So: 'Pendiente',
    Mensaje_So: mensaje
  });

  return {
    idSolicitud: solicitud.IdSolicitudes_So,
    dniTutor,
    idMateria,
    materia,
    estado: solicitud.Estado_So,
    fechaPedido: solicitud.FechaPedido_So,
    mensaje
  };
}

/**
 * R8 — Solicitudes recibidas por el tutor (DniTutor_A_So), con los datos
 * de contacto del solicitante. Las pendientes aparecen primero.
 */
async function listarRecibidas(dniTutor, estado) {
  const replacements = { dniTutor };
  let filtroEstado = '';
  if (estado) {
    filtroEstado = 'AND s.estado_so = :estado';
    replacements.estado = estado;
  }

  return sequelize.query(`
    SELECT
      s.idsolicitudes_so       AS "idSolicitud",
      s.estado_so              AS "estado",
      s.fechapedido_so         AS "fechaPedido",
      s.fecharespuesta_so      AS "fechaRespuesta",
      s.mensaje_so             AS "mensaje",
      m.idmateria_ma           AS "idMateria",
      m.nombre_ma              AS "materia",
      p.dni_p                  AS "dniSolicitante",
      p.nombre_p               AS "nombreSolicitante",
      p.apellido_p             AS "apellidoSolicitante",
      p.correoinstitucional_p  AS "correoSolicitante",
      p.telefono_p             AS "telefonoSolicitante"
    FROM solicitudes s
    JOIN personas p ON s.dnisolicitante_a_so = p.dni_p
    JOIN materias m ON s.idmateria_ma_so = m.idmateria_ma
    WHERE s.dnitutor_a_so = :dniTutor ${filtroEstado}
    ORDER BY (s.estado_so = 'Pendiente') DESC, s.fechapedido_so DESC, s.idsolicitudes_so DESC;
  `, { replacements, type: QueryTypes.SELECT });
}

/**
 * R8 — El tutor acepta o rechaza una solicitud pendiente.
 * Actualiza Estado_So y FechaRespuesta_So.
 *
 * @param {number} idSolicitud
 * @param {string} dniTutor - DNI del tutor logueado
 * @param {'Aceptada'|'Rechazada'} decision
 */
async function responderSolicitud(idSolicitud, dniTutor, decision) {
  const solicitud = await Solicitud.findByPk(idSolicitud);
  if (!solicitud) {
    throw crearError('La solicitud no existe', 404);
  }
  if (solicitud.DniTutor_A_So !== dniTutor) {
    throw crearError('La solicitud no fue dirigida a vos', 403);
  }
  if (solicitud.Estado_So !== 'Pendiente') {
    throw crearError(`La solicitud ya fue ${solicitud.Estado_So.toLowerCase()}`, 400);
  }

  // El WHERE con Estado_So evita responder dos veces si llegan dos pedidos juntos
  const [filasActualizadas] = await Solicitud.update(
    { Estado_So: decision, FechaRespuesta_So: new Date() },
    { where: { IdSolicitudes_So: idSolicitud, Estado_So: 'Pendiente' } }
  );
  if (filasActualizadas === 0) {
    throw crearError('La solicitud ya fue respondida', 400);
  }

  await solicitud.reload();
  return {
    idSolicitud: solicitud.IdSolicitudes_So,
    estado: solicitud.Estado_So,
    fechaRespuesta: solicitud.FechaRespuesta_So
  };
}

/**
 * R8 — Avisos para la campanita del alumno: sus solicitudes ya respondidas
 * (aceptadas o rechazadas).
 * `desde` (AAAA-MM-DD) permite al frontend pedir solo las nuevas desde
 * la última vez que las vio, sin necesidad de una columna de "leído".
 */
async function listarAvisos(dniSolicitante, desde) {
  const replacements = { dniSolicitante };
  let filtroDesde = '';
  if (desde) {
    filtroDesde = 'AND s.fecharespuesta_so >= :desde';
    replacements.desde = desde;
  }

  const avisos = await sequelize.query(`
    SELECT
      s.idsolicitudes_so   AS "idSolicitud",
      s.estado_so          AS "estado",
      s.fechapedido_so     AS "fechaPedido",
      s.fecharespuesta_so  AS "fechaRespuesta",
      m.idmateria_ma       AS "idMateria",
      m.nombre_ma          AS "materia",
      p.nombre_p           AS "nombreTutor",
      p.apellido_p         AS "apellidoTutor"
    FROM solicitudes s
    JOIN personas p ON s.dnitutor_a_so = p.dni_p
    JOIN materias m ON s.idmateria_ma_so = m.idmateria_ma
    WHERE s.dnisolicitante_a_so = :dniSolicitante
      AND s.estado_so IN ('Aceptada', 'Rechazada') ${filtroDesde}
    ORDER BY s.fecharespuesta_so DESC, s.idsolicitudes_so DESC;
  `, { replacements, type: QueryTypes.SELECT });

  return { cantidad: avisos.length, avisos };
}

module.exports = {
  MEDIOS_CONTACTO,
  generarMensaje,
  crearSolicitud,
  listarRecibidas,
  responderSolicitud,
  listarAvisos
};
