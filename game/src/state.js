// Sizzle Station — the game world: player, stations, orders, plates.
// This file owns every rule. Rendering only reads this state, it never mutates it.

import { INGREDIENTS, RECIPES, ORDER, STATIONS, PLAYER_START, SHIFT_SECONDS, allStations } from './config.js';
import * as sfx from './audio.js';

// Deterministic RNG (mulberry32) so a screenshot staging seed replays the same
// kitchen every time.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PLAYER_SPEED = 235; // pixels per second
const PLAYER_RADIUS = 17;
// How close (edge to edge) the chef must stand to use a station. Stations sit
// in rows only ~30 px apart, so the distance is measured to each station's
// rectangle, not its centre: the chef uses the counter they stand against.
const REACH = 64;

// Distance from a point to a station's rectangle (0 inside it).
export function edgeDistance(px, py, s) {
  const dx = Math.max(s.x - px, 0, px - (s.x + s.w));
  const dy = Math.max(s.y - py, 0, py - (s.y + s.h));
  return Math.hypot(dx, dy);
}

// The station the chef can use right now: the nearest by edge distance.
export function nearestStation(game) {
  let best = null;
  let bestD = Infinity;
  for (const s of allStations()) {
    const d = edgeDistance(game.player.x, game.player.y, s);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return bestD <= REACH ? best : null;
}

// A station that is processing something (board / grill / fryer).
function emptySlot() {
  return { item: null, progress: 0, done: false, burnLeft: 0 };
}

export function createGame(seed = 1) {
  const rng = mulberry32(seed);
  const game = {
    rng,
    mode: 'title', // title | playing | over
    time: 0, // seconds into the shift
    timeLeft: SHIFT_SECONDS,
    coins: 0,
    served: 0,
    missed: 0,
    combo: 0,
    nextOrderId: 1,
    spawnIn: ORDER.firstAtSeconds,
    lastTickSecond: -1,
    player: {
      x: PLAYER_START.x, y: PLAYER_START.y,
      dir: 0, // facing angle, for the chef's drawing
      moving: false,
      held: null, // ingredient id, or { plate: [ingredient ids] }
      moveTarget: null, // { x, y } from a mouse click
      pendingStation: null, // station to use once the chef arrives
    },
    orders: [],
    particles: [],
    floaters: [], // floating "+12" texts
    stations: {
      boards: STATIONS.boards.map((s) => ({ ...s, slot: emptySlot() })),
      grills: STATIONS.grills.map((s) => ({ ...s, slot: emptySlot() })),
      fryer: { ...STATIONS.fryer, slot: emptySlot() },
      plates: STATIONS.plates.map((s) => ({ ...s, items: [] })),
      crates: STATIONS.crates,
      serve: STATIONS.serve,
      trash: STATIONS.trash,
    },
    flash: null, // { text, color, until } banner message
    muted: false,
  };
  return game;
}

// ---- helpers ---------------------------------------------------------------

function stationCenter(s) {
  return { x: s.x + s.w / 2, y: s.y + s.h / 2 };
}

function distToStation(game, station) {
  return edgeDistance(game.player.x, game.player.y, station);
}

function stateOf(game, station) {
  if (station.kind === 'board') return game.stations.boards.find((b) => b.x === station.x && b.y === station.y);
  if (station.kind === 'grill') return game.stations.grills.find((g) => g.x === station.x && g.y === station.y);
  if (station.kind === 'fryer') return game.stations.fryer;
  if (station.kind === 'plate') return game.stations.plates.find((p) => p.x === station.x && p.y === station.y);
  return station;
}

function banner(game, text, color = '#fff6e3') {
  game.flash = { text, color, until: game.time + 1.6 };
}

export function addFloater(game, x, y, text, color = '#f2c230') {
  game.floaters.push({ x, y, text, color, life: 1.1 });
}

function burst(game, x, y, color, n = 10) {
  for (let i = 0; i < n; i++) {
    const a = game.rng() * Math.PI * 2;
    const sp = 40 + game.rng() * 90;
    game.particles.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30,
      life: 0.5 + game.rng() * 0.4, color,
    });
  }
}

// ---- orders ----------------------------------------------------------------

function unlockedRecipes(game) {
  return RECIPES.filter((r) => game.time >= r.unlockAfter);
}

function spawnOrder(game) {
  const pool = unlockedRecipes(game);
  const recipe = pool[Math.floor(game.rng() * pool.length)];
  const t = game.time / SHIFT_SECONDS;
  const patience = ORDER.patienceStart + (ORDER.patienceEnd - ORDER.patienceStart) * t;
  game.orders.push({
    id: game.nextOrderId++,
    recipe,
    patience,
    maxPatience: patience,
  });
}

function plateMatches(recipe, items) {
  if (items.length !== recipe.needs.length) return false;
  const want = [...recipe.needs].sort();
  const got = [...items].sort();
  return want.every((w, i) => w === got[i]);
}

// ---- interaction -----------------------------------------------------------

