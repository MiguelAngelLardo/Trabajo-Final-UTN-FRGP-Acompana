const { Op } = require("sequelize");
const {
  Alumno,
  AlumnoXCarrera,
  AlumnoXMateria,
  Carrera,
  Materia,
} = require("../models");

async function obtenerCarreraDelAlumno(dniAlumno, idCarrera) {
  const carrera = await Carrera.findByPk(idCarrera);
  if (!carrera) {
    const err = new Error("La carrera indicada no existe");
    err.statusCode = 404;
    throw err;
  }

  const inscripcion = await AlumnoXCarrera.findOne({
    where: {
      Dni_A_AxC: dniAlumno,
      IdCarrera_Ca_AxC: carrera.IdCarrera_Ca,
    },
  });

  if (!inscripcion) {
    const err = new Error(
      `No estás inscripto en la carrera "${carrera.Nombre_Ca}"`,
    );
    err.statusCode = 400;
    throw err;
  }

  return carrera;
}

async function registrarMateriaAprobada(dniAlumno, datos = {}) {
  const { idMateria } = datos;

  const alumno = await Alumno.findByPk(dniAlumno);
  if (!alumno) {
    const err = new Error("El alumno no está registrado en el sistema");
    err.statusCode = 404;
    throw err;
  }

  const materia = await Materia.findByPk(idMateria);
  if (!materia) {
    const err = new Error("La materia indicada no existe");
    err.statusCode = 404;
    throw err;
  }

  if (!materia.Estado_Ma) {
    const err = new Error(
      `La materia "${materia.Nombre_Ma}" está dada de baja`,
    );
    err.statusCode = 400;
    throw err;
  }

  // La carrera no se pide: se deduce de la materia.
  const carrera = await obtenerCarreraDelAlumno(
    dniAlumno,
    materia.IdCarrera_Ca_Ma,
  );

  const yaRegistrada = await AlumnoXMateria.findOne({
    where: {
      Dni_A_AxM: dniAlumno,
      IdMateria_Ma_AxM: idMateria,
    },
  });

  if (yaRegistrada) {
    const err = new Error(
      `La materia "${materia.Nombre_Ma}" ya figura como aprobada en tu listado`,
    );
    err.statusCode = 400;
    throw err;
  }
  let registro;
  try {
    registro = await AlumnoXMateria.create({
      Dni_A_AxM: dniAlumno,
      IdMateria_Ma_AxM: idMateria,
      EsAprobada_AxM: true,
      EsTutor_AxM: false,
      DescripcionTutor_AxM: null,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      const err = new Error(
        `La materia "${materia.Nombre_Ma}" ya figura como aprobada en tu listado`,
      );
      err.statusCode = 409;
      throw err;
    }
    throw error;
  }

  return {
    alumno: {
      dni: dniAlumno,
      legajo: alumno.Legajo_A,
    },
    carrera: {
      idCarrera: carrera.IdCarrera_Ca,
      nombre: carrera.Nombre_Ca,
    },
    materia: {
      idMateria: materia.IdMateria_Ma,
      nombre: materia.Nombre_Ma,
    },
    esAprobada: registro.EsAprobada_AxM,
    esTutor: registro.EsTutor_AxM,
    mensajes: {
      alta: `La materia "${materia.Nombre_Ma}" se agregó a tu listado de materias aprobadas`,
      apuntes: `Ya podés subir apuntes de "${materia.Nombre_Ma}"`,
      tutor: `Ya podés postularte como tutor de "${materia.Nombre_Ma}"`,
    },
  };
}

async function listarMateriasDisponibles(dniAlumno, idCarrera) {
  const alumno = await Alumno.findByPk(dniAlumno);
  if (!alumno) {
    const err = new Error("El alumno no está registrado en el sistema");
    err.statusCode = 404;
    throw err;
  }

  const carrera = await obtenerCarreraDelAlumno(dniAlumno, idCarrera);
  const yaRegistradas = (
    await AlumnoXMateria.findAll({
      where: { Dni_A_AxM: dniAlumno },
      attributes: ["IdMateria_Ma_AxM"],
    })
  ).map((r) => r.IdMateria_Ma_AxM);

  const where = {
    IdCarrera_Ca_Ma: carrera.IdCarrera_Ca,
    // Solo las activas
    Estado_Ma: true,
  };

  if (yaRegistradas.length > 0) {
    where.IdMateria_Ma = { [Op.notIn]: yaRegistradas };
  }

  const materias = await Materia.findAll({
    where,
    order: [["Nombre_Ma", "ASC"]],
  });

  return {
    carrera: {
      idCarrera: carrera.IdCarrera_Ca,
      nombre: carrera.Nombre_Ca,
    },
    total: materias.length,
    materias: materias.map((m) => ({
      idMateria: m.IdMateria_Ma,
      nombre: m.Nombre_Ma,
    })),
  };
}

async function listarMateriasAprobadas(dniAlumno, idCarrera) {
  const alumno = await Alumno.findByPk(dniAlumno);
  if (!alumno) {
    const err = new Error("El alumno no está registrado en el sistema");
    err.statusCode = 404;
    throw err;
  }

  const carrera = await obtenerCarreraDelAlumno(dniAlumno, idCarrera);

  const registros = await AlumnoXMateria.findAll({
    where: { Dni_A_AxM: dniAlumno , EsAprobada_AxM: true},
    include: [
      {
        model: Materia,
        as: "materia",
        where: {
          IdCarrera_Ca_Ma: carrera.IdCarrera_Ca,
        },
        required: true,
      },
    ],
    order: [[{ model: Materia, as: "materia" }, "Nombre_Ma", "ASC"]],
  });

  const materias = registros.map((r) => ({
    idMateria: r.IdMateria_Ma_AxM,
    nombre: r.materia.Nombre_Ma,
    esTutor: r.EsTutor_AxM,
    descripcionTutor: r.DescripcionTutor_AxM,
  }));

  return {
    carrera: {
      idCarrera: carrera.IdCarrera_Ca,
      nombre: carrera.Nombre_Ca,
    },
    total: materias.length,
    materias,
  };
}

module.exports = {
  registrarMateriaAprobada,
  listarMateriasDisponibles,
  listarMateriasAprobadas,
};
