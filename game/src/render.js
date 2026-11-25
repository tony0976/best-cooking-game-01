// Sizzle Station — every pixel the player sees.
// All drawing is plain canvas 2D with hand-drawn shapes: no image files, no
// fonts from the network, so the game renders the same in any browser.

import { INGREDIENTS, RECIPES, VIEW_W, VIEW_H, COLORS, STATIONS, allStations } from './config.js';
import { starsFor, nearestStation } from './state.js';

const TAU = Math.PI * 2;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = '700') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// ---- food icons ------------------------------------------------------------
// Each ingredient draws itself at (x, y) inside a box of `size` pixels.
// The same icons appear on crates, plates, order tickets and above the chef.

export function drawFoodIcon(ctx, id, x, y, size) {
  const s = size;
  const cx = x + s / 2;
  const cy = y + s / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s / 48, s / 48);
  switch (id) {
    case 'bun': {
      ctx.fillStyle = '#e8a94f';
      rr(ctx, -18, -8, 36, 16, 8); ctx.fill();
      ctx.fillStyle = '#d18a2e';
      rr(ctx, -18, 2, 36, 6, 3); ctx.fill();
      ctx.fillStyle = '#fff2cf';
      for (const [sx, sy] of [[-10, -4], [0, -6], [10, -4], [-5, 0], [6, 0]]) {
        ctx.beginPath(); ctx.arc(sx, sy, 1.8, 0, TAU); ctx.fill();
      }
      break;
    }
    case 'patty': {
      ctx.fillStyle = '#8a4b2d';
      rr(ctx, -18, -7, 36, 14, 7); ctx.fill();
      ctx.fillStyle = '#a85f3a';
      for (const [sx, sy] of [[-9, -2], [2, 2], [10, -3]]) {
        ctx.beginPath(); ctx.arc(sx, sy, 2.4, 0, TAU); ctx.fill();
      }
      break;
    }
    case 'grilled': {
      ctx.fillStyle = '#6b3a22';
      rr(ctx, -18, -7, 36, 14, 7); ctx.fill();
      ctx.strokeStyle = '#3f2214';
      ctx.lineWidth = 2;
      for (const gx of [-9, 0, 9]) {
        ctx.beginPath(); ctx.moveTo(gx - 3, -6); ctx.lineTo(gx + 3, 6); ctx.stroke();
      }
      break;
    }
    case 'lettuce':
    case 'choppedLettuce': {
      ctx.fillStyle = id === 'lettuce' ? '#5da244' : '#79c25e';
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) {
        const a = (i / 8) * TAU;
        const r = i % 2 === 0 ? 18 : 11;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r * 0.6;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#3f7a2e';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(0, 6); ctx.stroke();
      break;
    }
    case 'tomato':
    case 'slicedTomato': {
      ctx.fillStyle = '#d84a3a';
      ctx.beginPath(); ctx.arc(0, 0, 15, 0, TAU); ctx.fill();
      ctx.fillStyle = '#e8604c';
      ctx.beginPath(); ctx.arc(-4, -4, 8, 0, TAU); ctx.fill();
      if (id === 'slicedTomato') {
        ctx.strokeStyle = '#f2a196';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.stroke();
      } else {
        ctx.fillStyle = '#5da244';
        ctx.beginPath(); ctx.ellipse(0, -14, 6, 3, 0, 0, TAU); ctx.fill();
      }
      break;
    }
    case 'cheese': {
      ctx.fillStyle = '#f2c230';
      ctx.beginPath();
      ctx.moveTo(-16, 10); ctx.lineTo(16, 10); ctx.lineTo(16, -8); ctx.lineTo(-16, 4);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d99a17';
      for (const [hx, hy] of [[-6, 4], [6, 2], [0, 7]]) {
        ctx.beginPath(); ctx.arc(hx, hy, 2, 0, TAU); ctx.fill();
      }
      break;
    }
    case 'potato': {
      ctx.fillStyle = '#d9b380';
      ctx.beginPath(); ctx.ellipse(0, 0, 15, 11, 0.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#b98d54';
      for (const [sx, sy] of [[-6, -2], [4, 3], [8, -4]]) {
        ctx.beginPath(); ctx.arc(sx, sy, 1.8, 0, TAU); ctx.fill();
      }
      break;
    }
    case 'fries': {
      ctx.fillStyle = '#d84a3a';
      ctx.beginPath();
      ctx.moveTo(-13, -2); ctx.lineTo(13, -2); ctx.lineTo(9, 14); ctx.lineTo(-9, 14);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f2c230';
      for (const fx of [-9, -3, 3, 9]) {
        ctx.fillRect(fx - 2.5, -14, 5, 14);
      }
      break;
    }
    case 'burnt': {
      ctx.fillStyle = '#2b2b2b';
      rr(ctx, -16, -8, 32, 16, 6); ctx.fill();
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-8, -4); ctx.lineTo(8, 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(8, -4); ctx.lineTo(-8, 4); ctx.stroke();
      break;
    }
    default: {
      ctx.fillStyle = '#999';
      ctx.beginPath(); ctx.arc(0, 0, 12, 0, TAU); ctx.fill();
    }
  }
  ctx.restore();
}

