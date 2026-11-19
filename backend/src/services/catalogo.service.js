const { Op, QueryTypes, ForeignKeyConstraintError } = require("sequelize");
const {
  Carrera,
  Materia,
  Persona,
  Alumno,
  AlumnoXCarrera,
  AlumnoXMateria,
  Apunte,
} = require("../models");
const { sequelize } = require("../models");

function crearError(statusCode, mensaje, details) {
  const err = new Error(mensaje);
  err.statusCode = statusCode;
  if (details) err.details = details;
  return err;
}
// Serializa operaciones concurrentes sobre el mismo nombre. Se libera solo al cerrar la transacción.
async function bloquearNombre(t, clave) {
  await sequelize.query("SELECT pg_advisory_xact_lock(hashtext(:clave))", {
    replacements: { clave },
    transaction: t,
  });
}

function errorCarreraDuplicada(existente) {
  const base = `La carrera "${existente.Nombre_Ca}" ya está registrada en el catálogo`;
  const mensaje = existente.Estado_Ca
    ? base
    : `${base}, pero está inactiva. Reactivala en lugar de crearla de nuevo`;
  return crearError(409, mensaje, {
    id: existente.IdCarrera_Ca,
    estado: existente.Estado_Ca,
  });
}

function errorMateriaDuplicada(existente, carrera) {
  const base = `La materia "${existente.Nombre_Ma}" ya está registrada en la carrera "${carrera.Nombre_Ca}"`;
  const mensaje = existente.Estado_Ma
    ? base
    : `${base}, pero está inactiva. Reactivala en lugar de crearla de nuevo`;
  return crearError(409, mensaje, {
    id: existente.IdMateria_Ma,
    estado: existente.Estado_Ma,
  });
}

function interpretarEstado(estadoQuery) {
  if (estadoQuery === undefined || estadoQuery === "todos") return null;
  return estadoQuery === "true";
}

/**
 * R11 — Decide qué estados puede ver el rol que está pidiendo.
 *
 * El admin (moderador de R11) administra el catálogo, así que necesita
 * ver tanto activas como inactivas: es él quien las da de baja y las
 * reactiva. El alumno solo interactúa con materia de su carrera, así
 * que jamás debe ver una materia dada de baja: si la viera, podría
 * pedir tutorías o subir apuntes de una materia que ya no existe.
 *
 * @param {string|undefined} estadoQuery
 * @param {string} rol - 'Admin' | 'Alumno'
 * @returns {boolean|null}
 * @throws {Error} 403 si un alumno pide explícitamente las inactivas
 */
function resolverEstadoVisible(estadoQuery, rol) {
  if (rol === "Admin") return interpretarEstado(estadoQuery);
  if (estadoQuery === "false") {
    const err = new Error(
      "No tenés permisos para ver los registros inactivos del catálogo",
    );
    err.statusCode = 403;
    throw err;
  }
  return true;
}

// ============================================================
// LISTADO de carreras y materias
// ============================================================

async function listarCarreras({ estado, rol, q }) {
  const where = {};

  const estadoVisible = resolverEstadoVisible(estado, rol);
  if (estadoVisible !== null) {
    where.Estado_Ca = estadoVisible;
  }

  if (q) {
    where.Nombre_Ca = { [Op.iLike]: `%${q}%` };
  }

  const carreras = await Carrera.findAll({
    where,
    order: [["Nombre_Ca", "ASC"]],
  });
  return carreras.map((c) => ({
    id: c.IdCarrera_Ca,
    nombre: c.Nombre_Ca,
    estado: c.Estado_Ca,
  }));
}

