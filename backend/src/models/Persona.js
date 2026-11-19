const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Persona = sequelize.define('Personas', {
    Dni_P: {
      type: DataTypes.STRING(8),
      primaryKey: true,
      allowNull: false,
      field: 'dni_p'
    },
    CorreoInstitucional_P: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'correoinstitucional_p'
    },
    Contrasena_P: {
      type: DataTypes.STRING(100),  
      allowNull: false,
      field: 'contrasena_p'
    },
    Nombre_P: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'nombre_p'
    },
    Apellido_P: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'apellido_p'
    },
    Sexo_P: {
      type: DataTypes.CHAR(1),
      allowNull: false,
      field: 'sexo_p'
    },
    Direccion_P: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'direccion_p'
    },
    Telefono_P: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'telefono_p'
    },
    Estado_P: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'estado_p'
    }
  }, {
    tableName: 'personas'   
  });

  return Persona;
};