function drawPlateIcon(ctx, x, y, size, items) {
  // A white plate with the stacked ingredients on it.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(x, y, size * 0.62, size * 0.34, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#d8cdb8';
  ctx.lineWidth = 2;
  ctx.stroke();
  const n = items.length;
  items.forEach((id, i) => {
    const iy = y - 6 - i * 7;
    drawFoodIcon(ctx, id, x - size * 0.32, iy - size * 0.26, size * 0.64);
  });
  void n;
}

// ---- kitchen ---------------------------------------------------------------

function drawFloor(ctx) {
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, VIEW_W, 64);
  ctx.fillStyle = COLORS.floorA;
  ctx.fillRect(0, 64, VIEW_W, VIEW_H - 64);
  ctx.fillStyle = COLORS.floorB;
  const tile = 48;
  for (let y = 64; y < VIEW_H; y += tile) {
    for (let x = 0; x < VIEW_W; x += tile) {
      if (((x / tile) + (y / tile)) % 2 === 0) ctx.fillRect(x, y, tile, tile);
    }
  }
  // Wall trim.
  ctx.fillStyle = '#5d3a20';
  ctx.fillRect(0, 60, VIEW_W, 6);
  // A woven rug in the middle of the floor, and a potted herb by the wall.
  ctx.fillStyle = '#a34d2e';
  rr(ctx, 360, 480, 240, 110, 14); ctx.fill();
  ctx.strokeStyle = '#e8c98f';
  ctx.lineWidth = 3;
  rr(ctx, 372, 492, 216, 86, 10); ctx.stroke();
  ctx.strokeStyle = '#e8c98f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(372, 535); ctx.lineTo(588, 535);
  ctx.moveTo(480, 492); ctx.lineTo(480, 578);
  ctx.stroke();
  ctx.fillStyle = '#c96f3f';
  ctx.beginPath(); ctx.arc(480, 535, 10, 0, TAU); ctx.fill();
  // Potted plant.
  ctx.fillStyle = '#b3502e';
  ctx.beginPath();
  ctx.moveTo(690, 566); ctx.lineTo(730, 566); ctx.lineTo(724, 596); ctx.lineTo(696, 596);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#5da244';
  for (const [lx, ly, lr] of [[700, 552, 12], [712, 540, 14], [724, 554, 11]]) {
    ctx.beginPath(); ctx.ellipse(lx, ly, 7, lr, 0.3, 0, TAU); ctx.fill();
  }
}

function progressRing(ctx, x, y, r, frac, color) {
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + frac * TAU); ctx.stroke();
}