// What happens when the chef uses a station. Returns nothing; plays sounds and
// banners as a side effect.
export function useStation(game, station) {
  const p = game.player;
  const st = stateOf(game, station);

  if (station.kind === 'crate') {
    if (p.held) { sfx.sfxError(); banner(game, 'Hands full!', '#ff9a8a'); return; }
    p.held = station.ingredient;
    sfx.sfxPickup();
    return;
  }

  if (station.kind === 'board' || station.kind === 'grill' || station.kind === 'fryer') {
    const slot = st.slot;
    const ing = p.held && typeof p.held === 'string' ? INGREDIENTS[p.held] : null;
    if (slot.item) {
      // Something is on the station: take it if it is done and hands are empty.
      if (!slot.done) { sfx.sfxError(); banner(game, 'Still cooking…', '#ff9a8a'); return; }
      if (p.held) { sfx.sfxError(); banner(game, 'Hands full!', '#ff9a8a'); return; }
      p.held = slot.item;
      st.slot = emptySlot();
      sfx.sfxPickup();
      return;
    }
    // Station empty: place a matching raw ingredient.
    if (!ing) { sfx.sfxError(); banner(game, 'Nothing to cook here', '#ff9a8a'); return; }
    const need = station.kind === 'board' ? 'board' : station.kind === 'grill' ? 'grill' : 'fryer';
    if (ing.prep !== need) {
      sfx.sfxError();
      banner(game, `${ing.name} doesn't go here`, '#ff9a8a');
      return;
    }
    slot.item = ing.result;
    slot.progress = 0;
    slot.done = false;
    slot.burnLeft = ing.burnSeconds || 0;
    p.held = null;
    if (need === 'board') sfx.sfxChop();
    else sfx.sfxSizzle();
    return;
  }

  if (station.kind === 'plate') {
    if (p.held && typeof p.held === 'object' && p.held.plate) {
      // Carrying a plate already: cannot stack plates.
      sfx.sfxError();
      banner(game, 'Already carrying a plate', '#ff9a8a');
      return;
    }
    if (p.held && typeof p.held === 'string') {
      if (st.items.length >= 5) { sfx.sfxError(); banner(game, 'Plate is full', '#ff9a8a'); return; }
      st.items.push(p.held);
      p.held = null;
      sfx.sfxPlace();
      return;
    }
    // Empty hands: pick the plate up if it holds anything.
    if (st.items.length === 0) { sfx.sfxError(); banner(game, 'Plate is empty', '#ff9a8a'); return; }
    p.held = { plate: st.items };
    st.items = [];
    sfx.sfxPickup();
    return;
  }

  if (station.kind === 'trash') {
    if (!p.held) { sfx.sfxError(); return; }
    p.held = null;
    sfx.sfxPlace();
    banner(game, 'Tossed', '#cfd6dd');
    return;
  }

  if (station.kind === 'serve') {
    if (!p.held || typeof p.held !== 'object' || !p.held.plate) {
      sfx.sfxError();
      banner(game, 'Bring a finished plate here', '#ff9a8a');
      return;
    }
    const items = p.held.plate;
    const order = game.orders.find((o) => plateMatches(o.recipe, items));
    if (!order) {
      sfx.sfxError();
      banner(game, 'No order wants this dish', '#ff9a8a');
      game.combo = 0;
      return;
    }
    game.orders = game.orders.filter((o) => o.id !== order.id);
    game.combo += 1;
    const bonus = game.combo >= 3 ? 2 : 0;
    const earned = order.recipe.reward + bonus;
    game.coins += earned;
    game.served += 1;
    p.held = null;
    const c = stationCenter(station);
    burst(game, c.x, c.y - 20, '#f2c230', 16);
    burst(game, c.x, c.y - 20, '#ffffff', 8);
    addFloater(game, c.x, c.y - 40, `+${earned} coins`, '#f2c230');
    if (bonus > 0) addFloater(game, c.x, c.y - 64, `Combo x${game.combo}!`, '#ff9a8a');
    sfx.sfxServe();
    return;
  }
}

// ---- update ----------------------------------------------------------------

function collides(x, y) {
  for (const s of allStations()) {
    const r = PLAYER_RADIUS - 2;
    if (x > s.x - r && x < s.x + s.w + r && y > s.y - r && y < s.y + s.h + r) return true;
  }
  return false;
}

function movePlayer(game, dt, vx, vy) {
  const p = game.player;
  const step = PLAYER_SPEED * dt;
  let nx = p.x + vx * step;
  let ny = p.y + vy * step;
  // Axis-separated movement so the chef slides along counters.
  if (!collides(nx, p.y)) p.x = nx;
  if (!collides(p.x, ny)) p.y = ny;
  p.x = Math.max(24, Math.min(936, p.x));
  p.y = Math.max(150, Math.min(616, p.y));
  p.moving = vx !== 0 || vy !== 0;
  if (p.moving) p.dir = Math.atan2(vy, vx);
}