async function listarMaterias({ estado, rol, q, idCarrera }) {
  const where = {};

  const estadoVisible = resolverEstadoVisible(estado, rol);
  if (estadoVisible !== null) {
    where.Estado_Ma = estadoVisible;
  }

  if (q) {
    where.Nombre_Ma = { [Op.iLike]: `%${q}%` };
  }

  if (idCarrera !== undefined) {
    where.IdCarrera_Ca_Ma = idCarrera;
  }

  const materias = await Materia.findAll({
    where,
    include: [
      {
        model: Carrera,
        as: "carrera",
        attributes: ["IdCarrera_Ca", "Nombre_Ca"],
      },
    ],
    order: [["Nombre_Ma", "ASC"]],
  });

  return materias.map((m) => ({
    id: m.IdMateria_Ma,
    nombre: m.Nombre_Ma,
    estado: m.Estado_Ma,
    idCarrera: m.IdCarrera_Ca_Ma,
    carrera: m.carrera
      ? { id: m.carrera.IdCarrera_Ca, nombre: m.carrera.Nombre_Ca }
      : null,
  }));
}

// ============================================================
// ALTA de carreras y materias
// ============================================================

function escaparParaLike(texto) {
  return texto.replace(/[\\%_]/g, "\\$&");
}

async function crearCarrera({ nombre }) {
  const nombreLimpio = nombre.trim();

  return sequelize.transaction(async (t) => {
    await bloquearNombre(t, `carrera:${nombreLimpio.toLowerCase()}`);

    const existente = await Carrera.findOne({
      where: { Nombre_Ca: { [Op.iLike]: escaparParaLike(nombreLimpio) } },
      transaction: t,
    });
    if (existente) throw errorCarreraDuplicada(existente);

    const carrera = await Carrera.create(
      { Nombre_Ca: nombreLimpio },
      { transaction: t },
    );

    return {
      id: carrera.IdCarrera_Ca,
      nombre: carrera.Nombre_Ca,
      estado: carrera.Estado_Ca,
    };
  });
}

async function crearMateria({ nombre, idCarrera }) {
  const nombreLimpio = nombre.trim();
  const idCarreraNum = Number(idCarrera);

  return sequelize.transaction(async (t) => {
    // SHARE: impide que una baja de la carrera se cuele mientras creamos la materia
    const carrera = await Carrera.findByPk(idCarreraNum, {
      transaction: t,
      lock: t.LOCK.SHARE,
    });

    if (!carrera) {
      throw crearError(
        404,
        "La carrera a la que se intenta asignar la materia no existe",
      );
    }
    if (!carrera.Estado_Ca) {
      throw crearError(
        409,
        `La carrera "${carrera.Nombre_Ca}" está inactiva. Reactivala antes de agregarle materias`,
      );
    }

    await bloquearNombre(
      t,
      `materia:${idCarreraNum}:${nombreLimpio.toLowerCase()}`,
    );

    const existente = await Materia.findOne({
      where: {
        Nombre_Ma: { [Op.iLike]: escaparParaLike(nombreLimpio) },
        IdCarrera_Ca_Ma: idCarreraNum,
      },
      transaction: t,
    });
    if (existente) throw errorMateriaDuplicada(existente, carrera);

    const materia = await Materia.create(
      { Nombre_Ma: nombreLimpio, IdCarrera_Ca_Ma: idCarreraNum },
      { transaction: t },
    );

    return {
      id: materia.IdMateria_Ma,
      nombre: materia.Nombre_Ma,
      estado: materia.Estado_Ma,
      idCarrera: materia.IdCarrera_Ca_Ma,
      carrera: { id: carrera.IdCarrera_Ca, nombre: carrera.Nombre_Ca },
    };
  });
}

// ============================================================
// EDICIÓN de carreras y materias
//
// Solo se edita el nombre. El estado tiene su propio flujo (baja /
// reactivación) y la carrera de una materia es inmutable.
// ============================================================

function validarDatosEdicion(datos) {
  if (datos.estado !== undefined) {
    throw crearError(400, "El estado no se modifica desde la edición. Usá el flujo de baja o reactivación.");
  }
  if (datos.idCarrera !== undefined) {
    throw crearError(400, "La carrera de una materia no se puede modificar.");
  }
  if (typeof datos.nombre !== "string" || datos.nombre.trim() === "") {
    throw crearError(400, "El nombre es obligatorio y no puede quedar vacío");
  }
}

