const { DataTypes } = require('sequelize');
 
module.exports = (sequelize) => {
  const Administrador = sequelize.define('Administradores', {
    Dni_P_Ad: {
      type: DataTypes.STRING(8),
      primaryKey: true,
      allowNull: false,
      field: 'dni_p_ad',
      references: {
        model: 'personas',
        key: 'dni_p'
      }
    }
  }, {
    tableName: 'administradores'
  });
 
  return Administrador;
};
 