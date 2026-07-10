const pool = require('../config/db');

const BATCH_SIZE = 50;

async function insertData(tableName, rows) {
  if (!rows || rows.length === 0) {
    throw new Error('No hay datos para insertar');
  }

  const keys = Object.keys(rows[0]);
  let totalInserted = 0;
  const totalRows = rows.length;

  console.log(`[INSERT] Insertando ${totalRows} registros en ${tableName}...`);

  for (let i = 0; i < totalRows; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const placeholders = batch.map(() => `(${keys.map(() => '?').join(',')})`).join(',');
    const flatValues = batch.flatMap(row => keys.map(k => row[k]));

    const escapedTable = `\`${tableName.replace(/`/g, '``')}\``;
    const escapedKeys = keys.map(k => `\`${k.replace(/`/g, '``')}\``).join(',');
    const sql = `INSERT INTO ${escapedTable} (${escapedKeys}) VALUES ${placeholders}`;

    try {
      const [result] = await pool.query(sql, flatValues);
      totalInserted += result.affectedRows;
      console.log(`[INSERT] Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${result.affectedRows} filas insertadas`);
    } catch (err) {
      console.error(`[INSERT] Error en lote ${Math.floor(i / BATCH_SIZE) + 1}:`, err.message);
      console.error(`[INSERT] SQL:`, sql.substring(0, 300) + '...');
      console.error(`[INSERT] Primer row del lote:`, JSON.stringify(batch[0], null, 2));
      throw new Error(`Error al insertar en ${tableName}: ${err.message}`);
    }
  }

  console.log(`[INSERT] Completado: ${totalInserted}/${totalRows} registros insertados en ${tableName}`);
  return { affectedRows: totalInserted };
}

module.exports = { insertData };
