const pool = require('../config/db');

async function getTables() {
  const dbName = process.env.DB_NAME || 'test';
  const [rows] = await pool.query('SHOW TABLES');
  const key = `Tables_in_${dbName}`;
  return rows.map(r => r[key]);
}

async function getTableSchema(tableName) {
  const [columns] = await pool.query('SHOW COLUMNS FROM ??', [tableName]);
  return columns.map(col => ({
    Field: col.Field,
    Type: col.Type,
    Null: col.Null,
    Key: col.Key,
    Default: col.Default,
    Extra: col.Extra,
  }));
}

async function getForeignKeys(tableName) {
  const dbName = process.env.DB_NAME || 'test';
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
     FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL`,
    [dbName, tableName]
  );
  return rows;
}

async function getForeignKeyValues(fkInfo) {
  const result = {};
  for (const fk of fkInfo) {
    try {
      const [rows] = await pool.query(
        `SELECT \`${fk.REFERENCED_COLUMN_NAME.replace(/`/g, '``')}\` AS val
         FROM \`${fk.REFERENCED_TABLE_NAME.replace(/`/g, '``')}\`
         LIMIT 1000`
      );
      result[fk.COLUMN_NAME] = rows.map(r => r.val);
      console.log(`[SCHEMA] FK ${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}: ${rows.length} valores disponibles`);
    } catch (err) {
      console.warn(`[SCHEMA] No se pudieron obtener valores FK para ${fk.COLUMN_NAME}:`, err.message);
      result[fk.COLUMN_NAME] = [];
    }
  }
  return result;
}

module.exports = { getTables, getTableSchema, getForeignKeys, getForeignKeyValues };
