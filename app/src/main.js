// Wires the editor: photos, layouts, caption, size, grade and export. The cover itself is
// painted by ./cover.js; this file only owns the page state and the controls around it.
import { drawCover, renderCover, panelAt, SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const zoomInput = document.getElementById('zoom');
const zoomVal = document.getElementById('zoomVal');
const selectedPanelLabel = document.getElementById('selectedPanel');
const sizeLabel = document.getElementById('sizeLabel');

const state = {
  size: SIZES['1080x1080'],
  sizeName: '1080x1080',
  layout: 4,
  grade: 'sunset',
  title: 'Sunset Heist',
  subtitle: 'One last score',
  titleScale: 1,
  titleColor: '#ffffff',
  panels: [
    { img: null, zoom: 1, ox: 0, oy: 0 },
    { img: null, zoom: 1, ox: 0, oy: 0 },
    { img: null, zoom: 1, ox: 0, oy: 0 },
    { img: null, zoom: 1, ox: 0, oy: 0 },
  ],
};
let selected = 0;

function redraw() {
  canvas.width = state.size.w;
  canvas.height = state.size.h;
  drawCover(canvas, state);
  sizeLabel.textContent = `${state.size.w} × ${state.size.h}`;
  const hint = document.querySelector('.drop-hint');
  if (hint) hint.style.display = state.panels.some((p) => p.img) ? 'none' : '';
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

function loadFile(file) {
  return loadImage(URL.createObjectURL(file));
}

function markActive(selector, value) {
  document.querySelectorAll(selector).forEach((el) => {
    const match = el.dataset.layout ?? el.dataset.size ?? el.dataset.grade ?? el.dataset.color;
    el.classList.toggle('active', match === String(value));
    el.setAttribute('aria-pressed', match === String(value) ? 'true' : 'false');
  });
}

function selectPanel(index) {
  selected = index;
  selectedPanelLabel.textContent = String(index + 1);
  const panel = state.panels[index];
  zoomInput.value = String(panel.zoom);
  zoomVal.textContent = `${panel.zoom.toFixed(2)}×`;
}

function setLayout(layout) {
  state.layout = layout;
  if (selected >= layout) selectPanel(0);
  markActive('.layout-btn', layout);
  redraw();
}

function setSize(name) {
  state.size = SIZES[name];
  state.sizeName = name;
  markActive('.size-btn', name);
  redraw();
}

function setGrade(grade) {
  state.grade = grade;
  markActive('.grade-btn', grade);
  redraw();
}

function setTitleColor(color) {
  state.titleColor = color;
  markActive('.color-btn', color);
  redraw();
}

async function fillAllWith(img) {
  for (const panel of state.panels) {
    panel.img = img;
    panel.zoom = 1;
    panel.ox = 0;
    panel.oy = 0;
  }
  redraw();
}

async function loadSample(name) {
  const img = await loadImage(`samples/${name}.jpg`);
  return img;
}

// Photo controls.
document.getElementById('photoFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    state.panels[selected].img = await loadFile(file);
    state.panels[selected].zoom = 1;
    state.panels[selected].ox = 0;
    state.panels[selected].oy = 0;
    redraw();
    status.textContent = 'Photo loaded into panel ' + (selected + 1) + '.';
  } catch {
    status.textContent = 'That file could not be read as an image.';
  }
  e.target.value = '';
});
document.getElementById('panelFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    state.panels[selected].img = await loadFile(file);
    state.panels[selected].zoom = 1;
    state.panels[selected].ox = 0;
    state.panels[selected].oy = 0;
    redraw();
  } catch {
    status.textContent = 'That file could not be read as an image.';
  }
  e.target.value = '';
});
document.getElementById('sampleBoulevard').addEventListener('click', async () => {
  state.panels[selected].img = await loadSample('boulevard');
  state.panels[selected].zoom = 1;
  state.panels[selected].ox = 0;
  state.panels[selected].oy = 0;
  redraw();
});
document.getElementById('samplePier').addEventListener('click', async () => {
  state.panels[selected].img = await loadSample('pier');
  state.panels[selected].zoom = 1;
  state.panels[selected].ox = 0;
  state.panels[selected].oy = 0;
  redraw();
});
document.getElementById('fillAll').addEventListener('click', async () => {
  const img = state.panels[selected].img ?? (await loadSample('pier'));
  await fillAllWith(img);
  status.textContent = 'Every panel now shows the same photo.';
});

