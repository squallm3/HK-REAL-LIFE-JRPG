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

// ── LOGIN CON GOOGLE + SINCRONIZACIÓN CON EL BACKEND ──
const firebaseConfig = {
  apiKey: "AIzaSyAwy1_6C6_p_N-PxE2_NeSHerXpdXNpvqo",
  authDomain: "lista-de-tareas-gnostica.firebaseapp.com",
  projectId: "lista-de-tareas-gnostica",
  storageBucket: "lista-de-tareas-gnostica.firebasestorage.app",
  messagingSenderId: "53950811543",
  appId: "1:53950811543:web:892bcc7a08db5c89ae48d2",
  measurementId: "G-QL4L4RLHC1"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const BACKEND_URL = (window.location.hostname === 'hkjrpg.duckdns.org') ? '' : 'http://192.168.1.133:3001';

let usandoBackend = false;

function iniciarSesionGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(function(err) {
    console.error('Error de login:', err);
    appendError('No se pudo iniciar sesión: ' + err.message);
  });
}

function cerrarSesion() {
  auth.signOut();
}

auth.onAuthStateChanged(function(user) {
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const userInfo = document.getElementById('user-info');

  if (user) {
    loginBtn.style.display = 'none';
    logoutBtn.style.display = '';
    userInfo.textContent = user.email;
    usandoBackend = true;
    cargarPersonajeBackend();
  } else {
    loginBtn.style.display = '';
    logoutBtn.style.display = 'none';
    userInfo.textContent = '';
    usandoBackend = false;
    cargarPartida();
    renderState();
  }
});

async function cargarPersonajeBackend() {
  try {
    const token = await auth.currentUser.getIdToken();
    const resp = await fetch(BACKEND_URL + '/api/personajes/mio', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    xpTotalJugador = data.xpAcumulada;
    renderState();
  } catch (e) {
    console.error('No se pudo cargar el personaje del backend:', e);
    appendError('No se pudo conectar con el servidor para traer tu progreso.');
  }
}

async function guardarPersonajeBackend() {
  if (!usandoBackend || !auth.currentUser) return;
  try {
    const token = await auth.currentUser.getIdToken();
    const nivel = findLevelByXp(xpTotalJugador);
    await fetch(BACKEND_URL + '/api/personajes/mio', {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ xpAcumulada: xpTotalJugador, nivelId: nivel.n })
    });
  } catch (e) {
    console.error('No se pudo guardar en el backend:', e);
  }
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

// ── EXPORTAR / IMPORTAR PARTIDA (archivo JSON) ──
function exportarPartida() {
  const data = JSON.stringify({ xp: xpTotalJugador }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'partida-odisea-haikus-gnosticos.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importarPartidaArchivo(event) {
  const file = event.target.files[0];
  const status = document.getElementById('save-status');
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (typeof data.xp !== 'number' || data.xp < 0) {
        status.textContent = 'Archivo inválido.';
        status.style.color = 'var(--red-bright)';
        return;
      }
      xpTotalJugador = data.xp;
      renderState();
      guardarPartida();
      const nivel = findLevelByXp(xpTotalJugador);
      status.textContent = 'Partida cargada: Nivel ' + nivel.n + ' — ' + nivel.t;
      status.style.color = 'var(--green-magic)';
    } catch (err) {
      status.textContent = 'No se pudo leer el archivo.';
      status.style.color = 'var(--red-bright)';
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ── RESUMEN DEL DÍA ──
const DIA_KEY = 'odisea_haikus_gnosticos_dia';

function fechaHoy() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function registrarTareaDelDia(desc, xp) {
  let data;
  try {
    const raw = localStorage.getItem(DIA_KEY);
    data = raw ? JSON.parse(raw) : null;
  } catch (e) {
    data = null;
  }
  const hoy = fechaHoy();
  if (!data || data.fecha !== hoy) {
    data = { fecha: hoy, tareas: [] };
  }
  data.tareas.push({ desc, xp });
  try {
    localStorage.setItem(DIA_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('No se pudo guardar el resumen del día:', e);
  }
}

function abrirResumenDia() {
  let data;
  try {
    const raw = localStorage.getItem(DIA_KEY);
    data = raw ? JSON.parse(raw) : null;
  } catch (e) {
    data = null;
  }
  const hoy = fechaHoy();
  const lista = document.getElementById('resumen-lista');
  const totalEl = document.getElementById('resumen-total');
  lista.innerHTML = '';

  if (!data || data.fecha !== hoy || data.tareas.length === 0) {
    lista.innerHTML = '<p style="color:var(--text-dim);font-size:12px;">Todavía no registraste tareas hoy.</p>';
    totalEl.textContent = '';
  } else {
    let total = 0;
    data.tareas.forEach((t, i) => {
      total += t.xp;
      const row = document.createElement('div');
      row.className = 'resumen-row';
      row.innerHTML =
        '<span>' + t.desc + '</span>' +
        '<span class="resumen-row-right">+' + t.xp + ' XP' +
        '<button class="del-tarea-btn" onclick="eliminarTareaDelDia(' + i + ')" aria-label="Eliminar tarea">✕</button>' +
        '</span>';
      lista.appendChild(row);
    });
    totalEl.textContent = 'Total del día: ' + total.toLocaleString('es-AR') + ' XP';
  }

  document.getElementById('resumen-modal-overlay').classList.remove('hidden');
}

function eliminarTareaDelDia(idx) {
  let data;
  try {
    const raw = localStorage.getItem(DIA_KEY);
    data = raw ? JSON.parse(raw) : null;
  } catch (e) {
    data = null;
  }
  if (!data || !data.tareas || !data.tareas[idx]) return;

  const tarea = data.tareas[idx];
  data.tareas.splice(idx, 1);

  try {
    localStorage.setItem(DIA_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('No se pudo actualizar el resumen del día:', e);
  }

  xpTotalJugador = Math.max(0, xpTotalJugador - tarea.xp);
  renderState();
  guardarPartida();
  guardarPersonajeBackend();
  abrirResumenDia();
}

function cerrarResumenDia() {
  document.getElementById('resumen-modal-overlay').classList.add('hidden');
}

function cerrarResumenDiaOverlay(e) {
  if (e.target.id === 'resumen-modal-overlay') cerrarResumenDia();
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
    cerrarResumenDia();
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
  guardarPersonajeBackend();
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
  if (role === 'jugador') {
    avatarDiv.className = 'avatar';
    const canvas = document.createElement('canvas');
    avatarDiv.appendChild(canvas);
    drawJugadorAvatar(canvas);
  } else {
    avatarDiv.className = 'avatar-valis-emoji';
    avatarDiv.textContent = '🦊';
  }

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
  avatarDiv.className = 'avatar-valis-emoji';
  avatarDiv.textContent = '🦊';

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
  const frasesNivel = FRAGMENTOS[resultado.nivelDespues.n];
  fragmento.textContent = frasesNivel ? frasesNivel[Math.floor(Math.random() * frasesNivel.length)] : '';
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
    <p class="levelup-parrafo">
      ¡Ascendiste al Nivel ${lvl.n}! Ahora sos <strong>${lvl.t}</strong>, portador de <strong>${lvl.art}</strong>.
    </p>
    <a href="#" class="detalles-link" onclick="abrirModalEstado(); return false;">Click aquí para más detalles</a>
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
  guardarPersonajeBackend();
  registrarTareaDelDia(desc, xp);
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