// Draws the multi-panel poster cover: the photos in their panels, a sunset or neon grade,
// a bold Anton title with an Oswald subtitle, and a thin poster frame. All drawing is plain
// canvas 2D, so the same code paints the live preview and the exported PNG.

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080 },
  '1080x1350': { w: 1080, h: 1350 },
  '1920x1080': { w: 1920, h: 1080 },
};

export const GRADES = ['sunset', 'neon', 'original'];

/** Pixel rects of the panels for a layout, in canvas coordinates. */
export function panelRects(layout, w, h) {
  const g = Math.max(6, Math.round(Math.max(w, h) / 135));
  const frame = Math.max(4, Math.round(Math.max(w, h) / 216));
  const x0 = frame, y0 = frame, x1 = w - frame, y1 = h - frame;
  const full = [{ x: x0, y: y0, w: x1 - x0, h: y1 - y0 }];
  if (layout <= 1) return full;
  if (layout === 2) {
    const mid = x0 + (x1 - x0) / 2;
    return [
      { x: x0, y: y0, w: mid - g / 2 - x0, h: y1 - y0 },
      { x: mid + g / 2, y: y0, w: x1 - (mid + g / 2), h: y1 - y0 },
    ];
  }
  if (layout === 3) {
    const split = y0 + (y1 - y0) * 0.56;
    const mid = x0 + (x1 - x0) / 2;
    return [
      { x: x0, y: y0, w: x1 - x0, h: split - g / 2 - y0 },
      { x: x0, y: split + g / 2, w: mid - g / 2 - x0, h: y1 - (split + g / 2) },
      { x: mid + g / 2, y: split + g / 2, w: x1 - (mid + g / 2), h: y1 - (split + g / 2) },
    ];
  }
  const midX = x0 + (x1 - x0) / 2;
  const midY = y0 + (y1 - y0) / 2;
  return [
    { x: x0, y: y0, w: midX - g / 2 - x0, h: midY - g / 2 - y0 },
    { x: midX + g / 2, y: y0, w: x1 - (midX + g / 2), h: midY - g / 2 - y0 },
    { x: x0, y: midY + g / 2, w: midX - g / 2 - x0, h: y1 - (midY + g / 2) },
    { x: midX + g / 2, y: midY + g / 2, w: x1 - (midX + g / 2), h: y1 - (midY + g / 2) },
  ];
}

