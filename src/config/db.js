const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'test',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT DATABASE() AS db, VERSION() AS ver, USER() AS user');
    conn.release();
    const row = rows[0];
    console.log('✓ Conexión MySQL exitosa');
    console.log(`  Base de datos: ${row.db}`);
    console.log(`  Versión:       ${row.ver}`);
    console.log(`  Usuario:       ${row.user}`);
    return true;
  } catch (err) {
    console.error('✗ Error de conexión MySQL:', err.message);
    console.error('  Verifica que Docker MySQL esté corriendo: docker ps');
    console.error('  Y que .env tenga las credenciales correctas');
    return false;
  }
}

module.exports = pool;
module.exports.testConnection = testConnection;
