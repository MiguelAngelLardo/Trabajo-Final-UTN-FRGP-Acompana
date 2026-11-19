// Servicio de moderación de apuntes — R10.
// Usa sequelize.query (SQL crudo) porque el modelo de Materia
// todavía no existe (es de Persona 2) — así no la bloqueamos.

const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

/**
 * R10 — Buscar apuntes por carrera, materia, nombre o estado, paginado.
 * @param {Object} filtros
 * @param {string} [filtros.pagina=1]     - qué página pedir (1 = la primera)
 * @param {string} [filtros.porPagina=10] - cuántos apuntes por página
 */
async function listarApuntes({ carrera, materia, nombre, estado, pagina, porPagina }) {
  const condiciones = [];
  const replacements = {};

  if (carrera) {
    condiciones.push('c.idcarrera_ca = :carrera');
    replacements.carrera = carrera;
  }
  if (materia) {
    condiciones.push('m.idmateria_ma = :materia');
    replacements.materia = materia;
  }
  if (nombre) {
    condiciones.push('ap.nombre_ap ILIKE :nombre');
    replacements.nombre = `%${nombre}%`;
  }
  if (estado !== undefined) {
    condiciones.push('ap.estado_ap = :estado');
    replacements.estado = estado === 'true';
  }

  const whereClause = condiciones.length > 0
    ? `WHERE ${condiciones.join(' AND ')}`
    : '';

  // Todo lo que llega por query string es texto — lo convertimos a
  // número, con valores por defecto razonables si no mandaron nada
  const paginaNum = Number(pagina) || 1;
  const porPaginaNum = Number(porPagina) || 10;
  const offset = (paginaNum - 1) * porPaginaNum;

  // Contamos el TOTAL que hay (con los mismos filtros, sin LIMIT),
  // para que el frontend sepa cuántas páginas armar en total
  const [{ total }] = await sequelize.query(`
    SELECT COUNT(*) AS total
    FROM apuntes ap
    JOIN materias m  ON ap.idmateria_ma_ap = m.idmateria_ma
    JOIN carreras c  ON m.idcarrera_ca_ma = c.idcarrera_ca
    JOIN alumnos a   ON ap.dni_a_ap = a.dni_p_a
    JOIN personas p  ON a.dni_p_a = p.dni_p
    ${whereClause};
  `, { replacements, type: QueryTypes.SELECT });

  // Ahora sí, la página pedida (con LIMIT y OFFSET agregados)
  const apuntes = await sequelize.query(`
    SELECT
      ap.idapuntes_ap    AS "idApunte",
      ap.nombre_ap       AS "nombre",
      ap.descripcion_ap  AS "descripcion",
      ap.rutaarchivo_ap  AS "rutaArchivo",
      ap.estado_ap       AS "estado",
      m.nombre_ma        AS "materia",
      c.nombre_ca        AS "carrera",
      (p.nombre_p || ' ' || p.apellido_p) AS "autor"
    FROM apuntes ap
    JOIN materias m  ON ap.idmateria_ma_ap = m.idmateria_ma
    JOIN carreras c  ON m.idcarrera_ca_ma = c.idcarrera_ca
    JOIN alumnos a   ON ap.dni_a_ap = a.dni_p_a
    JOIN personas p  ON a.dni_p_a = p.dni_p
    ${whereClause}
    ORDER BY ap.nombre_ap
    LIMIT :limite OFFSET :desde;
  `, {
    replacements: { ...replacements, limite: porPaginaNum, desde: offset },
    type: QueryTypes.SELECT
  });

  return {
    apuntes,
    paginacion: {
      paginaActual: paginaNum,
      porPagina: porPaginaNum,
      totalApuntes: Number(total),
      totalPaginas: Math.ceil(Number(total) / porPaginaNum)
    }
  };
}

/**
 * R10 — Habilitar o dar de baja un apunte.
 */
async function cambiarEstadoApunte(idApunte, estado) {
  if (typeof estado !== 'boolean') {
    const err = new Error('El estado debe ser true o false');
    err.statusCode = 400;
    throw err;
  }

  const [apunte] = await sequelize.query(
    'SELECT idapuntes_ap, estado_ap FROM apuntes WHERE idapuntes_ap = :id',
    { replacements: { id: idApunte }, type: QueryTypes.SELECT }
  );

  if (!apunte) {
    const err = new Error('El apunte no está disponible para revisión');
    err.statusCode = 404;
    throw err;
  }

  if (apunte.estado_ap === estado) {
    const err = new Error(`El apunte ya se encuentra ${estado ? 'habilitado' : 'dado de baja'}`);
    err.statusCode = 400;
    throw err;
  }

  await sequelize.query(
    'UPDATE apuntes SET estado_ap = :estado WHERE idapuntes_ap = :id',
    { replacements: { estado, id: idApunte } }
  );

  return { idApunte: Number(idApunte), estado };
}

module.exports = { listarApuntes, cambiarEstadoApunte };