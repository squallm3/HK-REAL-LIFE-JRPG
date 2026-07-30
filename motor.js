(function() {
  const container = document.getElementById('stars');
  for (let i = 0; i < 60; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 100 + '%';
    s.style.setProperty('--d', (2 + Math.random() * 4) + 's');
    s.style.setProperty('--delay', (-Math.random() * 4) + 's');
    s.style.opacity = Math.random() * 0.5;
    container.appendChild(s);
  }
})();

function drawJugadorAvatar(canvas) {
  const ctx = canvas.getContext('2d');
  const S = 10;
  canvas.width = 4 * S;
  canvas.height = 4 * S;
  ctx.fillStyle = '#c8c8c8';
  ctx.fillRect(S, 0, 2*S, S);
  ctx.fillStyle = '#c09060';
  ctx.fillRect(S, S, 2*S, S);
  ctx.fillStyle = '#c9a84c';
  ctx.fillRect(S, S, S/2, S/2);
  ctx.fillRect(2*S+S/2, S, S/2, S/2);
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 2*S, 4*S, S);
  ctx.fillStyle = '#c9a84c';
  ctx.fillRect(S+S/4, 2*S+S/4, S/2, S/2);
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(S/2, 3*S, S, S);
  ctx.fillRect(2*S+S/2, 3*S, S, S);
}

function drawValisAvatar(canvas) {
  const ctx = canvas.getContext('2d');
  const S = 10;
  canvas.width = 4 * S;
  canvas.height = 4 * S;
  ctx.fillStyle = '#8a4fc9';
  ctx.fillRect(S/2, 0, S, S/2);
  ctx.fillRect(2*S+S/2, 0, S, S/2);
  ctx.fillStyle = '#a873e0';
  ctx.fillRect(S, S/2, 2*S, S+S/2);
  ctx.fillStyle = '#f5f0ff';
  ctx.fillRect(S+S/4, S+S/2, S+S/2, S);
  ctx.fillStyle = '#2a1a40';
  ctx.fillRect(S+S/4, S, S/4, S/4);
  ctx.fillRect(2*S+S/2, S, S/4, S/4);
  ctx.fillStyle = '#601a8f';
  ctx.fillRect(0, 2*S, 4*S, 2*S);
  ctx.fillStyle = '#c9a84c';
  ctx.fillRect(S/2, 2*S, 3*S, S/4);
}

function findLevelByXp(totalXp) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (totalXp >= lvl.xp) current = lvl;
    else break;
  }
  return current;
}

function nextLevel(levelNumber) {
  return LEVELS.find(l => l.n === levelNumber + 1) || null;
}

function levelsCrossed(xpBefore, xpAfter) {
  const before = findLevelByXp(xpBefore).n;
  const after = findLevelByXp(xpAfter).n;
  const crossed = [];
  for (let n = before + 1; n <= after; n++) {
    const lvl = LEVELS.find(l => l.n === n);
    if (lvl) crossed.push(lvl);
  }
  return crossed;
}

// ── PROCESA UNA TAREA ESTRUCTURADA (selector de XP + descripción) ──
function procesarTarea(xpActual, xpGanada, descripcion) {
  const xpAntes = xpActual;
  const xpDespues = xpActual + xpGanada;
  const nivelAntes = findLevelByXp(xpAntes);
  const nivelDespues = findLevelByXp(xpDespues);
  const nivelesSubidos = levelsCrossed(xpAntes, xpDespues);
  const siguienteNivel = nextLevel(nivelDespues.n);
  return {
    descripcion,
    xpGanada,
    xpAntes, xpDespues, nivelAntes, nivelDespues, nivelesSubidos,
    subioDeNivel: nivelesSubidos.length > 0,
    faltanParaSiguiente: siguienteNivel ? siguienteNivel.xp - xpDespues : 0,
    siguienteNivel
  };
}

let xpTotalJugador = 0;

// ── PERSISTENCIA (localStorage) ──
const STORAGE_KEY = 'odisea_haikus_gnosticos_save';

function guardarPartida() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ xp: xpTotalJugador }));
  } catch (e) {
    console.error('No se pudo guardar la partida:', e);
  }
}

function cargarPartida() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (typeof data.xp === 'number' && data.xp >= 0) {
      xpTotalJugador = data.xp;
    }
  } catch (e) {
    console.error('No se pudo cargar la partida:', e);
  }
}

function renderState() {
  const nivel = findLevelByXp(xpTotalJugador);
  const sig = nextLevel(nivel.n);
  document.getElementById('state-level').textContent = 'Nivel ' + nivel.n;
  document.getElementById('state-xp').textContent = xpTotalJugador.toLocaleString('es-AR') + ' XP';
  document.getElementById('state-title').textContent = nivel.t;
  if (sig) {
    const pct = Math.min(100, Math.round(((xpTotalJugador - nivel.xp) / (sig.xp - nivel.xp)) * 100));
    document.getElementById('xp-bar-fill').style.width = pct + '%';
    document.getElementById('xp-bar-label').textContent = (sig.xp - xpTotalJugador).toLocaleString('es-AR') + ' XP para el nivel ' + sig.n;
  } else {
    document.getElementById('xp-bar-fill').style.width = '100%';
    document.getElementById('xp-bar-label').textContent = 'Nivel máximo alcanzado';
  }
}