/** Index of the panel holding point (x, y) in canvas pixels, or -1. */
export function panelAt(layout, w, h, x, y) {
  const rects = panelRects(layout, w, h);
  for (let i = 0; i < rects.length; i += 1) {
    const r = rects[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}

/** Cover-fits an image into a panel rect, honouring zoom and the pan offsets. */
function paintPanel(ctx, rect, panel) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (!panel || !panel.img) {
    const shade = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    shade.addColorStop(0, '#3a1c5c');
    shade.addColorStop(1, '#160a26');
    ctx.fillStyle = shade;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(244, 238, 251, 0.75)';
    ctx.font = `600 ${Math.round(rect.h * 0.07)}px Oswald, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('+  ADD PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.restore();
    return;
  }
  const img = panel.img;
  const zoom = panel.zoom || 1;
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const ox = (panel.ox || 0) * rect.w;
  const oy = (panel.oy || 0) * rect.h;
  ctx.drawImage(img, rect.x + (rect.w - pw) / 2 + ox, rect.y + (rect.h - ph) / 2 + oy, pw, ph);
  ctx.restore();
}

/** The warm or neon wash that grades the whole cover. */
function paintGrade(ctx, w, h, grade) {
  if (grade === 'sunset') {
    const glow = ctx.createRadialGradient(w * 0.5, h * 0.66, 0, w * 0.5, h * 0.66, w * 0.75);
    glow.addColorStop(0, 'rgba(255, 122, 61, 0.30)');
    glow.addColorStop(1, 'rgba(255, 122, 61, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    const wash = ctx.createLinearGradient(0, 0, 0, h);
    wash.addColorStop(0, 'rgba(255, 176, 46, 0.10)');
    wash.addColorStop(0.55, 'rgba(255, 122, 61, 0.06)');
    wash.addColorStop(1, 'rgba(190, 24, 110, 0.34)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
  } else if (grade === 'neon') {
    const wash = ctx.createLinearGradient(0, 0, w, h);
    wash.addColorStop(0, 'rgba(255, 46, 126, 0.26)');
    wash.addColorStop(0.5, 'rgba(120, 40, 200, 0.10)');
    wash.addColorStop(1, 'rgba(57, 213, 255, 0.26)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(w * 0.5, h * 0.6, 0, w * 0.5, h * 0.6, w * 0.7);
    glow.addColorStop(0, 'rgba(255, 46, 126, 0.22)');
    glow.addColorStop(1, 'rgba(255, 46, 126, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  }
}

/** The small credit line across the top of the poster. */
function paintCredit(ctx, w, h) {
  const scrim = ctx.createLinearGradient(0, 0, 0, h * 0.09);
  scrim.addColorStop(0, 'rgba(10, 4, 18, 0.6)');
  scrim.addColorStop(1, 'rgba(10, 4, 18, 0)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, w, h * 0.09);
  ctx.fillStyle = 'rgba(244, 238, 251, 0.85)';
  ctx.font = `500 ${Math.round(h * 0.018)}px Oswald, sans-serif`;
  ctx.textAlign = 'left';
  try { ctx.letterSpacing = `${Math.round(h * 0.004)}px`; } catch { /* older canvas: no tracking */ }
  ctx.fillText('A  N E O N  S U N S E T  O R I G I N A L', w * 0.04, h * 0.045);
  try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
}

/** The caption band: scrim, big tilted title, subtitle underneath. */
function paintCaption(ctx, w, h, state) {
  const band = ctx.createLinearGradient(0, h * 0.62, 0, h);
  band.addColorStop(0, 'rgba(10, 4, 18, 0)');
  band.addColorStop(1, 'rgba(10, 4, 18, 0.88)');
  ctx.fillStyle = band;
  ctx.fillRect(0, h * 0.62, w, h * 0.38);

  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();
  const accent = state.grade === 'neon' ? '#39d5ff' : '#ffd166';
  const cx = w / 2;
  const baseY = h - h * 0.075;

  if (title) {
    let size = h * 0.115 * (state.titleScale || 1);
    ctx.font = `${Math.round(size)}px Anton, sans-serif`;
    while (ctx.measureText(title).width > w * 0.92 && size > 14) {
      size -= 2;
      ctx.font = `${Math.round(size)}px Anton, sans-serif`;
    }
    ctx.save();
    ctx.translate(cx, baseY);
    ctx.rotate(-0.026);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(12, 4, 20, 0.9)';
    ctx.lineWidth = Math.max(3, size * 0.14);
    ctx.strokeText(title, 0, 0);
    ctx.fillStyle = state.titleColor || '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = Math.round(size * 0.16);
    ctx.shadowOffsetY = Math.round(size * 0.04);
    ctx.fillText(title, 0, 0);
    ctx.restore();
  }
  if (subtitle) {
    const subSize = Math.max(16, Math.round(h * 0.032));
    ctx.font = `600 ${subSize}px Oswald, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = accent;
    try { ctx.letterSpacing = `${Math.round(subSize * 0.18)}px`; } catch { /* ignore */ }
    ctx.fillText(subtitle.toUpperCase(), cx, baseY + subSize * 1.5);
    try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
  }
}

/** Paints the whole cover onto `canvas` at its own size, from `state`. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#14081f';
  ctx.fillRect(0, 0, w, h);
  const rects = panelRects(state.layout, w, h);
  for (let i = 0; i < rects.length; i += 1) {
    paintPanel(ctx, rects[i], state.panels[i]);
  }
  paintGrade(ctx, w, h, state.grade);
  paintCredit(ctx, w, h);
  paintCaption(ctx, w, h, state);
  const frame = Math.max(4, Math.round(Math.max(w, h) / 216));
  ctx.strokeStyle = 'rgba(244, 238, 251, 0.9)';
  ctx.lineWidth = frame;
  ctx.strokeRect(frame / 2, frame / 2, w - frame, h - frame);
}

/** Renders the cover at its export size on a fresh canvas and returns it. */
export function renderCover(state) {
  const canvas = document.createElement('canvas');
  canvas.width = state.size.w;
  canvas.height = state.size.h;
  drawCover(canvas, state);
  return canvas;
}
