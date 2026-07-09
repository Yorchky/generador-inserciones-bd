const history = [];

function addEntry(entry) {
  const item = {
    id: history.length + 1,
    fecha: new Date().toISOString(),
    tabla: entry.tabla || entry.table || '',
    cantidad: entry.cantidad || entry.count || 0,
    estado: entry.estado || entry.status || 'completado',
    tiempo: entry.tiempo || entry.time || '0s',
  };
  history.push(item);
  console.log(`[HISTORY] Registro #${item.id}: ${item.tabla} — ${item.cantidad} filas — ${item.estado}`);
  return item;
}

function getHistory() {
  return history.slice().reverse();
}

module.exports = { addEntry, getHistory };