function drawStation(ctx, game, station) {
  const { x, y, w, h } = station;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const near = game._nearStation === station;
  ctx.save();
  if (near) {
    ctx.shadowColor = '#ffd76a';
    ctx.shadowBlur = 16;
  }
  ctx.fillStyle = COLORS.counter;
  rr(ctx, x, y, w, h, 10); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = COLORS.counterEdge;
  ctx.lineWidth = 2.5;
  rr(ctx, x, y, w, h, 10); ctx.stroke();

  if (station.kind === 'crate') {
    const ing = INGREDIENTS[station.ingredient];
    drawFoodIcon(ctx, station.ingredient, cx - 20, y + 4, 40);
    text(ctx, ing.name, cx, y + h - 10, 11, COLORS.ink);
  } else if (station.kind === 'board') {
    const st = game.stations.boards.find((b) => b.x === x && b.y === y);
    ctx.fillStyle = COLORS.board;
    rr(ctx, x + 8, y + 8, w - 16, h - 26, 6); ctx.fill();
    const slot = st.slot;
    if (slot.item) {
      drawFoodIcon(ctx, slot.item, cx - 17, y + 8, 34);
      if (!slot.done) {
        progressRing(ctx, cx + 26, y + 16, 9, slot.progress / 1.6, '#5da244');
        text(ctx, 'CHOP', cx, y + h - 9, 10, '#8a6a35');
      } else {
        text(ctx, '✓ READY', cx, y + h - 9, 11, '#2f7a1e');
      }
    } else {
      ctx.fillStyle = '#c9a86a';
      ctx.font = '700 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔪', cx, y + 26);
      text(ctx, 'CHOP', cx, y + h - 9, 10, '#8a6a35');
    }
  } else if (station.kind === 'grill') {
    const st = game.stations.grills.find((g) => g.x === x && g.y === y);
    ctx.fillStyle = COLORS.grill;
    rr(ctx, x + 8, y + 8, w - 16, h - 26, 6); ctx.fill();
    ctx.strokeStyle = '#33333a';
    ctx.lineWidth = 2;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(x + 8 + (i * (w - 16)) / 4, y + 10); ctx.lineTo(x + 8 + (i * (w - 16)) / 4, y + h - 18); ctx.stroke();
    }
    const slot = st.slot;
    if (slot.item) {
      drawFoodIcon(ctx, slot.item, cx - 17, y + 8, 34);
      if (!slot.done) {
        progressRing(ctx, cx + 26, y + 16, 9, slot.progress / 3.0, '#e2703a');
        text(ctx, 'GRILL', cx, y + h - 9, 10, '#3a3a42');
      } else if (slot.item === 'burnt') {
        text(ctx, 'BURNT!', cx, y + h - 9, 11, '#d84a3a');
      } else {
        text(ctx, '✓ READY', cx, y + h - 9, 11, '#a86f00');
        if (slot.burnLeft > 0 && slot.burnLeft < 2.5) text(ctx, `${slot.burnLeft.toFixed(0)}s`, cx + 30, y + 34, 11, '#ff6a55');
      }
    } else {
      text(ctx, 'GRILL', cx, y + h - 9, 10, '#3a3a42');
    }
  } else if (station.kind === 'fryer') {
    const st = game.stations.fryer;
    ctx.fillStyle = COLORS.steel;
    rr(ctx, x + 8, y + 8, w - 16, h - 26, 6); ctx.fill();
    ctx.fillStyle = '#e8a94f';
    rr(ctx, x + 14, y + 12, w - 28, h - 34, 4); ctx.fill();
    const slot = st.slot;
    if (slot.item) {
      drawFoodIcon(ctx, slot.item, cx - 17, y + 8, 34);
      if (!slot.done) {
        progressRing(ctx, cx + 26, y + 16, 9, slot.progress / 3.5, '#e2703a');
        text(ctx, 'FRYER', cx, y + h - 9, 10, '#7a5a20');
      } else {
        text(ctx, '✓ READY', cx, y + h - 9, 11, '#2f7a1e');
      }
    } else {
      text(ctx, 'FRYER', cx, y + h - 9, 10, '#7a5a20');
    }
  } else if (station.kind === 'plate') {
    const st = game.stations.plates.find((p) => p.x === x && p.y === y);
    ctx.fillStyle = '#efe3c8';
    rr(ctx, x + 8, y + 8, w - 16, h - 26, 6); ctx.fill();
    text(ctx, 'ASSEMBLY', cx, y + h - 9, 10, '#8a6a35');
    if (st.items.length > 0) {
      drawPlateIcon(ctx, cx, y + 34, 56, st.items);
    } else {
      ctx.strokeStyle = '#b7a67f';
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.ellipse(cx, y + 34, 34, 16, 0, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
    }
  } else if (station.kind === 'serve') {
    ctx.fillStyle = COLORS.serve;
    rr(ctx, x + 6, y + 6, w - 12, h - 34, 8); ctx.fill();
    ctx.fillStyle = '#b34a1d';
    ctx.fillRect(x + 6, y + h - 34, w - 12, 4);
    text(ctx, 'SERVE  ▲', cx, y + 20, 15, '#fff6e3');
    text(ctx, 'WINDOW', cx, y + 40, 12, '#ffe1c2');
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath(); ctx.arc(cx, y + 66, 9, 0, TAU); ctx.fill();
    ctx.fillStyle = '#b34a1d';
    ctx.fillRect(cx - 1.5, y + 66, 3, 12);
    text(ctx, 'Ring the bell!', cx, y + h - 12, 10, '#7a2d0e');
  } else if (station.kind === 'trash') {
    ctx.fillStyle = COLORS.trash;
    rr(ctx, x + 8, y + 8, w - 16, h - 26, 6); ctx.fill();
    ctx.fillStyle = '#39424a';
    ctx.beginPath();
    ctx.moveTo(x + 26, y + 16); ctx.lineTo(x + w - 26, y + 16);
    ctx.lineTo(x + w - 30, y + h - 20); ctx.lineTo(x + 30, y + h - 20);
    ctx.closePath(); ctx.fill();
    text(ctx, 'TRASH', cx, y + h - 9, 10, '#39424a');
  }
  ctx.restore();
}