function pad2(n) { return String(n).padStart(2, '0'); }
function imgNivel(n) { return 'assets/niveles/nivel_' + pad2(n) + '_a.jpg'; }
function imgArtefacto(n) { return 'assets/niveles/nivel_' + pad2(n) + '_b.jpg'; }

function abrirLightbox(src, alt) {
  const img = document.getElementById('lightbox-img');
  img.src = src;
  img.alt = alt;
  document.getElementById('lightbox-overlay').classList.remove('hidden');
}
function cerrarLightbox() {
  document.getElementById('lightbox-overlay').classList.add('hidden');
}

function crearImagenClickeable(src, alt, className) {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  if (className) img.className = className;
  img.onerror = function() { this.style.display = 'none'; };
  img.addEventListener('click', function() { abrirLightbox(src, alt); });
  return img;
}

function abrirModalEstado() {
  renderModalEstado();
  document.getElementById('estado-modal-overlay').classList.remove('hidden');
}

function cerrarModalEstado() {
  document.getElementById('estado-modal-overlay').classList.add('hidden');
}

function cerrarModalEstadoOverlay(e) {
  if (e.target.id === 'estado-modal-overlay') cerrarModalEstado();
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    cerrarLightbox();
    cerrarModalEstado();
  }
});

function renderModalEstado() {
  const nivel = findLevelByXp(xpTotalJugador);

  document.getElementById('modal-titulo-nivel').textContent = 'Nivel ' + nivel.n;

  // ── Personaje actual (imagen + nombre, sin descripción) ──
  const personajeActual = document.getElementById('modal-personaje-actual');
  personajeActual.innerHTML = '';
  const wrapP = document.createElement('div');
  wrapP.className = 'modal-item-actual';
  wrapP.appendChild(crearImagenClickeable(imgNivel(nivel.n), nivel.t));
  const nombreP = document.createElement('p');
  nombreP.className = 'item-nombre';
  nombreP.textContent = nivel.t;
  wrapP.appendChild(nombreP);
  personajeActual.appendChild(wrapP);

  // ── Artefacto actual (imagen + nombre, SIN descripción — corregido) ──
  const artefactoActual = document.getElementById('modal-artefacto-actual');
  artefactoActual.innerHTML = '';
  const wrapA = document.createElement('div');
  wrapA.className = 'modal-item-actual';
  wrapA.appendChild(crearImagenClickeable(imgArtefacto(nivel.n), nivel.art));
  const nombreA = document.createElement('p');
  nombreA.className = 'item-nombre';
  nombreA.textContent = nivel.art;
  wrapA.appendChild(nombreA);
  artefactoActual.appendChild(wrapA);

  // ── Histórico (scrolleable, en paralelo en ambas columnas) ──
  const histPersonaje = document.getElementById('modal-personaje-historico');
  const histArtefacto = document.getElementById('modal-artefacto-historico');
  histPersonaje.innerHTML = '';
  histArtefacto.innerHTML = '';

  for (let n = nivel.n - 1; n >= 1; n--) {
    const lvl = LEVELS.find(l => l.n === n);
    if (!lvl) continue;

    const itemP = document.createElement('div');
    itemP.className = 'modal-hist-item';
    itemP.appendChild(crearImagenClickeable(imgNivel(lvl.n), lvl.t));
    const nombreHistP = document.createElement('p');
    nombreHistP.className = 'hist-nombre';
    nombreHistP.textContent = 'Nivel ' + lvl.n + ' — ' + lvl.t;
    itemP.appendChild(nombreHistP);
    histPersonaje.appendChild(itemP);

    const itemA = document.createElement('div');
    itemA.className = 'modal-hist-item';
    itemA.appendChild(crearImagenClickeable(imgArtefacto(lvl.n), lvl.art));
    const nombreHistA = document.createElement('p');
    nombreHistA.className = 'hist-nombre';
    nombreHistA.textContent = lvl.art;
    itemA.appendChild(nombreHistA);
    histArtefacto.appendChild(itemA);
  }
}

