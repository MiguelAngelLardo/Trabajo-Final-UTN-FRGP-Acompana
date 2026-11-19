const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

  const Apunte = sequelize.define('Apuntes', {
    IdApuntes_Ap: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'idapuntes_ap'
    },
    Dni_A_Ap: {
      type: DataTypes.STRING(8),
      allowNull: false,
      field: 'dni_a_ap',
      references: {
        model: 'alumnos',
        key: 'dni_p_a'
      }
    },
    IdMateria_Ma_Ap: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'idmateria_ma_ap',
      references: {
        model: 'materias',
        key: 'idmateria_ma'
      }
    },
    Nombre_Ap: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'nombre_ap'
    },
    Descripcion_Ap: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'descripcion_ap'
    },
    RutaArchivo_Ap: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'rutaarchivo_ap'
    },
    Estado_Ap: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'estado_ap'
    }
  }, {
    tableName: 'apuntes'
  });

  return Apunte;
};
