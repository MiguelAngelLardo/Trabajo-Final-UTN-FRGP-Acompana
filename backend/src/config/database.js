const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false, // Poner en console.log para ver las queries SQL
    define: {
      timestamps: false,   // Las tablas del DER no tienen createdAt/updatedAt
      freezeTableName: true // Evita que Sequelize pluralice los nombres de tabla
    }
  }
);

module.exports = sequelize;
