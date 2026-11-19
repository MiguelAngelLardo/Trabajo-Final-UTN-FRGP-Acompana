const { DataTypes } = require('sequelize');
 
module.exports = (sequelize) => {
  const Materia = sequelize.define('Materias', {
    IdMateria_Ma: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'idmateria_ma'
    },
    IdCarrera_Ca_Ma: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'idcarrera_ca_ma',
      references: {
        model: 'carreras',
        key: 'idcarrera_ca'
      }
    },
    Nombre_Ma: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'nombre_ma'
    },
    Estado_Ma: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'estado_ma'
    }
  }, {
    tableName: 'materias'
  });
 
  return Materia;
};
 
