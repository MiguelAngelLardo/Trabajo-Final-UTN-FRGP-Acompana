const { DataTypes } = require('sequelize');
 
module.exports = (sequelize) => {
  const AlumnoXCarrera = sequelize.define('ALUMNOSxCARRERAS', {
    Dni_A_AxC: {
      type: DataTypes.STRING(8),
      primaryKey: true,
      allowNull: false,
      field: 'dni_a_axc',
      references: {
        model: 'alumnos',
        key: 'dni_p_a'
      }
    },
    IdCarrera_Ca_AxC: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      field: 'idcarrera_ca_axc',
      references: {
        model: 'carreras',
        key: 'idcarrera_ca'
      }
    },
    EsTerminada_AxC: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'esterminada_axc'
    }
  }, {
    tableName: 'alumnosxcarreras'
  });
 
  return AlumnoXCarrera;
};
 