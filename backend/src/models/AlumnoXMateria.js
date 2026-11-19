const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
 
  const AlumnoXMateria = sequelize.define('ALUMNOSxMATERIAS', {
    Dni_A_AxM: {
      type: DataTypes.STRING(8),
      primaryKey: true,
      allowNull: false,
      field: 'dni_a_axm',
      references: {
        model: 'alumnos',
        key: 'dni_p_a'
      }
    },
    IdMateria_Ma_AxM: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      field: 'idmateria_ma_axm',
      references: {
        model: 'materias',
        key: 'idmateria_ma'
      }
    },
    EsAprobada_AxM: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'esaprobada_axm'
    },
    // Al registrar la materia
    // el alumno todavía no es tutor de nada, así que arranca en false.
    EsTutor_AxM: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'estutor_axm'
    },
    DescripcionTutor_AxM: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'descripciontutor_axm'
    }
  }, {
    tableName: 'alumnosxmaterias'
  });

  return AlumnoXMateria;
};