// Drag and drop onto the preview.
const dropZone = document.getElementById('dropZone');
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragging');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));
dropZone.addEventListener('drop', async (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragging');
  const file = e.dataTransfer.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  try {
    state.panels[selected].img = await loadFile(file);
    state.panels[selected].zoom = 1;
    state.panels[selected].ox = 0;
    state.panels[selected].oy = 0;
    redraw();
  } catch {
    status.textContent = 'That file could not be read as an image.';
  }
});

// Click a panel to select it; drag inside it to pan its photo.
let drag = null;
function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height),
  };
}
canvas.addEventListener('pointerdown', (e) => {
  const point = canvasPoint(e);
  const hit = panelAt(state.layout, canvas.width, canvas.height, point.x, point.y);
  if (hit < 0) return;
  selectPanel(hit);
  canvas.setPointerCapture(e.pointerId);
  drag = { x: point.x, y: point.y, moved: false };
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const point = canvasPoint(e);
  const dx = point.x - drag.x;
  const dy = point.y - drag.y;
  if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
  const panel = state.panels[selected];
  panel.ox = Math.max(-0.5, Math.min(0.5, panel.ox + dx / canvas.width));
  panel.oy = Math.max(-0.5, Math.min(0.5, panel.oy + dy / canvas.height));
  drag.x = point.x;
  drag.y = point.y;
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('pointercancel', () => { drag = null; });

// Layout, caption, size and grade controls.
document.querySelectorAll('.layout-btn').forEach((btn) => {
  btn.addEventListener('click', () => setLayout(Number(btn.dataset.layout)));
});
document.querySelectorAll('.size-btn').forEach((btn) => {
  btn.addEventListener('click', () => setSize(btn.dataset.size));
});
document.querySelectorAll('.grade-btn').forEach((btn) => {
  btn.addEventListener('click', () => setGrade(btn.dataset.grade));
});
document.querySelectorAll('.color-btn').forEach((btn) => {
  btn.addEventListener('click', () => setTitleColor(btn.dataset.color));
});
zoomInput.addEventListener('input', () => {
  const panel = state.panels[selected];
  panel.zoom = Number(zoomInput.value);
  zoomVal.textContent = `${panel.zoom.toFixed(2)}×`;
  redraw();
});
document.getElementById('title').addEventListener('input', (e) => {
  state.title = e.target.value;
  redraw();
});
document.getElementById('subtitle').addEventListener('input', (e) => {
  state.subtitle = e.target.value;
  redraw();
});
document.getElementById('titleSize').addEventListener('input', (e) => {
  state.titleScale = Number(e.target.value);
  document.getElementById('titleSizeVal').textContent = `${Math.round(state.titleScale * 100)}%`;
  redraw();
});

// Export: render at the exact chosen size and download the PNG.
function exportPNG() {
  return new Promise((resolve) => {
    renderCover(state).toBlob((blob) => resolve(blob), 'image/png');
  });
}
document.getElementById('export').addEventListener('click', async () => {
  const blob = await exportPNG();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `cover-${state.sizeName}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  status.textContent = `Saved cover-${state.sizeName}.png (${state.size.w} × ${state.size.h}, ${(blob.size / 1024).toFixed(0)} KiB).`;
});

// The handle the screenshot scenes and the browser tests drive.
window.__coverApp = {
  state,
  canvas,
  setLayout,
  setSize,
  setGrade,
  setTitleColor,
  selectPanel,
  fillAllWith,
  loadSample,
  redraw,
  exportPNG,
  loadImage,
};

// First paint: load the bundled fonts, then the samples, then draw.
async function boot() {
  try {
    await Promise.all([
      document.fonts.load('80px Anton'),
      document.fonts.load('600 28px Oswald'),
    ]);
  } catch {
    // The fallback fonts still draw; the cover just loses its poster type.
  }
  const shot = new URLSearchParams(location.search).get('shot');
  if (shot) {
    await runShot(shot, new URLSearchParams(location.search), window.__coverApp);
  } else {
    const pier = await loadSample('pier');
    const boulevard = await loadSample('boulevard');
    state.panels[0].img = pier;
    state.panels[1].img = boulevard;
    state.panels[2].img = boulevard;
    state.panels[3].img = pier;
  }
  markActive('.layout-btn', state.layout);
  markActive('.size-btn', state.sizeName);
  markActive('.grade-btn', state.grade);
  markActive('.color-btn', state.titleColor);
  selectPanel(0);
  redraw();
  document.fonts.ready.then(() => redraw());
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

boot();
