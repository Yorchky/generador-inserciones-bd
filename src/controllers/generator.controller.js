const schemaService = require('../services/schema.service');
const fakerService = require('../services/faker.service');
const insertService = require('../services/insert.service');
const historyService = require('../services/history.service');
const dataService = require('../services/data.service');

async function handleAsync(fn, req, res) {
  try {
    await fn(req, res);
  } catch (err) {
    console.error(`[CONTROLLER] Error en ${req.method} ${req.originalUrl}:`, err.message);
    console.error(`[CONTROLLER] Stack:`, err.stack?.split('\n').slice(0, 4).join('\n'));
    res.status(500).json({
      error: err.message,
      url: req.originalUrl,
      method: req.method,
    });
  }
}

async function listTables(req, res) {
  console.log(`[API] GET /api/tables`);
  const tables = await schemaService.getTables();
  console.log(`[API] → ${tables.length} tablas encontradas: ${tables.join(', ')}`);
  res.json(tables);
}

async function getTableSchema(req, res) {
  const { table } = req.params;
  console.log(`[API] GET /api/tables/${table}`);
  const columns = await schemaService.getTableSchema(table);
  console.log(`[API] → ${columns.length} columnas en ${table}`);
  columns.forEach(c => console.log(`       ${c.Field} (${c.Type}) ${c.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${c.Key ? 'KEY=' + c.Key : ''}`));
  res.json(columns);
}

async function prepareForeignKeys(table) {
  try {
    const fks = await schemaService.getForeignKeys(table);
    if (fks && fks.length > 0) {
      console.log(`[CONTROLLER] FK detectadas en ${table}:`, fks.map(f => `${f.COLUMN_NAME} → ${f.REFERENCED_TABLE_NAME}.${f.REFERENCED_COLUMN_NAME}`).join(', '));
      const fkValues = await schemaService.getForeignKeyValues(fks);
      return fkValues;
    }
  } catch (err) {
    console.warn(`[CONTROLLER] No se pudieron resolver FK para ${table}:`, err.message);
  }
  return {};
}

async function generateData(req, res) {
  const { table } = req.params;
  const count = parseInt(req.query.records || req.body?.count, 10) || 10;
  const preview = req.method === 'GET' || req.body?.preview === true;
  const startTime = Date.now();

  console.log(`[API] ${req.method} /api/generate/${table} → count=${count}, preview=${preview}`);

  const [columns, fkValues] = await Promise.all([
    schemaService.getTableSchema(table),
    prepareForeignKeys(table),
  ]);

  const data = fakerService.generateFakeData(columns, count, fkValues);

  if (preview) {
    console.log(`[API] → Devolviendo ${data.length} registros como preview`);
    return res.json({ columns, data });
  }

  console.log(`[API] → Insertando ${data.length} registros en ${table}...`);
  const result = await insertService.insertData(table, data);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[API] → Insertados ${result.affectedRows} registros en ${table} (${elapsed}s)`);

  historyService.addEntry({
    table,
    count: result.affectedRows,
    status: 'completado',
    time: elapsed + 's',
  });

  res.json({ inserted: result.affectedRows, table, elapsed });
}

async function generateFakeData(req, res) {
  const { table, count: rawCount } = req.body;
  const count = parseInt(rawCount, 10) || 10;

  console.log(`[API] POST /api/generate-fake → table=${table}, count=${count}`);

  const [columns, fkValues] = await Promise.all([
    schemaService.getTableSchema(table),
    prepareForeignKeys(table),
  ]);

  const data = fakerService.generateFakeData(columns, count, fkValues);
  res.json({ columns, data });
}

async function insertGeneratedData(req, res) {
  const { table, count: rawCount } = req.body;
  const count = parseInt(rawCount, 10) || 10;
  const startTime = Date.now();

  console.log(`[API] POST /api/insert → table=${table}, count=${count}`);

  const [columns, fkValues] = await Promise.all([
    schemaService.getTableSchema(table),
    prepareForeignKeys(table),
  ]);

  const data = fakerService.generateFakeData(columns, count, fkValues);
  const result = await insertService.insertData(table, data);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  historyService.addEntry({
    table,
    count: result.affectedRows,
    status: 'completado',
    time: elapsed + 's',
  });

  res.json({ inserted: result.affectedRows, table, elapsed });
}

async function getHistory(req, res) {
  const entries = historyService.getHistory();
  res.json(entries);
}

async function getTableData(req, res) {
  const { table } = req.params;
  console.log(`[API] GET /api/data/${table}`);
  const rows = await dataService.getAllRows(table);
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  console.log(`[API] → ${rows.length} registros, ${columns.length} columnas`);
  res.json({ columns, data: rows, total: rows.length });
}

async function deleteTableData(req, res) {
  const { table } = req.params;
  console.log(`[API] DELETE /api/data/${table}`);
  const result = await dataService.deleteAllRows(table);
  console.log(`[API] → Eliminados ${result.deleted} registros de ${table}`);
  res.json({ deleted: result.deleted, table });
}

module.exports = {
  listTables:         (req, res) => handleAsync(listTables, req, res),
  getTableSchema:     (req, res) => handleAsync(getTableSchema, req, res),
  generateData:       (req, res) => handleAsync(generateData, req, res),
  generateFakeData:   (req, res) => handleAsync(generateFakeData, req, res),
  insertGeneratedData:(req, res) => handleAsync(insertGeneratedData, req, res),
  getHistory:         (req, res) => handleAsync(getHistory, req, res),
  getTableData:       (req, res) => handleAsync(getTableData, req, res),
  deleteTableData:    (req, res) => handleAsync(deleteTableData, req, res),
};
