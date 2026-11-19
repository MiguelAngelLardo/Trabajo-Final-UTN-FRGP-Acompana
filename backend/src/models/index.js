const sequelize = require('../config/database');

const Persona = require('./Persona')(sequelize);
const Alumno = require('./Alumno')(sequelize);
const Administrador = require('./Administrador')(sequelize);
const Carrera = require('./Carrera')(sequelize);
const Materia = require('./Materia')(sequelize);
const AlumnoXCarrera = require('./AlumnoXCarrera')(sequelize);
const Solicitud = require('./Solicitud')(sequelize);
const AlumnoXMateria = require('./AlumnoXMateria')(sequelize);
const Apunte = require('./Apunte')(sequelize);

// Persona 1:1 Alumno
Persona.hasOne(Alumno, { foreignKey: 'Dni_P_A', as: 'alumno' });
Alumno.belongsTo(Persona, { foreignKey: 'Dni_P_A', as: 'persona' });

// Persona 1:1 Administrador
Persona.hasOne(Administrador, { foreignKey: 'Dni_P_Ad', as: 'administrador' });
Administrador.belongsTo(Persona, { foreignKey: 'Dni_P_Ad', as: 'persona' });

// Alumnos x Carreras
Alumno.belongsToMany(Carrera, {
  through: AlumnoXCarrera,
  foreignKey: 'Dni_A_AxC',
  otherKey: 'IdCarrera_Ca_AxC',
  as: 'carreras'
});
Carrera.belongsToMany(Alumno, {
  through: AlumnoXCarrera,
  foreignKey: 'IdCarrera_Ca_AxC',
  otherKey: 'Dni_A_AxC',
  as: 'alumnos'
})

Alumno.hasMany(Solicitud, { foreignKey: 'DniSolicitante_A_So', as: 'solicitudesEnviadas' });
Alumno.hasMany(Solicitud, { foreignKey: 'DniTutor_A_So', as: 'solicitudesRecibidas' });
Solicitud.belongsTo(Alumno, { foreignKey: 'DniSolicitante_A_So', as: 'solicitante' });
Solicitud.belongsTo(Alumno, { foreignKey: 'DniTutor_A_So', as: 'tutor' });
AlumnoXMateria.belongsTo(Materia, {
  foreignKey: 'IdMateria_Ma_AxM',
  as: 'materia'
});

Alumno.belongsToMany(Materia, {
  through: AlumnoXMateria,
  foreignKey: 'Dni_A_AxM',
  otherKey: 'IdMateria_Ma_AxM',
  as: 'materias'
});
Materia.belongsToMany(Alumno, {
  through: AlumnoXMateria,
  foreignKey: 'IdMateria_Ma_AxM',
  otherKey: 'Dni_A_AxM',
  as: 'alumnos'
});

// Carrera 1:N Materias
Carrera.hasMany(Materia, { foreignKey: 'IdCarrera_Ca_Ma', as: 'materias' });
Materia.belongsTo(Carrera, { foreignKey: 'IdCarrera_Ca_Ma', as: 'carrera' });

// Alumno 1:N Apuntes (el alumno es el autor)
Alumno.hasMany(Apunte, { foreignKey: 'Dni_A_Ap', as: 'apuntes' });
Apunte.belongsTo(Alumno, { foreignKey: 'Dni_A_Ap', as: 'alumno' });

// Materia 1:N Apuntes
Materia.hasMany(Apunte, { foreignKey: 'IdMateria_Ma_Ap', as: 'apuntes' });
Apunte.belongsTo(Materia, { foreignKey: 'IdMateria_Ma_Ap', as: 'materia' });

module.exports = {
  sequelize,
  Persona,
  Alumno,
  Administrador,
  Carrera,
  AlumnoXCarrera,
  Solicitud,
  Materia,
  AlumnoXMateria,
  Apunte
};