async function editarCarrera(idCarrera, datos) {
  validarDatosEdicion(datos);
  const nombreLimpio = datos.nombre.trim();

  return sequelize.transaction(async (t) => {
    await bloquearNombre(t, `carrera:${nombreLimpio.toLowerCase()}`);

    const carrera = await Carrera.findByPk(idCarrera, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!carrera) throw crearError(404, "Carrera no encontrada");

    if (nombreLimpio !== carrera.Nombre_Ca) {
      const existente = await Carrera.findOne({
        where: {
          Nombre_Ca: { [Op.iLike]: escaparParaLike(nombreLimpio) },
          IdCarrera_Ca: { [Op.ne]: idCarrera },
        },
        transaction: t,
      });
      if (existente) throw errorCarreraDuplicada(existente);

      await carrera.update({ Nombre_Ca: nombreLimpio }, { transaction: t });
    }

    return {
      id: carrera.IdCarrera_Ca,
      nombre: carrera.Nombre_Ca,
      estado: carrera.Estado_Ca,
    };
  });
}

async function editarMateria(idMateria, datos) {
  validarDatosEdicion(datos);
  const nombreLimpio = datos.nombre.trim();

  return sequelize.transaction(async (t) => {
    const materia = await Materia.findByPk(idMateria, {
      include: [
        { model: Carrera, as: "carrera", attributes: ["IdCarrera_Ca", "Nombre_Ca"] },
      ],
      transaction: t,
      // El lock se limita a la tabla de materias: con el include falla si no
      lock: { level: t.LOCK.UPDATE, of: Materia },
    });
    if (!materia) throw crearError(404, "Materia no encontrada");

    // Misma clave que usa el alta, así se serializan entre sí
    await bloquearNombre(
      t,
      `materia:${materia.IdCarrera_Ca_Ma}:${nombreLimpio.toLowerCase()}`,
    );

    if (nombreLimpio !== materia.Nombre_Ma) {
      const existente = await Materia.findOne({
        where: {
          Nombre_Ma: { [Op.iLike]: escaparParaLike(nombreLimpio) },
          IdCarrera_Ca_Ma: materia.IdCarrera_Ca_Ma,
          IdMateria_Ma: { [Op.ne]: idMateria },
        },
        transaction: t,
      });
      if (existente) throw errorMateriaDuplicada(existente, materia.carrera);

      await materia.update({ Nombre_Ma: nombreLimpio }, { transaction: t });
    }

    return {
      id: materia.IdMateria_Ma,
      nombre: materia.Nombre_Ma,
      estado: materia.Estado_Ma,
      idCarrera: materia.IdCarrera_Ca_Ma,
      carrera: { id: materia.carrera.IdCarrera_Ca, nombre: materia.carrera.Nombre_Ca },
    };
  });
}

// ============================================================
// BAJA LOGICA de carreras y materias
// ============================================================

async function bajaCarrera(idCarrera) {
  return sequelize.transaction(async (t) => {
    const carrera = await Carrera.findByPk(idCarrera, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!carrera) throw crearError(404, "Carrera no encontrada");
    if (!carrera.Estado_Ca) {
      throw crearError(
        409,
        `La carrera "${carrera.Nombre_Ca}" ya está dada de baja`,
      );
    }

    await carrera.update({ Estado_Ca: false }, { transaction: t });

    const [, materias] = await Materia.update(
      { Estado_Ma: false },
      {
        where: { IdCarrera_Ca_Ma: idCarrera, Estado_Ma: true },
        returning: true,
        transaction: t,
      },
    );
    materias.sort((a, b) => a.IdMateria_Ma - b.IdMateria_Ma);

    return {
      carrera: {
        id: carrera.IdCarrera_Ca,
        nombre: carrera.Nombre_Ca,
        estado: carrera.Estado_Ca,
      },
      materiasDadasDeBaja: materias.length,
      materias: materias.map((m) => ({
        id: m.IdMateria_Ma,
        nombre: m.Nombre_Ma,
      })),
    };
  });
}