// ---- orders and HUD ---------------------------------------------------------

function drawOrders(ctx, game) {
  const y = 72;
  text(ctx, 'ORDERS', 24, y + 8, 12, '#fff6e3', 'left');
  game.orders.forEach((order, i) => {
    const x = 100 + i * 178;
    const w = 168;
    const h = 56;
    const frac = Math.max(0, order.patience / order.maxPatience);
    const urgent = frac < 0.35;
    ctx.fillStyle = urgent ? '#fff0e8' : '#fff6e3';
    rr(ctx, x, y, w, h, 8); ctx.fill();
    ctx.strokeStyle = urgent ? '#d84a3a' : '#b98d54';
    ctx.lineWidth = urgent ? 3 : 2;
    rr(ctx, x, y, w, h, 8); ctx.stroke();
    text(ctx, order.recipe.name, x + 10, y + 13, 12, COLORS.ink, 'left');
    text(ctx, `${order.recipe.reward}c`, x + w - 10, y + 13, 12, '#a86f00', 'right');
    order.recipe.needs.forEach((id, j) => {
      drawFoodIcon(ctx, id, x + 10 + j * 26, y + 24, 24);
    });
    // Patience bar.
    ctx.fillStyle = '#e3d5b8';
    rr(ctx, x + 10, y + h - 12, w - 20, 6, 3); ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#5da244' : frac > 0.25 ? '#f2c230' : '#d84a3a';
    rr(ctx, x + 10, y + h - 12, (w - 20) * frac, 6, 3); ctx.fill();
  });
  if (game.orders.length === 0) {
    text(ctx, 'No orders yet — get ready!', 100, y + 30, 13, '#ffe1c2', 'left');
  }
}

function drawHUD(ctx, game) {
  text(ctx, '🍳 SIZZLE STATION', 24, 32, 22, '#fff6e3', 'left');
  // Shift timer.
  const tw = 220;
  const tx = VIEW_W - tw - 24;
  const frac = game.timeLeft / 150;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  rr(ctx, tx, 18, tw, 26, 13); ctx.fill();
  ctx.fillStyle = frac > 0.25 ? '#5da244' : '#d84a3a';
  rr(ctx, tx + 3, 21, (tw - 6) * frac, 20, 10); ctx.fill();
  text(ctx, `⏱ ${Math.ceil(game.timeLeft)}s`, tx + tw / 2, 31, 14, '#ffffff');
  // Coins and served.
  text(ctx, `🪙 ${game.coins}`, tx - 16, 31, 16, '#ffd76a', 'right');
  text(ctx, `Served ${game.served} · Missed ${game.missed}`, 300, 32, 14, '#ffe1c2', 'left');
  if (game.combo >= 2) {
    text(ctx, `COMBO x${game.combo}`, 560, 32, 15, '#ff9a8a');
  }
  // Controls hint.
  text(ctx, 'Move: WASD / arrows / click   ·   Use: E / Space / click station   ·   M: mute', VIEW_W / 2, VIEW_H - 12, 11, '#e8d9b8');
}

// ---- player -----------------------------------------------------------------

