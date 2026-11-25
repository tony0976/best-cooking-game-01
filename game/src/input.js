// Sizzle Station — keyboard and mouse input, kept in one place.
// The game reads this module's state; it never touches the DOM itself except
// to listen on the canvas element it is given.

// Keys held down right now, by KeyboardEvent.code.
const keys = new Set();

// True for one frame after the interact key is pressed (E or Space).
let interactPressed = false;

// A click on the canvas: { x, y } in canvas coordinates, consumed once.
let clickPoint = null;

// The last mouse position over the canvas, for hover highlights.
export const mouse = { x: -1, y: -1, inside: false };

export function bindInput(canvas) {
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') e.preventDefault();
    if (e.repeat) return;
    keys.add(e.code);
    if (e.code === 'KeyE' || e.code === 'Space') interactPressed = true;
    if (e.code === 'KeyM') {
      // M toggles mute; handled by the main loop through this flag.
      mutePressed = true;
    }
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
    mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
    mouse.inside = true;
  });
  canvas.addEventListener('pointerleave', () => { mouse.inside = false; });
  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    clickPoint = {
      x: (e.clientX - r.left) * (canvas.width / r.width),
      y: (e.clientY - r.top) * (canvas.height / r.height),
    };
  });
}

let mutePressed = false;

// Movement vector from WASD or arrow keys, normalised.
export function moveVector() {
  let x = 0;
  let y = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
  if (x !== 0 && y !== 0) {
    const len = Math.hypot(x, y);
    x /= len;
    y /= len;
  }
  return { x, y };
}

// True once when the player pressed E / Space / clicked a station.
export function takeInteract() {
  const v = interactPressed;
  interactPressed = false;
  return v;
}

// The click point, if the player clicked since the last frame.
export function takeClick() {
  const v = clickPoint;
  clickPoint = null;
  return v;
}

export function takeMute() {
  const v = mutePressed;
  mutePressed = false;
  return v;
}

// Any key at all, for "press any key to start".
export function anyKey() {
  return keys.size > 0;
}
