/* ======== Configuración ======== */
const PERSONAS = [
  { nombre: "Siri",  emoji: "🦊" },
  { nombre: "Gus", emoji: "🤖" },
  { nombre: "Leo", emoji: "🧢" },
  { nombre: "Pily",  emoji: "🦉" },
  { nombre: "rommie NV", emoji: "🏠" },
];
// Lunes base: 10 de noviembre de 2025 (inicio de rotación)
const BASE_LUNES_ISO = "2025-11-10"; // YYYY-MM-DD
const TZ = "America/Mexico_City";
const STORAGE_KEY = "turnos-aseo-check-"; // + YYYY-WW + nombre
const THEME_KEY = "turnos-aseo-theme";

/* ======== Utilidades de fecha ======== */
function atMidnightLocal(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function toUTCStamp(date) {
  const d = atMidnightLocal(date);
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}
function mondayOf(date) {
  const d = atMidnightLocal(date);
  const w = (d.getDay() + 6) % 7; // 0 = lunes
  d.setDate(d.getDate() - w);
  return d;
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function fmtRange(mon, sun) {
  const optsD = { day: "2-digit", month: "short", timeZone: TZ };
  const optsY = { year: "numeric", timeZone: TZ };
  const intl = new Intl.DateTimeFormat("es-MX", optsD);
  const intlY = new Intl.DateTimeFormat("es-MX", optsY);
  const dm1 = intl.format(mon).replace(".", "");
  const dm2 = intl.format(sun).replace(".", "");
  const y = intlY.format(mon);
  return `${dm1} – ${dm2} ${y}`;
}
function fmtDayDMY(d) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit", month: "short", year: "numeric", timeZone: TZ
  }).format(d).replace(/\./g, "");
}
function yearWeek(date) {
  const monday = mondayOf(date);
  const y = monday.getFullYear();
  const oneJan = new Date(y, 0, 1);
  const weeks = Math.floor((toUTCStamp(monday) - toUTCStamp(mondayOf(oneJan))) / (7*24*60*60*1000));
  return `${y}-W${String(weeks).padStart(2, "0")}`;
}

/* ======== Cálculos de rotación ======== */
const BASE = new Date(BASE_LUNES_ISO + "T00:00:00");
function semanasTranscurridas(fecha) {
  const diff = toUTCStamp(mondayOf(fecha)) - toUTCStamp(BASE);
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
}
function idxPersonaParaFecha(fecha) {
  const w = semanasTranscurridas(fecha);
  const n = PERSONAS.length;
  return ((w % n) + n) % n;
}
function personaParaFecha(fecha) {
  return PERSONAS[idxPersonaParaFecha(fecha)];
}

/* ======== Referencias DOM ======== */
const slotTrack = document.getElementById("slotTrack");
const btnRevelar = document.getElementById("btnRevelar");
const flipCard = document.getElementById("flipCard");
const quienEl = document.getElementById("quien");
const rangoEl = document.getElementById("rango");
const siguienteEl = document.getElementById("siguiente");
const emojiEl = document.getElementById("emoji");
const ring = document.getElementById("ring");
const pct = document.getElementById("pct");
const todoList = document.getElementById("todoList");
const timeline = document.getElementById("timeline");
const cursor = document.getElementById("cursor");
const tip = document.getElementById("tip");
const listaProximas = document.getElementById("listaProximas");
const themePills = document.querySelectorAll('.pill');

/* ======== Tema (píldoras + URL + persistencia) ======== */
function validTheme(t){ return ["blue","green","orange"].includes(String(t)); }

function applyTheme(theme){
  document.documentElement.setAttribute("data-theme", theme);
  try { localStorage.setItem(THEME_KEY, theme); } catch {}
  // Marca la píldora activa
  themePills.forEach(p=>{
    const active = p.dataset.theme === theme;
    p.setAttribute("aria-pressed", active ? "true" : "false");
  });
  // Actualiza meta theme-color para la barra del navegador en móvil
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const color = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#ffffff";
    meta.setAttribute("content", color);
  }
}

function initTheme(){
  // 1) Si la URL trae ?theme=..., lo aplicamos y guardamos
  const url = new URL(window.location.href);
  const param = url.searchParams.get("theme");
  if (validTheme(param)) {
    applyTheme(param);
    return; // la preferencia ya quedó guardada
  }
  // 2) Si no hay param, cargamos del localStorage o 'blue'
  const saved = (typeof localStorage !== "undefined" && localStorage.getItem(THEME_KEY)) || "blue";
  applyTheme(validTheme(saved) ? saved : "blue");
}

// Listener para las píldoras
function bindThemePills(){
  themePills.forEach(p=>{
    p.addEventListener("click", ()=> applyTheme(p.dataset.theme));
  });
}

/* ======== 1) Ruleta / Slot ======== */
function buildSlotItems() {
  const items = [...PERSONAS, ...PERSONAS, ...PERSONAS];
  slotTrack.innerHTML = items.map((p, i) => {
    const tagClass = i % 3 === 0 ? "tag-blue" : i % 3 === 1 ? "tag-green" : "tag-orange";
    return `<div><span class="tag ${tagClass}">${(i % PERSONAS.length)+1}</span> ${p.emoji} ${p.nombre}</div>`;
  }).join("");
}
function spinToIndex(index){
  const itemH = 56;
  const repeats = 4; // vueltas
  const total = PERSONAS.length;
  const stop = (repeats * total + index) * itemH;
  slotTrack.animate(
    [{ transform:`translateY(0)` }, { transform:`translateY(-${stop}px)` }],
    { duration:1200, easing:"cubic-bezier(.2,.8,.2,1)", fill:"forwards" }
  );
  setTimeout(showFlip, 1200);
}

