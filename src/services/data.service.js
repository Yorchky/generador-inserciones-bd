const pool = require('../config/db');

async function getAllRows(tableName) {
  const escapedTable = `\`${tableName.replace(/`/g, '``')}\``;
  const [rows] = await pool.query(`SELECT * FROM ${escapedTable} LIMIT 5000`);
  return rows;
}

async function deleteAllRows(tableName) {
  const escapedTable = `\`${tableName.replace(/`/g, '``')}\``;
  const [result] = await pool.query(`DELETE FROM ${escapedTable}`);
  console.log(`[DATA] Eliminados ${result.affectedRows} registros de ${tableName}`);
  return { deleted: result.affectedRows };
}

module.exports = { getAllRows, deleteAllRows };
