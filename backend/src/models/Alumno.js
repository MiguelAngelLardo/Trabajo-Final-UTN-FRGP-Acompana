const { DataTypes } = require('sequelize');
 
module.exports = (sequelize) => {
  const Alumno = sequelize.define('Alumnos', {
    Dni_P_A: {
      type: DataTypes.STRING(8),
      primaryKey: true,
      allowNull: false,
      field: 'dni_p_a',
      references: {
        model: 'personas',
        key: 'dni_p'
      }
    },
    Legajo_A: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
      field: 'legajo_a'
    },
    FotoPerfil_A: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'fotoperfil_a'
    },
    Descripcion_A: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'descripcion_a'
    }
  }, {
    tableName: 'alumnos'
  });
 
  return Alumno;
};
 
