document.addEventListener('DOMContentLoaded', () => {

  /* ===================================================================
     STATE
  =================================================================== */
  const state = {
    tables: [],
    selectedTables: [],
    tableStructures: {}
  };

  const wizard = {
    currentStep: 1,
    stepsCompleted: { tabla: false, generar: false, vistaprevia: false }
  };

  const API = window.location.origin;

  /* ===================================================================
     STEPPER
  =================================================================== */
  function updateStepper() {
    const steps = document.querySelectorAll('.stepper__step');
    const lines = document.querySelectorAll('.stepper__line');
    steps.forEach((s, i) => {
      const stepNum = i + 1;
      const isCompleted = (stepNum < wizard.currentStep) || (stepNum === wizard.currentStep && wizard.stepsCompleted[['tabla','generar','vistaprevia','insertar'][i]]);
      const completedStrict = stepNum < wizard.currentStep;
      s.classList.toggle('is-active', stepNum === wizard.currentStep);
      s.classList.toggle('is-completed', completedStrict);
      const circle = s.querySelector('.stepper__circle');
      if (completedStrict) {
        circle.innerHTML = '<i class="fa-solid fa-check"></i>';
      } else if (stepNum === wizard.currentStep) {
        circle.innerHTML = '<span>' + stepNum + '</span>';
      } else {
        circle.innerHTML = '<span>' + stepNum + '</span>';
      }
    });
    lines.forEach((l, i) => {
      const lineNum = i + 1;
      l.classList.toggle('is-completed', lineNum < wizard.currentStep);
    });
  }

  /* ===================================================================
     SIDEBAR NAVIGATION
  =================================================================== */
  const navItems = document.querySelectorAll('.sidebar-nav__item');
  const pages = document.querySelectorAll('.page');

  function goToPage(pageId, useWizardAnim) {
    navItems.forEach(item => {
      item.classList.toggle('is-active', item.dataset.page === pageId);
    });
    const stepper = document.getElementById('stepper');
    const isWizard = ['tabla', 'generar', 'vistaprevia', 'insertar'].includes(pageId);
    stepper.style.display = isWizard ? 'flex' : 'none';
    pages.forEach(page => {
      const isTarget = page.id === 'page-' + pageId;
      page.classList.toggle('is-active', isTarget);
      if (isTarget && useWizardAnim) {
        page.classList.remove('wizard-enter');
        void page.offsetHeight;
        page.classList.add('wizard-enter');
      }
    });
    onPageEnter(pageId);
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => goToPage(item.dataset.page, false));
  });

  /* ===================================================================
     WIZARD - STEP COMPLETION
  =================================================================== */
  function markStepCompleted(stepId) {
    wizard.stepsCompleted[stepId] = true;
    const item = document.querySelector('.sidebar-nav__item[data-page="' + stepId + '"]');
    if (item) item.classList.add('sidebar-nav__item--completed');
    updateStepper();
  }

  function enableWizardBtn(btnId) {
    const btn = document.getElementById(btnId);
    if (!btn || !btn.disabled) return;
    btn.disabled = false;
    btn.classList.remove('wizard-btn--enabled', 'wizard-btn--animate');
    void btn.offsetHeight;
    btn.classList.add('wizard-btn--enabled', 'wizard-btn--animate');
  }

  function disableWizardBtn(btnId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = true;
    btn.classList.remove('wizard-btn--enabled', 'wizard-btn--animate');
  }

  /* ===================================================================
     WIZARD - NEXT BUTTONS
  =================================================================== */
  document.getElementById('wizardToGenerar')?.addEventListener('click', () => {
    wizard.currentStep = 2;
    markStepCompleted('tabla');
    goToPage('generar', true);
  });

  document.getElementById('wizardToPreview')?.addEventListener('click', () => {
    wizard.currentStep = 3;
    markStepCompleted('generar');
    goToPage('vistaprevia', true);
  });

  document.getElementById('wizardToInsert')?.addEventListener('click', () => {
    wizard.currentStep = 4;
    markStepCompleted('vistaprevia');
    goToPage('insertar', true);
  });

  /* ===================================================================
     LOGOUT
  =================================================================== */
  document.getElementById('logoutBtn').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  /* ===================================================================
     PAGE ENTER CALLBACKS
  =================================================================== */
  function onPageEnter(pageId) {
    switch (pageId) {
      case 'tabla': onEnterTabla(); break;
      case 'generar': onEnterGenerar(); break;
      case 'vistaprevia': onEnterPrevia(); break;
      case 'insertar': onEnterInsertar(); break;
      case 'historial': onEnterHistorial(); break;
    }
  }

  /* ===================================================================
     TABLA — CARD SELECTION
  =================================================================== */
  async function onEnterTabla() {
    if (state.tables.length === 0) await loadTables();
  }

  async function loadTables() {
    try {
      const res = await fetch(API + '/api/tables');
      if (!res.ok) throw new Error('Error ' + res.status);
      const data = await res.json();
      const raw = data.tables || data || [];
      state.tables = raw.map(t => ({ name: typeof t === 'string' ? t : (t.name || t.Table || t), structure: null }));
      renderAvailableTables();
      for (const t of state.tables) {
        if (!state.tableStructures[t.name]) {
          try {
            const sr = await fetch(API + '/api/tables/' + encodeURIComponent(t.name));
            if (sr.ok) {
              const sd = await sr.json();
              const cols = sd.columns || sd.fields || sd || [];
              state.tableStructures[t.name] = cols;
              t.structure = cols;
            }
          } catch (e) {}
        } else {
          t.structure = state.tableStructures[t.name];
        }
      }
      renderAvailableTables();
    } catch (err) {
      document.getElementById('availableTablesBody').innerHTML = '<p class="empty-msg">Error al cargar tablas</p>';
    }
  }

  function renderAvailableTables() {
    const container = document.getElementById('availableTablesBody');
    const selectedNames = state.selectedTables.map(t => t.name);
    const available = state.tables.filter(t => !selectedNames.includes(t.name));
    if (available.length === 0 && state.tables.length === 0) {
      container.innerHTML = '<p class="empty-msg">Cargando tablas...</p>';
      return;
    }
    if (available.length === 0) {
      container.innerHTML = '<p class="empty-msg" style="color:rgba(74,222,128,0.6)">Todas las tablas han sido seleccionadas</p>';
      return;
    }
    let html = '<div class="table-grid">';
    available.forEach(t => {
      const cols = t.structure || state.tableStructures[t.name] || [];
      const typeStr = cols.length > 0 ? cols.slice(0, 4).map(c => (c.Type || c.type || c.data_type || '?').split('(')[0]).join(' &middot; ') : '';
      html += '<div class="table-card" data-table="' + t.name + '">';
      html += '<div class="table-card__check"><i class="fa-solid fa-check"></i></div>';
      html += '<div class="table-card__icon"><i class="fa-solid fa-table"></i></div>';
      html += '<div class="table-card__name">' + t.name + '</div>';
      html += '<div class="table-card__cols">' + cols.length + ' columna' + (cols.length !== 1 ? 's' : '') + '</div>';
      if (typeStr) html += '<div class="table-card__types">' + typeStr + '</div>';
      html += '<div class="table-card__actions">';
      html += '<button class="card-action tbl-delete" data-table="' + t.name + '"><i class="fa-solid fa-trash-can"></i> Eliminar Datos</button>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
    container.querySelectorAll('.table-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.card-action')) return;
        selectTable(card.dataset.table);
      });
    });
    updateSelectedTablesSection();
  }

  function selectTable(name) {
    if (state.selectedTables.length >= 3) return;
    if (state.selectedTables.find(t => t.name === name)) return;
    const tableData = state.tables.find(t => t.name === name);
    const structure = (tableData && tableData.structure) || state.tableStructures[name] || [];
    state.selectedTables.push({ name, count: 100, structure, generatedData: null, generated: false });
    renderAvailableTables();
    updateSelectedTablesSection();
    if (state.selectedTables.length > 0) {
      enableWizardBtn('wizardToGenerar');
    }
  }

  function deselectTable(name) {
    state.selectedTables = state.selectedTables.filter(t => t.name !== name);
    renderAvailableTables();
    updateSelectedTablesSection();
    if (state.selectedTables.length === 0) {
      disableWizardBtn('wizardToGenerar');
    }
  }

  function updateSelectedTablesSection() {
    const card = document.getElementById('selectedTablesCard');
    const body = document.getElementById('selectedTablesBody');
    const label = document.getElementById('selectedCountLabel');
    label.textContent = state.selectedTables.length + ' / 3';
    if (state.selectedTables.length === 0) {
      card.style.display = 'none';
      return;
    }
    card.style.display = 'block';
    let html = '';
    state.selectedTables.forEach(t => {
      const cols = t.structure || [];
      const typeStr = cols.length > 0 ? cols.slice(0, 3).map(c => (c.Type || c.type || c.data_type || '?').split('(')[0]).join(', ') : '';
      html += '<div class="table-card table-card--chosen" data-table="' + t.name + '">';
      html += '<div class="table-card__icon"><i class="fa-solid fa-table"></i></div>';
      html += '<div class="table-card__info">';
      html += '<div class="table-card__name">' + t.name + '</div>';
      html += '<div class="table-card__cols">' + cols.length + ' columnas' + (typeStr ? ' &mdash; ' + typeStr : '') + '</div>';
      html += '</div>';
      html += '<button class="table-card__remove" data-table="' + t.name + '"><i class="fa-solid fa-xmark"></i></button>';
      html += '</div>';
    });
    body.innerHTML = html;
    body.querySelectorAll('.table-card__remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deselectTable(btn.dataset.table);
      });
    });
  }

  /* ===================================================================
     GENERAR DATOS — per-table cards
  =================================================================== */
  function onEnterGenerar() {
    renderGenerarCards();
  }

  function renderGenerarCards() {
    const container = document.getElementById('generarContainer');
    if (state.selectedTables.length === 0) {
      container.innerHTML = '<p class="empty-msg">No hay tablas seleccionadas.</p>';
      return;
    }
    let html = '';
    state.selectedTables.forEach((t, idx) => {
      const done = t.generated;
      html += '<div class="card gen-card" data-idx="' + idx + '">';
      html += '<div class="card__body">';
      html += '<div class="gen-card__header">';
      html += '<i class="fa-solid fa-table"></i>';
      html += '<h4>' + t.name + '</h4>';
      if (done) html += '<span style="margin-left:auto;font-size:12px;color:#4ade80"><i class="fa-solid fa-check-circle"></i> Generado</span>';
      html += '</div>';
      html += '<div class="form-group">';
      html += '<label class="form-group__label">Cantidad de registros</label>';
      html += '<input type="number" class="form-control gen-count" value="' + t.count + '" min="1" max="10000" ' + (done ? 'disabled' : '') + '>';
      html += '</div>';
      if (!done) {
        html += '<button class="btn btn-primary gen-btn" data-idx="' + idx + '"><i class="fa-solid fa-wand-magic-sparkles"></i> Generar Datos</button>';
      } else {
        html += '<div class="msg msg--success"><i class="fa-solid fa-circle-check"></i> Datos generados correctamente</div>';
      }
      html += '</div>';
      html += '</div>';
    });
    container.innerHTML = html;
    container.querySelectorAll('.gen-btn').forEach(btn => {
      btn.addEventListener('click', () => generateForTable(parseInt(btn.dataset.idx)));
    });
    updateWizardBtnGenerar();
  }

  async function generateForTable(idx) {
    const entry = state.selectedTables[idx];
    if (!entry) return;
    const card = document.querySelector('.gen-card[data-idx="' + idx + '"]');
    const input = card ? card.querySelector('.gen-count') : null;
    const count = input ? parseInt(input.value, 10) || 100 : entry.count;
    entry.count = count;
    const btn = card ? card.querySelector('.gen-btn') : null;
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando...';
    }
    try {
      const res = await fetch(API + '/api/generate/' + encodeURIComponent(entry.name) + '?records=' + count);
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'Error ' + res.status);
      }
      const data = await res.json();
      entry.generatedData = { table: entry.name, count, data };
      entry.generated = true;
    } catch (err) {
      console.warn('[MAIN] GET generate falló, intentando POST:', err.message);
      try {
        const res2 = await fetch(API + '/api/generate/' + encodeURIComponent(entry.name), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ count, preview: true })
        });
        if (!res2.ok) {
          const errBody2 = await res2.json().catch(() => ({}));
          throw new Error(errBody2.error || 'Error ' + res2.status);
        }
        const data2 = await res2.json();
        entry.generatedData = { table: entry.name, count, data: data2 };
        entry.generated = true;
      } catch (err2) {
        console.error('[MAIN] Error al generar datos para', entry.name, ':', err2.message);
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Generar Datos';
        }
        const cardEl = document.querySelector('.gen-card[data-idx="' + idx + '"]');
        if (cardEl) {
          let errEl = cardEl.querySelector('.gen-error');
          if (!errEl) {
            errEl = document.createElement('div');
            errEl.className = 'gen-error';
            errEl.style.cssText = 'color:#f87171;font-size:12px;margin-top:8px;padding:6px 10px;background:rgba(248,113,113,0.1);border-radius:6px;word-break:break-word';
            cardEl.querySelector('.card__body').appendChild(errEl);
          }
          errEl.textContent = '✗ ' + (err2.message || 'Error al generar');
        }
        return;
      }
    }
    renderGenerarCards();
    updateWizardBtnGenerar();
  }

  function updateWizardBtnGenerar() {
    const allDone = state.selectedTables.length > 0 && state.selectedTables.every(t => t.generated);
    if (allDone) {
      enableWizardBtn('wizardToPreview');
    } else {
      disableWizardBtn('wizardToPreview');
    }
  }

  /* ===================================================================
     VISTA PREVIA — per-table previews
  =================================================================== */
  function onEnterPrevia() {
    renderPreviaCards();
    updateWizardBtnPrevia();
  }

  function renderPreviaCards() {
    const container = document.getElementById('previaContainer');
    const valid = state.selectedTables.filter(t => t.generated && t.generatedData && t.generatedData.data);
    if (valid.length === 0) {
      container.innerHTML = '<div class="card"><div class="card__body"><p class="empty-msg">No hay datos generados. Ve a <strong>GENERAR</strong> primero.</p></div></div>';
      return;
    }
    let html = '';
    valid.forEach((t, idx) => {
      const data = t.generatedData.data;
      const rows = Array.isArray(data) ? data : (data.data || data.rows || [data]);
      const cols = rows.length > 0 ? Object.keys(rows[0]) : [];
      html += '<div class="card previa-card">';
      html += '<div class="previa-card__header">';
      html += '<div class="previa-card__header-left">';
      html += '<i class="fa-solid fa-table"></i>';
      html += '<h4>' + t.name + '</h4>';
      html += '</div>';
      html += '<div class="previa-card__header-right">' + t.count + ' registros generados</div>';
      html += '</div>';
      if (rows.length > 0 && cols.length > 0) {
        html += '<div class="card__body card__body--no-pad"><div class="table-wrap"><table class="data-table"><thead><tr>';
        cols.forEach(c => { html += '<th>' + c + '</th>'; });
        html += '</tr></thead><tbody>';
        const maxRows = Math.min(rows.length, 5);
        for (let i = 0; i < maxRows; i++) {
          html += '<tr>';
          cols.forEach(c => { html += '<td>' + (rows[i][c] != null ? rows[i][c] : '') + '</td>'; });
          html += '</tr>';
        }
        html += '</tbody></table></div></div>';
      }
      html += '</div>';
    });
    container.innerHTML = html;
  }

  function updateWizardBtnPrevia() {
    const valid = state.selectedTables.filter(t => t.generated && t.generatedData && t.generatedData.data);
    if (valid.length > 0) {
      enableWizardBtn('wizardToInsert');
    } else {
      disableWizardBtn('wizardToInsert');
    }
  }

  /* ===================================================================
     INSERTAR — summary per table
  =================================================================== */
  function onEnterInsertar() {
    renderInsertSummary();
  }

  function renderInsertSummary() {
    const container = document.getElementById('insertContainer');
    const valid = state.selectedTables.filter(t => t.generated && t.generatedData);
    if (valid.length === 0) {
      container.innerHTML = '<p class="empty-msg">No hay datos para insertar.</p>';
      return;
    }
    let html = '<div class="insert-table-list">';
    let totalRecords = 0;
    valid.forEach(t => {
      totalRecords += t.count;
      html += '<div class="insert-table-item">';
      html += '<div class="insert-table-item__left">';
      html += '<i class="fa-solid fa-circle-check"></i>';
      html += '<span>' + t.name + '</span>';
      html += '</div>';
      html += '<div class="insert-table-item__right">';
      html += '<span class="insert-table-item__count">' + t.count + ' registros</span>';
      html += '<span class="insert-table-item__status insert-table-item__status--pending">Pendiente</span>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
    html += '<div class="insert-total">';
    html += '<span class="insert-total__label">Total</span>';
    html += '<span class="insert-total__value">' + totalRecords + ' registros</span>';
    html += '</div>';
    html += '<button class="btn btn-primary" id="insertarBtn" style="margin-top:20px">';
    html += '<i class="fa-solid fa-database"></i> Insertar Registros</button>';
    container.innerHTML = html;
    document.getElementById('insertarBtn')?.addEventListener('click', startInsertAll);
  }

  async function startInsertAll() {
    const valid = state.selectedTables.filter(t => t.generated && t.generatedData);
    if (valid.length === 0) return;
    const container = document.getElementById('insertContainer');
    container.innerHTML = '<div class="card"><div class="card__body" style="text-align:center;padding:40px"><i class="fa-solid fa-spinner fa-spin" style="font-size:32px;color:rgba(255,255,255,0.25);margin-bottom:14px;display:block"></i><p style="color:rgba(255,255,255,0.45)">Insertando registros...</p></div></div>';
    const start = performance.now();
    let totalInserted = 0;
    let allSuccess = true;
    let lastError = '';
    for (const t of valid) {
      try {
        const res = await fetch(API + '/api/generate/' + encodeURIComponent(t.name), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ count: t.count })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error ' + res.status);
        totalInserted += data.inserted || data.count || t.count;
      } catch (err) {
        allSuccess = false;
        lastError = err.message;
      }
    }
    const elapsed = ((performance.now() - start) / 1000).toFixed(2);
    showInsertResult({ success: allSuccess, totalInserted, elapsed, tables: valid, error: lastError });
  }

  /* ===================================================================
     INSERT RESULT — inline card
  =================================================================== */
  function showInsertResult(result) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const isSuccess = result.success;
    const tableName = result.tables.map(t => t.name).join(', ');
    const statusColor = isSuccess ? '#4ade80' : '#f87171';
    const statusText = isSuccess ? 'Completado' : 'Error';
    const statusBg = isSuccess ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)';

    let html = '<div class="card" style="animation:chosenIn 0.35s ease both">';
    html += '<div class="card__header"><h3 class="card__title"><i class="fa-solid fa-circle-check" style="color:' + statusColor + ';margin-right:8px"></i> Inserci\u00f3n completada</h3></div>';
    html += '<div class="card__body" style="text-align:center">';
    html += '<div style="font-size:42px;color:' + statusColor + ';margin-bottom:10px"><i class="fa-solid fa-' + (isSuccess ? 'check-circle' : 'xmark-circle') + '"></i></div>';
    html += '<p style="font-size:16px;font-weight:600;color:white;margin-bottom:24px">' + (isSuccess ? 'Datos agregados correctamente' : 'Error al insertar los datos') + '</p>';
    html += '<div class="insert-result">';
    html += '<div class="insert-result__item"><span>Tabla</span><strong>' + tableName + '</strong></div>';
    html += '<div class="insert-result__item"><span>Registros insertados</span><strong>' + result.totalInserted + '</strong></div>';
    html += '<div class="insert-result__item"><span>Tiempo</span><strong>' + result.elapsed + ' segundos</strong></div>';
    html += '<div class="insert-result__item"><span>Estado</span><strong><span class="tag" style="background:' + statusBg + ';color:' + statusColor + '">' + statusText + '</span></strong></div>';
    html += '</div>';
    if (!isSuccess && result.error) {
      html += '<p style="color:#f87171;font-size:13px;margin-top:12px">' + result.error + '</p>';
    }
    html += '<button class="btn btn-primary" id="volverAInsertarBtn" style="margin-top:24px"><i class="fa-solid fa-arrow-left"></i> Volver a insertar</button>';
    html += '</div></div>';

    const container = document.getElementById('insertContainer');
    container.innerHTML = html;
    document.getElementById('volverAInsertarBtn')?.addEventListener('click', resetWizard);
    markStepCompleted('insertar');
  }

  /* ===================================================================
     WIZARD RESET
  =================================================================== */
  function resetWizard() {
    state.selectedTables = [];
    wizard.currentStep = 1;
    wizard.stepsCompleted = { tabla: false, generar: false, vistaprevia: false };
    document.querySelectorAll('.sidebar-nav__item--completed').forEach(el => {
      el.classList.remove('sidebar-nav__item--completed');
    });
    disableWizardBtn('wizardToGenerar');
    disableWizardBtn('wizardToPreview');
    disableWizardBtn('wizardToInsert');
    document.getElementById('generarContainer').innerHTML = '';
    document.getElementById('previaContainer').innerHTML = '';
    document.getElementById('insertContainer').innerHTML = '';
    updateStepper();
    renderAvailableTables();
    goToPage('tabla', false);
  }

  /* ===================================================================
     HISTORIAL
  =================================================================== */
  async function onEnterHistorial() {
    await loadHistorial();
  }

  async function loadHistorial() {
    const container = document.getElementById('historialContainer');
    try {
      const res = await fetch(API + '/api/history');
      if (!res.ok) throw new Error('Error ' + res.status);
      const entries = await res.json();
      if (!entries || entries.length === 0) {
        container.innerHTML = '<div class="card"><div class="card__body"><p class="empty-msg">No hay inserciones registradas aún.</p></div></div>';
        return;
      }
      let html = '';
      entries.forEach(e => {
        const fecha = new Date(e.fecha);
        const fechaStr = fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        html += '<div class="card" style="animation:chosenIn 0.3s ease both">';
        html += '<div class="card__body" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">';
        html += '<div style="flex:1;min-width:120px"><div style="font-size:14px;font-weight:600;color:white">' + e.tabla + '</div><div style="font-size:11px;color:rgba(255,255,255,0.40);margin-top:2px">' + fechaStr + '</div></div>';
        html += '<div style="text-align:right"><div style="font-size:18px;font-weight:700;color:white">' + e.cantidad + '</div><div style="font-size:11px;color:rgba(255,255,255,0.40)">registros</div></div>';
        html += '<div style="text-align:right;min-width:60px"><span class="tag tag--success">' + e.estado + '</span></div>';
        html += '<div style="text-align:right;min-width:50px"><div style="font-size:13px;color:rgba(255,255,255,0.55)">' + e.tiempo + '</div></div>';
        html += '</div></div>';
      });
      container.innerHTML = html;
    } catch (err) {
      console.error('[MAIN] Error cargando historial:', err);
      container.innerHTML = '<div class="card"><div class="card__body"><p class="empty-msg">Error al cargar el historial.</p></div></div>';
    }
  }

  /* ===================================================================
     ELIMINAR DATOS
  =================================================================== */
  function showDeleteConfirm(tableName) {
    const existing = document.getElementById('deleteOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'deleteOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;display:flex;align-items:center;justify-content:center';
    overlay.innerHTML = '<div style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.65);backdrop-filter:blur(6px)"></div>'
      + '<div class="card" style="position:relative;z-index:1;max-width:420px;width:90%;margin:0;text-align:center">'
      + '<div class="card__body">'
      + '<div style="font-size:40px;color:#f87171;margin-bottom:16px"><i class="fa-solid fa-triangle-exclamation"></i></div>'
      + '<h3 style="font-family:var(--font-display);font-size:18px;font-weight:600;color:white;margin-bottom:8px">¿Deseas eliminar todos los registros de esta tabla?</h3>'
      + '<p style="font-size:13px;color:rgba(255,255,255,0.50);margin-bottom:24px">Esta acción no eliminará la tabla, solo sus registros.</p>'
      + '<div style="display:flex;gap:10px;justify-content:center">'
      + '<button class="btn" id="cancelDelete" style="background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.70);padding:10px 24px;font-size:13px">Cancelar</button>'
      + '<button class="btn" id="confirmDelete" style="background:rgba(248,113,113,0.2);color:#f87171;padding:10px 24px;font-size:13px"><i class="fa-solid fa-trash-can"></i> Eliminar</button>'
      + '</div></div></div>';

    document.body.appendChild(overlay);

    document.getElementById('cancelDelete').addEventListener('click', () => overlay.remove());
    document.getElementById('confirmDelete').addEventListener('click', async () => {
      document.getElementById('confirmDelete').disabled = true;
      document.getElementById('confirmDelete').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Eliminando...';
      try {
        const res = await fetch(API + '/api/data/' + encodeURIComponent(tableName), { method: 'DELETE' });
        if (!res.ok) throw new Error((await res.json()).error || 'Error');
        const data = await res.json();
        overlay.remove();
        const toast = document.createElement('div');
        toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:10000;background:rgba(74,222,128,0.15);border:1px solid rgba(74,222,128,0.25);color:#4ade80;padding:14px 28px;border-radius:12px;font-size:14px;font-weight:600;backdrop-filter:blur(12px);animation:chosenIn 0.3s ease both';
        toast.innerHTML = '<i class="fa-solid fa-circle-check"></i> ' + data.deleted + ' registros eliminados de ' + tableName;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
        if (state.tableStructures[tableName]) {
          await loadTables();
        }
      } catch (err) {
        console.error('[MAIN] Error eliminando datos:', err);
        document.getElementById('confirmDelete').disabled = false;
        document.getElementById('confirmDelete').innerHTML = '<i class="fa-solid fa-trash-can"></i> Eliminar';
        const errEl = document.createElement('p');
        errEl.style.cssText = 'color:#f87171;font-size:12px;margin-top:12px';
        errEl.textContent = err.message;
        document.querySelector('#deleteOverlay .card__body').appendChild(errEl);
      }
    });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }

  /* ===================================================================
     EVENT DELEGATION — Eliminar Datos
  =================================================================== */
  document.addEventListener('click', (e) => {
    const delBtn = e.target.closest('.tbl-delete');
    if (delBtn) {
      showDeleteConfirm(delBtn.dataset.table);
    }
  });

  /* ===================================================================
     CONNECTION STATUS
  =================================================================== */
  async function checkConnection() {
    const dot = document.getElementById('connDot');
    const status = document.getElementById('connStatus');
    const db = document.getElementById('connDb');
    try {
      const res = await fetch(API + '/api/tables');
      if (res.ok) {
        dot.className = 'connection__dot connection__dot--ok';
        dot.innerHTML = '<i class="fa-solid fa-circle"></i>';
        status.textContent = 'Conectado a MySQL';
        try {
          const data = await res.json();
          const dbName = data.database || data.db || '';
          db.textContent = 'Base de datos: ' + (dbName || '');
        } catch (e) { db.textContent = ''; }
      } else {
        throw new Error('Not OK');
      }
    } catch (err) {
      dot.className = 'connection__dot connection__dot--err';
      dot.innerHTML = '<i class="fa-solid fa-circle"></i>';
      status.textContent = 'Sin conexi&oacute;n';
      db.textContent = '';
    }
  }

  checkConnection();
  setInterval(checkConnection, 30000);

  /* ===================================================================
     STARS ANIMATION
  =================================================================== */
  function initStars() {
    const canvas = document.getElementById('starsCanvas');
    const content = document.querySelector('.content');
    if (!canvas || !content) return;
    let W = 0;
    let H = 0;
    const ctx = canvas.getContext('2d');
    const CONFIG = {
      MAX_STARS: 60,
      SPAWN_RATE: 0.200,
      SPAWN_AMOUNT: 2,
      MAX_OPACITY: 0.55,
      TWINKLE_SPEED: 1.0,
      LIFE_TIME: 8,
      SMALL_STARS_PERCENT: 0.92,
    };
    const stars = [];
    function resize() {
      const nw = content.clientWidth;
      const nh = content.clientHeight;
      if (nw !== W || nh !== H) { W = Math.max(nw, 100); H = Math.max(nh, 100); canvas.width = W; canvas.height = H; }
    }
    function createStar() {
      return {
        x: Math.random() * W, y: Math.random() * H,
        size: Math.random() < CONFIG.SMALL_STARS_PERCENT ? (0.5 + Math.random() * 1.6) : (1.9 + Math.random() * 2.8),
        opacity: 0, maxOp: CONFIG.MAX_OPACITY * (0.75 + Math.random() * 0.35),
        speed: 0.009 + Math.random() * 0.015, phase: 'in', timer: 0,
        twinkle: CONFIG.TWINKLE_SPEED * (0.6 + Math.random() * 1.1),
        offset: Math.random() * Math.PI * 2, glow: Math.random() < 0.28
      };
    }
    function spawn(count) {
      resize();
      const n = count || CONFIG.SPAWN_AMOUNT;
      for (let i = 0; i < n; i++) { if (stars.length < CONFIG.MAX_STARS) stars.push(createStar()); }
    }
    let spawnTimer = 0;
    function update(dt) {
      resize();
      spawnTimer += dt;
      if (spawnTimer > CONFIG.SPAWN_RATE) { spawn(CONFIG.SPAWN_AMOUNT); spawnTimer = 0; }
      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        if (s.phase === 'in') {
          s.opacity = Math.min(s.opacity + s.speed * 1.8, s.maxOp);
          if (s.opacity >= s.maxOp * 0.95) { s.phase = 'stay'; s.timer = 0; }
        } else if (s.phase === 'stay') {
          s.timer += dt;
          s.opacity = s.maxOp * (0.68 + 0.32 * Math.sin(s.timer * s.twinkle + s.offset));
          if (s.timer > CONFIG.LIFE_TIME + Math.random() * 4) s.phase = 'out';
        } else if (s.phase === 'out') {
          s.opacity -= s.speed * 2.5;
          if (s.opacity <= 0) { stars.splice(i, 1); continue; }
        }
        ctx.save();
        ctx.globalAlpha = s.opacity;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        if (s.glow || s.size > 2.2) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * 2.8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, ' + (s.opacity * 0.18) + ')';
          ctx.fill();
        }
        ctx.restore();
      }
    }
    let lastTime = 0;
    let started = false;
    function loop(time) {
      if (!started) { started = true; resize(); spawn(CONFIG.MAX_STARS); }
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      ctx.clearRect(0, 0, W, H);
      update(dt);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    window.addEventListener('resize', resize);
  }

  initStars();

  /* ===================================================================
     INITIAL STEPPER STATE
  =================================================================== */
  updateStepper();
  // Set initial stepper visibility based on active page
  const activePage = document.querySelector('.page.is-active');
  if (activePage) {
    const pageId = activePage.id.replace('page-', '');
    const isWizard = ['tabla', 'generar', 'vistaprevia', 'insertar'].includes(pageId);
    document.getElementById('stepper').style.display = isWizard ? 'flex' : 'none';
  }

});


