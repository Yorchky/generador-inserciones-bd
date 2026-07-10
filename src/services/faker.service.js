const { faker } = require('@faker-js/faker');

function parseEnumValues(typeStr) {
  const match = typeStr.match(/^enum\((.+)\)$/i);
  if (!match) return null;
  const values = [];
  let current = '';
  let inQuote = false;
  for (const ch of match[1]) {
    if (ch === "'") { inQuote = !inQuote; continue; }
    if (ch === ',' && !inQuote) { values.push(current); current = ''; continue; }
    if (inQuote) current += ch;
  }
  if (current) values.push(current);
  return values;
}

function getMaxLength(typeStr) {
  const match = typeStr.match(/^(?:var)?char\((\d+)\)$/i);
  if (match) return parseInt(match[1], 10);
  return null;
}

function truncate(value, maxLen) {
  if (maxLen && typeof value === 'string' && value.length > maxLen) {
    return value.substring(0, maxLen);
  }
  return value;
}

function guessColumnType(column) {
  const name = column.Field.toLowerCase();
  const type = column.Type.toLowerCase();

  if (type.startsWith('enum') || type.startsWith('set')) return 'enum';

  if (name.includes('nombre') || name.includes('name')) return 'firstName';
  if (name.includes('apellido') || name.includes('surname') || name.includes('last_name')) return 'lastName';
  if (name.includes('email') || name.includes('correo') || name.includes('mail')) return 'email';
  if (name.includes('telefono') || name.includes('phone') || name.includes('tel') || name.includes('celular')) return 'phone';
  if (name.includes('direccion') || name.includes('address') || name.includes('dir') || name.includes('domicilio')) return 'address';
  if (name.includes('ciudad') || name.includes('city')) return 'city';
  if (name.includes('pais') || name.includes('country') || name.includes('país')) return 'country';
  if (name.includes('codigo_postal') || name.includes('zip') || name.includes('postal') || name.includes('cp')) return 'zipCode';
  if (name.includes('fecha_nacimiento') || name.includes('birth') || name.includes('nacimiento') || name.includes('fechanac')) return 'birthDate';
  if (name.includes('fecha') || name.includes('date') || name.includes('creado') || name.includes('updated') || name.includes('registro')) return 'date';
  if (name.includes('edad') || name.includes('age')) return 'age';
  if (name.includes('salario') || name.includes('salary') || name.includes('sueldo')) return 'salary';
  if (name.includes('precio') || name.includes('price') || name.includes('cost') || name.includes('costo')) return 'price';
  if (name.includes('descripcion') || name.includes('description') || name.includes('desc') || name.includes('descripción')) return 'description';
  if (name.includes('titulo') || name.includes('title') || name.includes('título')) return 'title';
  if (name.includes('empresa') || name.includes('company')) return 'company';
  if (name.includes('puesto') || name.includes('job') || name.includes('position') || name.includes('cargo')) return 'jobTitle';
  if (name.includes('url') || name.includes('website') || name.includes('sitio') || name.includes('web')) return 'url';
  if (name.includes('ip')) return 'ip';
  if (name.includes('color')) return 'color';
  if (name.includes('producto') || name.includes('product')) return 'product';
  if (name.includes('categoria') || name.includes('category') || name.includes('categoría')) return 'category';
  if (name.includes('genero') || name.includes('gender') || name.includes('sex') || name.includes('género')) return 'gender';
  if (name.includes('password') || name.includes('contraseña') || name.includes('pass') || name.includes('clave')) return 'password';
  if (name.includes('usuario') || name.includes('username') || name.includes('user') || name.includes('login')) return 'username';
  if (name.includes('dni') || name.includes('identificacion') || name.includes('identificación') || name.includes('id_number') || name.includes('documento') || name.includes('cedula') || name.includes('cédula')) return 'dni';
  if (name.includes('stock') || name.includes('cantidad') || name.includes('quantity') || name.includes('existencia')) return 'integer';
  if (name.includes('sku') || name.includes('codigo') || name.includes('código') || name.includes('code') || name.includes('ref') || name.includes('referencia')) return 'sku';
  if (name.includes('marca') || name.includes('brand')) return 'company';

  if (type.includes('int')) return 'integer';
  if (type.includes('decimal') || type.includes('float') || type.includes('double') || type.includes('numeric')) return 'decimal';
  if (type.includes('date') || type.includes('timestamp')) return 'date';
  if (type.includes('text') || type.includes('varchar') || type.includes('char')) return 'word';

  return 'word';
}

let globalCounter = Date.now();