function drawPlayer(ctx, game) {
  const p = game.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, 14, 16, 6, 0, 0, TAU); ctx.fill();
  // Body (apron).
  ctx.fillStyle = '#ffffff';
  rr(ctx, -13, -6, 26, 24, 9); ctx.fill();
  ctx.fillStyle = '#4a90d9';
  ctx.fillRect(-13, 4, 26, 12);
  // Head.
  ctx.fillStyle = '#f2c49b';
  ctx.beginPath(); ctx.arc(0, -14, 11, 0, TAU); ctx.fill();
  // Toque.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-6, -24, 7, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(6, -24, 7, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -27, 8, 0, TAU); ctx.fill();
  ctx.fillRect(-11, -26, 22, 6);
  // Eyes look toward movement.
  const ex = Math.cos(p.dir) * 3;
  const ey = Math.sin(p.dir) * 2;
  ctx.fillStyle = '#3a2415';
  ctx.beginPath(); ctx.arc(-4 + ex, -14 + ey, 1.8, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(4 + ex, -14 + ey, 1.8, 0, TAU); ctx.fill();
  ctx.restore();

  // Held item floats above the chef.
  if (p.held) {
    if (typeof p.held === 'string') {
      drawFoodIcon(ctx, p.held, p.x - 20, p.y - 62, 40);
    } else if (p.held.plate) {
      drawPlateIcon(ctx, p.x, p.y - 46, 52, p.held.plate);
    }
  }
  // Click target marker.
  if (p.moveTarget) {
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.moveTarget.x, p.moveTarget.y, 7, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(p.moveTarget.x, p.moveTarget.y, 2, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
  }
}

// ---- overlays ---------------------------------------------------------------

function drawTitle(ctx, game) {
  ctx.fillStyle = 'rgba(40,20,8,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, '🍳', VIEW_W / 2, 150, 72, '#fff');
  text(ctx, 'SIZZLE STATION', VIEW_W / 2, 230, 52, '#ffd76a');
  text(ctx, 'A tiny kitchen, a full rush hour.', VIEW_W / 2, 272, 18, '#fff6e3');
  text(ctx, 'Take orders, chop, grill, fry, plate — and serve before', VIEW_W / 2, 330, 16, '#ffe1c2');
  text(ctx, 'the customers walk out. One shift: 150 seconds.', VIEW_W / 2, 354, 16, '#ffe1c2');
  const pulse = 0.6 + 0.4 * Math.sin(game.time * 4);
  ctx.globalAlpha = pulse;
  text(ctx, 'Press any key or click to start', VIEW_W / 2, 420, 20, '#ffffff');
  ctx.globalAlpha = 1;
  text(ctx, 'WASD / arrows / click to move  ·  E / Space / click to use a station', VIEW_W / 2, 470, 14, '#e8d9b8');
  text(ctx, 'Bun + grilled patty + chopped lettuce = Classic Burger', VIEW_W / 2, 500, 14, '#e8d9b8');
}

function drawGameOver(ctx, game) {
  ctx.fillStyle = 'rgba(40,20,8,0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'SHIFT OVER!', VIEW_W / 2, 150, 44, '#ffd76a');
  const stars = starsFor(game);
  let starLine = '';
  for (let i = 0; i < 3; i++) starLine += i < stars ? '★' : '☆';
  text(ctx, starLine, VIEW_W / 2, 210, 48, '#ffd76a');
  text(ctx, `Coins earned: ${game.coins}`, VIEW_W / 2, 280, 22, '#fff6e3');
  text(ctx, `Dishes served: ${game.served}    Orders missed: ${game.missed}`, VIEW_W / 2, 320, 18, '#ffe1c2');
  const verdict = stars === 3 ? 'Head Chef material!' : stars === 2 ? 'A solid shift — the regulars are happy.' : stars === 1 ? 'The kitchen survived. Barely.' : 'Rough shift. The tickets piled up…';
  text(ctx, verdict, VIEW_W / 2, 360, 17, '#ffffff');
  text(ctx, 'Press R to run it back', VIEW_W / 2, 430, 16, '#e8d9b8');
}

// ---- main entry -------------------------------------------------------------

export function render(ctx, game) {
  // Which station the chef could use right now (for the glow).
  game._nearStation = game.mode === 'playing' ? nearestStation(game) : null;

  drawFloor(ctx);
  for (const s of allStations()) drawStation(ctx, game, s);
  drawOrders(ctx, game);
  drawHUD(ctx, game);
  drawPlayer(ctx, game);

  // Particles.
  for (const pt of game.particles) {
    ctx.globalAlpha = Math.max(0, pt.life * 2);
    ctx.fillStyle = pt.color;
    ctx.beginPath(); ctx.arc(pt.x, pt.y, 3.5, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of game.floaters) {
    ctx.globalAlpha = Math.min(1, f.life);
    text(ctx, f.text, f.x, f.y, 17, f.color);
  }
  ctx.globalAlpha = 1;

  // Banner message.
  if (game.flash) {
    text(ctx, game.flash.text, VIEW_W / 2, 160, 18, game.flash.color);
  }

  if (game.mode === 'title') drawTitle(ctx, game);
  if (game.mode === 'over') drawGameOver(ctx, game);
}

// The recipe list, for the dossier outline and the README.
export function recipeList() {
  return RECIPES.map((r) => `${r.name}: ${r.needs.map((id) => INGREDIENTS[id].name).join(' + ')} = ${r.reward} coins`);
}