async function bajaMateria(idMateria) {
  const materia = await Materia.findByPk(idMateria);
  if (!materia) throw crearError(404, "Materia no encontrada");
  if (!materia.Estado_Ma) {
    throw crearError(
      409,
      `La materia "${materia.Nombre_Ma}" ya está dada de baja`,
    );
  }
  await materia.update({ Estado_Ma: false });
  return {
    id: materia.IdMateria_Ma,
    nombre: materia.Nombre_Ma,
    estado: materia.Estado_Ma,
  };
}

// ============================================================
// REACTIVACION de carreras y materias
// ============================================================

async function reactivarMateria(idMateria) {
  return sequelize.transaction(async (t) => {
    const materia = await Materia.findByPk(idMateria, { transaction: t });
    if (!materia) throw crearError(404, "Materia no encontrada");
    if (materia.Estado_Ma) {
      throw crearError(409, `La materia "${materia.Nombre_Ma}" ya está activa`);
    }

    // SHARE: una baja de la carrera no puede colarse hasta que cerremos la transacción
    const carrera = await Carrera.findByPk(materia.IdCarrera_Ca_Ma, {
      transaction: t,
      lock: t.LOCK.SHARE,
    });
    if (!carrera.Estado_Ca) {
      throw crearError(
        409,
        `No se puede reactivar la materia porque su carrera "${carrera.Nombre_Ca}" está inactiva. ` +
          `Reactivá la carrera (se reactivan también sus materias)`,
      );
    }

    await materia.update({ Estado_Ma: true }, { transaction: t });
    return { id: materia.IdMateria_Ma, nombre: materia.Nombre_Ma, estado: materia.Estado_Ma };
  });
}

async function reactivarCarrera(idCarrera) {
  return sequelize.transaction(async (t) => {
    const carrera = await Carrera.findByPk(idCarrera, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!carrera) throw crearError(404, "Carrera no encontrada");
    if (carrera.Estado_Ca) {
      throw crearError(409, `La carrera "${carrera.Nombre_Ca}" ya está activa`);
    }

    await carrera.update({ Estado_Ca: true }, { transaction: t });

    const [afectadas] = await Materia.update(
      { Estado_Ma: true },
      { where: { IdCarrera_Ca_Ma: idCarrera, Estado_Ma: false }, transaction: t },
    );
    const total = await Materia.count({
      where: { IdCarrera_Ca_Ma: idCarrera },
      transaction: t,
    });

    return {
      carrera: { id: carrera.IdCarrera_Ca, nombre: carrera.Nombre_Ca, estado: carrera.Estado_Ca },
      materiasReactivadas: afectadas,
      totalMaterias: total,
    };
  });
}

// ============================================================
// ELIMINACION FISICA de carreras y materias
// ============================================================