function probarPassword() {
  const input = document.getElementById('password-input');
  const status = document.getElementById('password-status');
  const texto = input.value.trim();
  if (!texto) return;

  const match = LEVELS.find(l => l.pw.toLowerCase() === texto.toLowerCase());

  if (!match) {
    status.textContent = 'Contraseña incorrecta.';
    status.style.color = 'var(--red-bright)';
    return;
  }

  const nivelActual = findLevelByXp(xpTotalJugador);

  if (match.n === nivelActual.n) {
    status.textContent = 'Ya estás en el Nivel ' + match.n + '.';
    status.style.color = 'var(--red-bright)';
    appendError('Estás ingresando la contraseña del nivel en el que ya te encontrás (Nivel ' + match.n + ' — ' + match.t + ').');
    input.value = '';
    return;
  }

  xpTotalJugador = match.xp;
  renderState();
  guardarPartida();
  status.textContent = 'Salto directo al Nivel ' + match.n + ' — ' + match.t;
  status.style.color = 'var(--green-magic)';
  input.value = '';

  const emptyState = document.getElementById('empty-state');
  if (emptyState) emptyState.remove();

  appendLevelUp(match);
}

function appendMessage(role, text) {
  const container = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'msg ' + role;

  const avatarDiv = document.createElement('div');
  avatarDiv.className = 'avatar';
  const canvas = document.createElement('canvas');
  avatarDiv.appendChild(canvas);
  if (role === 'jugador') drawJugadorAvatar(canvas); else drawValisAvatar(canvas);

  const bubbleDiv = document.createElement('div');
  bubbleDiv.className = 'bubble';
  const name = document.createElement('div');
  name.className = 'sender-name';
  name.textContent = role === 'jugador' ? 'Jugador' : 'VALIS';
  const inner = document.createElement('div');
  inner.className = 'bubble-inner';
  inner.textContent = text;

  bubbleDiv.appendChild(name);
  bubbleDiv.appendChild(inner);
  div.appendChild(avatarDiv);
  div.appendChild(bubbleDiv);
  container.appendChild(div);
  scrollToBottom();
}

function appendValisTurno(resultado) {
  const container = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'msg valis';

  const avatarDiv = document.createElement('div');
  avatarDiv.className = 'avatar';
  const canvas = document.createElement('canvas');
  drawValisAvatar(canvas);
  avatarDiv.appendChild(canvas);

  const bubbleDiv = document.createElement('div');
  bubbleDiv.className = 'bubble';
  const name = document.createElement('div');
  name.className = 'sender-name';
  name.textContent = 'VALIS';
  const inner = document.createElement('div');
  inner.className = 'bubble-inner';

  const xpLine = document.createElement('div');
  xpLine.className = 'xp-gain-text';
  xpLine.textContent = 'Sumaste +' + resultado.xpGanada + ' XP';
  inner.appendChild(xpLine);

  const fragmento = document.createElement('div');
  fragmento.className = 'fragmento-text';
  fragmento.textContent = FRAGMENTOS[resultado.nivelDespues.n] || '';
  inner.appendChild(fragmento);

  bubbleDiv.appendChild(name);
  bubbleDiv.appendChild(inner);
  div.appendChild(avatarDiv);
  div.appendChild(bubbleDiv);
  container.appendChild(div);

  if (resultado.subioDeNivel) {
    for (const lvl of resultado.nivelesSubidos) {
      appendLevelUp(lvl);
    }
  }

  scrollToBottom();
}

function appendLevelUp(lvl) {
  const container = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'levelup-block';
  div.innerHTML = `
    <div class="levelup-header">⚜ Ascensión — Nivel ${lvl.n}</div>
    <div class="levelup-row"><span>Título</span><span>${lvl.t}</span></div>
    <div class="levelup-row"><span>Artefacto</span><span>${lvl.art}</span></div>
    <div class="levelup-row"><span>Contraseña</span><span class="pw">${lvl.pw}</span></div>
  `;
  container.appendChild(div);
  scrollToBottom();
}

function appendError(message) {
  const container = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'error-block';
  div.textContent = message;
  container.appendChild(div);
  scrollToBottom();
}

function scrollToBottom() {
  const m = document.getElementById('messages');
  m.scrollTop = m.scrollHeight;
}

function sendMessage() {
  const xpSelect = document.getElementById('xp-select');
  const descInput = document.getElementById('task-desc-input');
  const xp = parseInt(xpSelect.value, 10);
  const desc = descInput.value.trim() || 'Tarea';

  const emptyState = document.getElementById('empty-state');
  if (emptyState) emptyState.remove();

  appendMessage('jugador', '+' + xp + ' por ' + desc);
  descInput.value = '';
  updateCharCount();

  const resultado = procesarTarea(xpTotalJugador, xp, desc);
  xpTotalJugador = resultado.xpDespues;
  appendValisTurno(resultado);
  renderState();
  guardarPartida();
}

document.getElementById('password-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    probarPassword();
  }
});

document.getElementById('task-desc-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendMessage();
  }
});

document.getElementById('task-desc-input').addEventListener('input', updateCharCount);

function updateCharCount() {
  const len = document.getElementById('task-desc-input').value.length;
  document.getElementById('char-count').textContent = len + ' caracteres';
}

cargarPartida();
renderState();