/* ======== 2) Flip 3D (esta semana) ======== */
function showFlip(){
  const ahora = new Date();
  const lunes = mondayOf(ahora);
  const domingo = addDays(lunes, 6);

  const idx = idxPersonaParaFecha(ahora);
  const persona = PERSONAS[idx];
  const siguiente = PERSONAS[(idx + 1) % PERSONAS.length];

  quienEl.textContent = persona.nombre;
  rangoEl.textContent = fmtRange(lunes, domingo);
  siguienteEl.textContent = siguiente.nombre;
  emojiEl.textContent = persona.emoji;

  flipCard.classList.add("show");
}

/* ======== 3) Progreso + Checklist (persistencia semanal por persona) ======== */
let done = [false, false, false];

function storageKeyForCurrent(){
  const wk = yearWeek(new Date());
  const persona = personaParaFecha(new Date()).nombre;
  return `${STORAGE_KEY}${wk}-${persona}`;
}
function loadChecklist(){
  try {
    const raw = localStorage.getItem(storageKeyForCurrent());
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (Array.isArray(arr) && arr.length === 3) done = arr;
  } catch {}
}
function saveChecklist(){
  try { localStorage.setItem(storageKeyForCurrent(), JSON.stringify(done)); } catch {}
}
function updateRing(){
  const count = done.filter(Boolean).length;
  const total = done.length;
  const dash = 327 * (1 - count/total);
  ring.style.strokeDashoffset = dash;
  pct.textContent = Math.round((count/total)*100) + "%";
}
function initChecklist(){
  loadChecklist();
  todoList.querySelectorAll("button").forEach(btn=>{
    const i = +btn.dataset.i;
    btn.classList.toggle("done", !!done[i]);
    btn.setAttribute("aria-pressed", done[i] ? "true" : "false");
  });
  updateRing();
}
todoList.addEventListener("click", (e)=>{
  const btn = e.target.closest("button[data-i]");
  if(!btn) return;
  const i = +btn.dataset.i;
  done[i] = !done[i];
  btn.classList.toggle("done", done[i]);
  btn.setAttribute("aria-pressed", done[i] ? "true" : "false");
  updateRing();
  saveChecklist();
});

/* ======== 4) Timeline con cursor ======== */
function buildTimeline(){
  timeline.querySelectorAll(".dot").forEach(n=>n.remove());
  PERSONAS.forEach((p, i)=>{
    const b = document.createElement("button");
    b.className = "dot";
    b.dataset.i = i;
    b.type = "button";
    b.textContent = p.emoji;
    timeline.appendChild(b);
  });

  timeline.addEventListener("click", (e)=>{
    const dot = e.target.closest(".dot");
    if(!dot) return;
    const i = +dot.dataset.i;
    const label = labelForIndex(i);
    moveCursorTo(i, label);
  });

  // Reposiciona el cursor si cambia el tamaño (zoom/rotación)
  window.addEventListener("resize", ()=>{
    const idx = idxPersonaParaFecha(new Date());
    moveCursorTo(idx, labelForIndex(idx));
  });
}
function labelForIndex(i){
  const now = new Date();
  let weekStart = mondayOf(now);
  for (let step=0; step<30; step++){
    const idx = idxPersonaParaFecha(weekStart);
    if (idx === i) {
      return fmtRange(weekStart, addDays(weekStart, 6)) + " · " + PERSONAS[i].nombre;
    }
    weekStart = addDays(weekStart, 7);
  }
  return PERSONAS[i].nombre;
}
function moveCursorTo(i, label){
  const dots = Array.from(timeline.querySelectorAll(".dot"));
  const target = dots[i];
  if (!target) return;
  const rect = target.getBoundingClientRect();
  const parent = timeline.getBoundingClientRect();
  const x = rect.left - parent.left;
  cursor.style.transform = `translateX(${x}px)`;
  tip.textContent = label;
}

/* ======== Próximas semanas ======== */
function renderProximas(){
  const ahora = new Date();
  const lunes = mondayOf(ahora);
  listaProximas.innerHTML = "";
  for (let i = 1; i <= 6; i++) {
    const l = addDays(lunes, i * 7);
    const s = addDays(l, 6);
    const idxI = idxPersonaParaFecha(l);
    const li = document.createElement("li");
    const who = document.createElement("span");
    const when = document.createElement("span");
    who.className = "who";
    when.className = "when";
    who.textContent = PERSONAS[idxI].nombre;
    when.textContent = fmtRange(l, s);
    li.appendChild(who);
    li.appendChild(when);
    listaProximas.appendChild(li);
  }
}

/* ======== Orden e inicio (footer) ======== */
document.getElementById("inicio").textContent = fmtDayDMY(BASE);
document.getElementById("ordenTxt").textContent = PERSONAS.map(p=>p.nombre).join(" → ");

/* ======== Inicialización ======== */
function init(){
  // Tema primero (evita "parpadeo" de colores). Soporta ?theme=... y píldoras.
  initTheme();
  bindThemePills();

  // Slot
  buildSlotItems();
  const idx = idxPersonaParaFecha(new Date());
  let auto = setTimeout(()=> spinToIndex(idx), 1500);
  btnRevelar.addEventListener("click", ()=>{
    clearTimeout(auto);
    spinToIndex(idx);
  });

  // Checklist
  initChecklist();

  // Timeline
  buildTimeline();
  moveCursorTo(idx, labelForIndex(idx));

  // Próximas
  renderProximas();
}
init();