function generateValue(column, rowIndex, uniqueTracker) {
  const hint = guessColumnType(column);
  const maxLen = getMaxLength(column.Type);
  const isUnique = column.Key === 'UNI' || column.Key === 'PRI';
  let value;

  switch (hint) {
    case 'enum': {
      const values = parseEnumValues(column.Type);
      value = values && values.length > 0 ? faker.helpers.arrayElement(values) : faker.lorem.word();
      break;
    }
    case 'firstName': value = faker.person.firstName(); break;
    case 'lastName': value = faker.person.lastName(); break;
    case 'email': value = faker.internet.email({ provider: 'example.com' }); break;
    case 'phone':
      value = faker.phone.number();
      if (value.length > 20) {
        value = faker.string.numeric(10).replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
      }
      break;
    case 'address': value = faker.location.streetAddress(); break;
    case 'city': value = faker.location.city(); break;
    case 'country': value = faker.location.country(); break;
    case 'zipCode': value = faker.location.zipCode(); break;
    case 'birthDate': value = faker.date.birthdate({ min: 18, max: 90, mode: 'age' }).toISOString().split('T')[0]; break;
    case 'date': value = faker.date.past({ years: 10 }).toISOString().split('T')[0]; break;
    case 'age': value = faker.number.int({ min: 18, max: 90 }); break;
    case 'salary': value = faker.number.int({ min: 30000, max: 150000 }); break;
    case 'price': value = parseFloat(faker.commerce.price({ min: 1, max: 1000 })); break;
    case 'description': value = faker.lorem.sentence(); break;
    case 'title': value = faker.lorem.words(3); break;
    case 'company': value = faker.company.name(); break;
    case 'jobTitle': value = faker.person.jobTitle(); break;
    case 'url': value = faker.internet.url(); break;
    case 'ip': value = faker.internet.ip(); break;
    case 'color': value = faker.color.human(); break;
    case 'product': value = faker.commerce.product(); break;
    case 'category': value = faker.commerce.department(); break;
    case 'gender': value = faker.person.sex(); break;
    case 'password': value = faker.internet.password(); break;
    case 'username': value = faker.internet.username().toLowerCase(); break;
    case 'dni': value = faker.string.numeric(8); break;
    case 'sku': value = 'SKU-' + faker.string.alphanumeric(8).toUpperCase(); break;
    case 'integer': value = faker.number.int({ min: 1, max: 9999 }); break;
    case 'decimal': value = parseFloat(faker.finance.amount({ min: 1, max: 9999 })); break;
    case 'word': value = faker.lorem.word(); break;
    default: value = faker.lorem.word(); break;
  }

  if (isUnique) {
    globalCounter++;
    const suffix = '_' + (globalCounter % 100000);
    const effectiveMax = maxLen ? maxLen - suffix.length : null;
    value = truncate(value, effectiveMax) + suffix;
  }

  value = truncate(value, maxLen);

  if (uniqueTracker && uniqueTracker.has(column.Field)) {
    const set = uniqueTracker.get(column.Field);
    if (set.has(value)) {
      const suffix = '_' + (rowIndex % 10000);
      const effectiveMax = maxLen ? maxLen - suffix.length : null;
      value = truncate(value, effectiveMax) + suffix;
    }
    set.add(value);
  }

  return value;
}

function generateFakeData(columns, count, foreignKeyValues) {
  console.log(`[FAKER] Generando ${count} registros para ${columns.length} columnas...`);

  const uniqueTracker = new Map();
  for (const col of columns) {
    if (col.Key === 'UNI' || col.Key === 'PRI') {
      uniqueTracker.set(col.Field, new Set());
      console.log(`[FAKER]   Columna única detectada: ${col.Field}`);
    }
  }

  const fkColumns = foreignKeyValues ? Object.keys(foreignKeyValues) : [];
  if (fkColumns.length > 0) {
    console.log(`[FAKER]   FK columns: ${fkColumns.join(', ')}`);
  }

  const rows = [];
  for (let i = 0; i < count; i++) {
    const row = {};
    for (const col of columns) {
      if (col.Extra && col.Extra.toLowerCase().includes('auto_increment')) {
        continue;
      }

      if (foreignKeyValues && foreignKeyValues[col.Field] && foreignKeyValues[col.Field].length > 0) {
        row[col.Field] = faker.helpers.arrayElement(foreignKeyValues[col.Field]);
      } else if (foreignKeyValues && foreignKeyValues[col.Field] && foreignKeyValues[col.Field].length === 0) {
        row[col.Field] = null;
      } else {
        row[col.Field] = generateValue(col, i, uniqueTracker);
      }
    }
    rows.push(row);
  }

  console.log(`[FAKER] Generados ${rows.length} registros`);
  if (rows.length > 0) {
    console.log(`[FAKER] Columnas: ${Object.keys(rows[0]).join(', ')}`);
    console.log(`[FAKER] Primer registro:`, JSON.stringify(rows[0], null, 2));
  }

  return rows;
}

module.exports = { generateFakeData, generateValue, guessColumnType, parseEnumValues };
