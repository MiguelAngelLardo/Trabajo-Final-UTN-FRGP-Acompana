const { DataTypes } = require('sequelize');

const ESTADOS_SOLICITUD = ['Pendiente', 'Aceptada', 'Rechazada'];

module.exports = (sequelize) => {
  // Tabla de movimiento de R6/R8: un alumno le pide tutoría a otro
  // alumno (el tutor) para una materia puntual. Tiene doble FK a Alumnos.
  const Solicitud = sequelize.define('Solicitudes', {
    IdSolicitudes_So: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'idsolicitudes_so'
    },
    DniSolicitante_A_So: {
      type: DataTypes.STRING(8),
      allowNull: false,
      field: 'dnisolicitante_a_so',
      references: {
        model: 'alumnos',
        key: 'dni_p_a'
      }
    },
    DniTutor_A_So: {
      type: DataTypes.STRING(8),
      allowNull: false,
      field: 'dnitutor_a_so',
      references: {
        model: 'alumnos',
        key: 'dni_p_a'
      }
    },
    IdMateria_Ma_So: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'idmateria_ma_so',
      references: {
        model: 'materias',
        key: 'idmateria_ma'
      }
    },
    Estado_So: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'Pendiente',
      field: 'estado_so',
      validate: { isIn: [ESTADOS_SOLICITUD] }
    },
    FechaPedido_So: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'fechapedido_so'
    },
    FechaRespuesta_So: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'fecharespuesta_so'
    },
    Mensaje_So: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'mensaje_so'
    }
  }, {
    tableName: 'solicitudes'
  });

  return Solicitud;
};

module.exports.ESTADOS_SOLICITUD = ESTADOS_SOLICITUD;