function updateSlot(game, slot, dt, station) {
  if (!slot.item || slot.done) {
    if (slot.item && slot.done && slot.burnLeft > 0) {
      slot.burnLeft -= dt;
      if (slot.burnLeft <= 0) {
        slot.item = 'burnt';
        slot.burnLeft = 0;
        burst(game, station.x + station.w / 2, station.y + station.h / 2, '#2b2b2b', 6);
      }
    }
    return;
  }
  const ing = INGREDIENTS[slot.item] || null;
  // The raw ingredient id is lost once placed; the duration lives on the result.
  const total = slotTotalSeconds(station.kind, slot.item);
  slot.progress += dt;
  if (slot.progress >= total) {
    slot.done = true;
    slot.progress = total;
    const raw = rawOf(slot.item);
    slot.burnLeft = raw && raw.burnSeconds ? raw.burnSeconds : 0;
    if (station.kind === 'board') sfx.sfxChop();
  }
  void ing;
}

function slotTotalSeconds(kind, resultId) {
  // Duration of the station job that produces this result.
  for (const raw of Object.values(INGREDIENTS)) {
    if (raw.result === resultId) {
      if (kind === 'board') return raw.chopSeconds || 1.6;
      return raw.cookSeconds || 3.0;
    }
  }
  return 3.0;
}

function rawOf(resultId) {
  for (const raw of Object.values(INGREDIENTS)) {
    if (raw.result === resultId && raw.prep !== 'none') return raw;
  }
  return null;
}

export function update(game, dt, input) {
  if (game.mode !== 'playing') return;
  game.time += dt;
  game.timeLeft = Math.max(0, SHIFT_SECONDS - game.time);

  // Last-ten-seconds tick.
  const whole = Math.ceil(game.timeLeft);
  if (game.timeLeft <= 10.5 && whole !== game.lastTickSecond) {
    game.lastTickSecond = whole;
    sfx.sfxTick();
  }

  // Shift over.
  if (game.timeLeft <= 0) {
    game.mode = 'over';
    return;
  }

  // Orders spawn and age.
  game.spawnIn -= dt;
  if (game.spawnIn <= 0 && game.orders.length < ORDER.maxActive) {
    spawnOrder(game);
    const t = game.time / SHIFT_SECONDS;
    game.spawnIn = ORDER.spawnEveryStart + (ORDER.spawnEveryEnd - ORDER.spawnEveryStart) * t;
  }
  for (const o of game.orders) o.patience -= dt;
  const expired = game.orders.filter((o) => o.patience <= 0);
  if (expired.length > 0) {
    game.orders = game.orders.filter((o) => o.patience > 0);
    game.missed += expired.length;
    game.coins = Math.max(0, game.coins - ORDER.missPenaltyCoins * expired.length);
    game.combo = 0;
    banner(game, `Order walked out! -${ORDER.missPenaltyCoins * expired.length}`, '#ff9a8a');
    sfx.sfxMiss();
  }

  // Stations cook.
  for (const b of game.stations.boards) updateSlot(game, b.slot, dt, b);
  for (const g of game.stations.grills) updateSlot(game, g.slot, dt, g);
  updateSlot(game, game.stations.fryer.slot, dt, game.stations.fryer);

  // Movement: keys win over a mouse target.
  const mv = input.moveVector();
  if (mv.x !== 0 || mv.y !== 0) {
    game.player.moveTarget = null;
    game.player.pendingStation = null;
    movePlayer(game, dt, mv.x, mv.y);
  } else if (game.player.moveTarget) {
    const t = game.player.moveTarget;
    const dx = t.x - game.player.x;
    const dy = t.y - game.player.y;
    const d = Math.hypot(dx, dy);
    if (d < 6) {
      game.player.moveTarget = null;
      if (game.player.pendingStation) {
        const st = game.player.pendingStation;
        game.player.pendingStation = null;
        if (distToStation(game, st) <= REACH) useStation(game, st);
      }
    } else {
      movePlayer(game, dt, dx / d, dy / d);
    }
  }

  // Keyboard / click interaction with the nearest station.
  if (input.takeInteract()) {
    const near = nearestStation(game);
    if (near) useStation(game, near);
  }
  const click = input.takeClick();
  if (click) {
    const hit = allStations().find((s) => click.x >= s.x && click.x <= s.x + s.w && click.y >= s.y && click.y <= s.y + s.h);
    if (hit) {
      if (distToStation(game, hit) <= REACH) {
        useStation(game, hit);
      } else {
        const c = stationCenter(hit);
        game.player.moveTarget = { x: c.x, y: c.y + hit.h / 2 + 34 };
        game.player.pendingStation = hit;
      }
    } else {
      game.player.moveTarget = { x: click.x, y: click.y };
      game.player.pendingStation = null;
    }
  }

  // Particles and floaters.
  for (const pt of game.particles) {
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vy += 120 * dt;
    pt.life -= dt;
  }
  game.particles = game.particles.filter((pt) => pt.life > 0);
  for (const f of game.floaters) {
    f.y -= 34 * dt;
    f.life -= dt;
  }
  game.floaters = game.floaters.filter((f) => f.life > 0);
  if (game.flash && game.time > game.flash.until) game.flash = null;
}

// Stars at the end: 1 for 40 coins, 2 for 80, 3 for 120.
export function starsFor(game) {
  if (game.coins >= 120) return 3;
  if (game.coins >= 80) return 2;
  if (game.coins >= 40) return 1;
  return 0;
}
