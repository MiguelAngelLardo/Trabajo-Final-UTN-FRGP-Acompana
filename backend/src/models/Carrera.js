const { DataTypes } = require('sequelize');
 
module.exports = (sequelize) => {
  const Carrera = sequelize.define('Carreras', {
    IdCarrera_Ca: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'idcarrera_ca'
    },
    Nombre_Ca: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'nombre_ca'
    },
    Estado_Ca: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'estado_ca'
    }
  }, {
    tableName: 'carreras'
  });
 
  return Carrera;
};
 