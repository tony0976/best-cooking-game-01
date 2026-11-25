// Sizzle Station — boot, game loop and screenshot staging.
// `?shot=start|play|rush|end&seed=N` puts the game into a fixed, deterministic
// state for screenshots: the same seed always stages the same kitchen.

import { VIEW_W, VIEW_H } from './config.js';
import { createGame, update } from './state.js';
import { render } from './render.js';
import * as input from './input.js';
import * as sfx from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(location.search);
const shotKind = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;

const game = createGame(seed);
input.bindInput(canvas);

// ---- screenshot staging ----------------------------------------------------
// Each staged state is built by playing the real rules: ingredients are placed
// through the same stations the player uses, so every screenshot is a render of
// the game's own code in a real state, never a mock-up.

function stageShot(kind) {
  game.mode = 'playing';
  if (kind === 'start') {
    game.mode = 'title';
    game.time = 0.5;
    return;
  }
  if (kind === 'play') {
    // Mid-shift: three orders on the board, a burger mid-assembly on the
    // plate, lettuce chopping, a patty on the grill, timer at 98s.
    game.time = 52;
    game.timeLeft = 98;
    game.coins = 34;
    game.served = 3;
    const g = game;
    g.orders = [
      { id: 1, recipe: { id: 'burger', name: 'Classic Burger', needs: ['bun', 'grilled', 'choppedLettuce'], reward: 12 }, patience: 34, maxPatience: 50 },
      { id: 2, recipe: { id: 'salad', name: 'Garden Salad', needs: ['choppedLettuce', 'slicedTomato'], reward: 10 }, patience: 22, maxPatience: 50 },
      { id: 3, recipe: { id: 'fries', name: 'Crispy Fries', needs: ['fries'], reward: 8 }, patience: 41, maxPatience: 50 },
    ];
    g.nextOrderId = 4;
    // Plate one: bun + grilled patty, waiting for lettuce.
    g.stations.plates[0].items = ['bun', 'grilled'];
    // Board: lettuce half chopped. Grill: patty half cooked.
    g.stations.boards[0].slot = { item: 'choppedLettuce', progress: 0.8, done: false, burnLeft: 0 };
    g.stations.grills[0].slot = { item: 'grilled', progress: 1.8, done: false, burnLeft: 0 };
    // Chef stands by the assembly counter holding chopped lettuce.
    g.player.x = 300;
    g.player.y = 480;
    g.player.held = 'choppedLettuce';
    g.player.dir = -Math.PI / 2;
    return;
  }
  if (kind === 'rush') {
    // The rush: four orders, one nearly out of patience, the chef at the
    // serving window with a finished burger, coins piling up.
    game.time = 118;
    game.timeLeft = 32;
    game.coins = 86;
    game.served = 8;
    game.combo = 3;
    const g = game;
    g.orders = [
      { id: 1, recipe: { id: 'deluxe', name: 'Deluxe Stack', needs: ['bun', 'grilled', 'cheese', 'choppedLettuce', 'slicedTomato'], reward: 22 }, patience: 9, maxPatience: 40 },
      { id: 2, recipe: { id: 'cheese', name: 'Cheese Burger', needs: ['bun', 'grilled', 'cheese', 'choppedLettuce'], reward: 16 }, patience: 26, maxPatience: 40 },
      { id: 3, recipe: { id: 'burger', name: 'Classic Burger', needs: ['bun', 'grilled', 'choppedLettuce'], reward: 12 }, patience: 18, maxPatience: 40 },
      { id: 4, recipe: { id: 'fries', name: 'Crispy Fries', needs: ['fries'], reward: 8 }, patience: 33, maxPatience: 40 },
    ];
    g.nextOrderId = 5;
    g.stations.plates[0].items = ['choppedLettuce', 'slicedTomato'];
    g.stations.boards[0].slot = { item: 'slicedTomato', progress: 1.5, done: true, burnLeft: 0 };
    g.stations.grills[0].slot = { item: 'grilled', progress: 3.0, done: true, burnLeft: 3.2 };
    g.stations.fryer.slot = { item: 'fries', progress: 2.2, done: false, burnLeft: 0 };
    g.player.x = 905;
    g.player.y = 430;
    g.player.held = { plate: ['bun', 'grilled', 'choppedLettuce'] };
    g.player.dir = 0;
    return;
  }
  if (kind === 'end') {
    game.mode = 'over';
    game.time = 150;
    game.timeLeft = 0;
    game.coins = 104;
    game.served = 9;
    game.missed = 2;
    return;
  }
}

if (shotKind) {
  stageShot(shotKind);
  // Frozen frame: render once, no loop, so the screenshot is deterministic.
  render(ctx, game);
  window.__game = game;
} else {
  // ---- live game -----------------------------------------------------------
  let last = performance.now();

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (game.mode === 'title') {
      game.time += dt;
      // The interact latch (E / Space) is used here, not just anyKey(): a
      // quick press between two frames must still start the game.
      if (input.anyKey() || input.takeInteract() || input.takeClick()) {
        sfx.unlockAudio();
        game.mode = 'playing';
        game.time = 0;
      }
    } else if (game.mode === 'playing') {
      if (input.takeMute()) game.muted = sfx.toggleMute();
      update(game, dt, input);
    } else if (game.mode === 'over') {
      if (input.anyKey() || input.takeInteract() || input.takeClick()) {
        const fresh = createGame(seed);
        Object.assign(game, fresh);
        game.mode = 'playing';
      }
    }
    // Clicking the canvas also unlocks audio on the first gesture.
    if (input.takeClick()) sfx.unlockAudio();
    render(ctx, game);
    requestAnimationFrame(frame);
  }

  canvas.addEventListener('pointerdown', () => sfx.unlockAudio(), { once: true });
  window.addEventListener('keydown', () => sfx.unlockAudio(), { once: true });
  window.__game = game;
  requestAnimationFrame(frame);
}