function describirDependencias(deps) {
  const etiquetas = {
    inscripciones: 'inscripción(es) de alumnos',
    materias: 'materia(s)',
    aprobaciones: 'aprobación(es) de alumnos',
    apuntes: 'apunte(s)',
    solicitudes: 'solicitud(es) de tutoría'
  };
  return Object.entries(deps)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${n} ${etiquetas[k]}`)
    .join(', ');
}

async function eliminarMateria(idMateria) {
  try {
    return await sequelize.transaction(async (t) => {
      const materia = await Materia.findByPk(idMateria, { transaction: t, lock: t.LOCK.UPDATE });
      if (!materia) throw crearError(404, 'Materia no encontrada');

      const [{ n: solicitudes }] = await sequelize.query(
        'SELECT COUNT(*)::int AS n FROM solicitudes WHERE idmateria_ma_so = :id',
        { replacements: { id: idMateria }, type: QueryTypes.SELECT, transaction: t }
      );
      const deps = {
        aprobaciones: await AlumnoXMateria.count({ where: { IdMateria_Ma_AxM: idMateria }, transaction: t }),
        apuntes: await Apunte.count({ where: { IdMateria_Ma_Ap: idMateria }, transaction: t }),
        solicitudes
      };

      if (Object.values(deps).some(n => n > 0)) {
        throw crearError(409,
          `La materia "${materia.Nombre_Ma}" no puede eliminarse: tiene ${describirDependencias(deps)}. ` +
          `Marcala como inactiva en su lugar.`, deps);
      }

      await materia.destroy({ transaction: t });
      return { id: materia.IdMateria_Ma, nombre: materia.Nombre_Ma };
    });
  } catch (err) {
    // Red de seguridad: algo se insertó entre el chequeo y el delete
    if (err instanceof ForeignKeyConstraintError) {
      throw crearError(409, 'La materia no puede eliminarse porque tiene dependencias. Marcala como inactiva en su lugar.');
    }
    throw err;
  }
}

async function eliminarCarrera(idCarrera) {
  try {
    return await sequelize.transaction(async (t) => {
      const carrera = await Carrera.findByPk(idCarrera, { transaction: t, lock: t.LOCK.UPDATE });
      if (!carrera) throw crearError(404, 'Carrera no encontrada');

      const deps = {
        inscripciones: await AlumnoXCarrera.count({ where: { IdCarrera_Ca_AxC: idCarrera }, transaction: t }),
        materias: await Materia.count({ where: { IdCarrera_Ca_Ma: idCarrera }, transaction: t })
      };

      if (Object.values(deps).some(n => n > 0)) {
        throw crearError(409,
          `La carrera "${carrera.Nombre_Ca}" no puede eliminarse: tiene ${describirDependencias(deps)}. ` +
          `Marcala como inactiva en su lugar.`, deps);
      }

      await carrera.destroy({ transaction: t });
      return { id: carrera.IdCarrera_Ca, nombre: carrera.Nombre_Ca };
    });
  } catch (err) {
    if (err instanceof ForeignKeyConstraintError) {
      throw crearError(409, 'La carrera no puede eliminarse porque tiene dependencias. Marcala como inactiva en su lugar.');
    }
    throw err;
  }
}

/**
 * R3 — Listar las carreras en las que está inscripto el alumno.

 * @param {string} dniAlumno - Sale del token (req.usuario.dni)
 * @returns {Promise<Object>} Carreras del alumno con su estado de terminada
 */
async function listarMisCarreras(dniAlumno) {
  const alumno = await Alumno.findByPk(dniAlumno);
  if (!alumno) {
    const err = new Error("El alumno no está registrado en el sistema");
    err.statusCode = 404;
    throw err;
  }

  const inscripciones = await AlumnoXCarrera.findAll({
    where: { Dni_A_AxC: dniAlumno },
  });

  if (inscripciones.length === 0) {
    return { total: 0, carreras: [] };
  }

  const carreras = await Carrera.findAll({
    where: {
      IdCarrera_Ca: { [Op.in]: inscripciones.map((i) => i.IdCarrera_Ca_AxC) },
    },
    order: [["Nombre_Ca", "ASC"]],
  });

  const terminadaPor = new Map(
    inscripciones.map((i) => [i.IdCarrera_Ca_AxC, i.EsTerminada_AxC]),
  );

  return {
    total: carreras.length,
    carreras: carreras.map((c) => ({
      idCarrera: c.IdCarrera_Ca,
      nombre: c.Nombre_Ca,
      terminada: terminadaPor.get(c.IdCarrera_Ca),
    })),
  };
}

module.exports = {
  listarCarreras,
  listarMisCarreras,
  listarMaterias,
  crearCarrera,
  crearMateria,
  editarCarrera,
  editarMateria,
  bajaCarrera,
  reactivarCarrera,
  bajaMateria,
  reactivarMateria,
  eliminarCarrera,
  eliminarMateria,
};
