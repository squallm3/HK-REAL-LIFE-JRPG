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

function parseSingleEntry(text) {
  const numMatch = text.match(/\d+/);
  if (!numMatch) {
    return {error: true, message: "Ingresá un número de XP y una palabra que describa la tarea. Ejemplo: +50 por lavar los platos"};
  }
  const xp = parseInt(numMatch[0], 10);
  const desc = text.replace(numMatch[0], "").replace(/^[+\-]?\s*/, "").trim();
  if (!desc) {
    return {error: true, message: "Ingresá también una palabra que describa la tarea junto al número. Ejemplo: +50 por lavar los platos"};
  }
  return {error: false, xp, desc};
}

function parseInput(rawText) {
  const texto = (rawText || "").trim();
  const cantidadNumeros = (texto.match(/\d+/g) || []).length;
  if (cantidadNumeros === 0) {
    return {error: true, message: "Ingresá un número de XP y una palabra que describa la tarea. Ejemplo: +50 por lavar los platos"};
  }
  if (cantidadNumeros > 1 && !texto.includes(",")) {
    return {error: true, message: "Parece que estás cargando más de una tarea en el mismo mensaje. Separalas con comas. Ejemplo: +50 por lavar los platos, +30 por leer 10 páginas"};
  }
  const partes = texto.split(",").map(p => p.trim()).filter(p => p.length > 0);
  const entradas = [];
  for (const parte of partes) {
    const parsed = parseSingleEntry(parte);
    if (parsed.error) return parsed;
    entradas.push(parsed);
  }
  const xpTotal = entradas.reduce((suma, e) => suma + e.xp, 0);
  return {error: false, entradas, xpTotal};
}

function procesarTurno(xpActual, textoInput) {
  const resultadoInput = parseInput(textoInput);
  if (resultadoInput.error) {
    return {error: true, message: resultadoInput.message};
  }
  const xpAntes = xpActual;
  const xpDespues = xpActual + resultadoInput.xpTotal;
  const nivelAntes = findLevelByXp(xpAntes);
  const nivelDespues = findLevelByXp(xpDespues);
  const nivelesSubidos = levelsCrossed(xpAntes, xpDespues);
  const siguienteNivel = nextLevel(nivelDespues.n);
  return {
    error: false,
    entradas: resultadoInput.entradas,
    xpGanada: resultadoInput.xpTotal,
    xpAntes, xpDespues, nivelAntes, nivelDespues, nivelesSubidos,
    subioDeNivel: nivelesSubidos.length > 0,
    faltanParaSiguiente: siguienteNivel ? siguienteNivel.xp - xpDespues : 0,
    siguienteNivel
  };
}

let xpTotalJugador = 0;

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

  xpTotalJugador = match.xp;
  renderState();
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
  fragmento.textContent = '(fragmento narrativo pendiente — tarea 4)';
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
  const input = document.getElementById('user-input');
  const text = input.value.trim();
  if (!text) return;

  const emptyState = document.getElementById('empty-state');
  if (emptyState) emptyState.remove();

  appendMessage('jugador', text);
  input.value = '';
  updateCharCount();

  const resultado = procesarTurno(xpTotalJugador, text);

  if (resultado.error) {
    appendError(resultado.message);
    return;
  }

  xpTotalJugador = resultado.xpDespues;
  appendValisTurno(resultado);
  renderState();
}

document.getElementById('password-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    probarPassword();
  }
});

document.getElementById('user-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

document.getElementById('user-input').addEventListener('input', function() {
  updateCharCount();
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

function updateCharCount() {
  const len = document.getElementById('user-input').value.length;
  document.getElementById('char-count').textContent = len + ' caracteres';
}

renderState();