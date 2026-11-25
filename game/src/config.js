// Sizzle Station — shared tuning: ingredients, recipes and shift pacing.
// Every value the game reads lives here so balancing is one file.

// Logical canvas size. The page scales the canvas to fit the window.
export const VIEW_W = 960;
export const VIEW_H = 640;

// One shift lasts this long (seconds). The timer bar in the HUD counts it down.
export const SHIFT_SECONDS = 150;

// ---- Ingredients -----------------------------------------------------------
// prep: what a raw ingredient becomes after its station finishes.
//   board  -> chopping board, grill -> grill, fryer -> fryer, none -> ready as-is.
// chopSeconds / cookSeconds: how long the station takes. burnSeconds: how long a
// finished item survives on the grill before it burns (0 = never burns).
export const INGREDIENTS = {
  bun:     { id: 'bun',     name: 'Bun',      color: '#e8a94f', prep: 'none',  result: 'bun' },
  patty:   { id: 'patty',   name: 'Patty',    color: '#8a4b2d', prep: 'grill', result: 'grilled', cookSeconds: 3.0, burnSeconds: 5.0 },
  lettuce: { id: 'lettuce', name: 'Lettuce',  color: '#5da244', prep: 'board', result: 'choppedLettuce', chopSeconds: 1.6 },
  tomato:  { id: 'tomato',  name: 'Tomato',   color: '#d84a3a', prep: 'board', result: 'slicedTomato', chopSeconds: 1.6 },
  cheese:  { id: 'cheese',  name: 'Cheese',   color: '#f2c230', prep: 'none',  result: 'cheese' },
  potato:  { id: 'potato',  name: 'Potato',   color: '#d9b380', prep: 'fryer', result: 'fries', cookSeconds: 3.5, burnSeconds: 0 },
  grilled:       { id: 'grilled',       name: 'Grilled Patty', color: '#6b3a22', prep: 'none', result: 'grilled' },
  choppedLettuce:{ id: 'choppedLettuce',name: 'Chopped Lettuce', color: '#79c25e', prep: 'none', result: 'choppedLettuce' },
  slicedTomato:  { id: 'slicedTomato', name: 'Sliced Tomato', color: '#e8604c', prep: 'none', result: 'slicedTomato' },
  fries:   { id: 'fries',   name: 'Fries',    color: '#f2c230', prep: 'none',  result: 'fries' },
  burnt:   { id: 'burnt',   name: 'Burnt!',   color: '#2b2b2b', prep: 'none',  result: 'burnt' },
};

// Crates on the pantry shelf, in the order they appear left to right.
export const CRATE_ORDER = ['bun', 'patty', 'lettuce', 'tomato', 'cheese', 'potato'];

// ---- Recipes ---------------------------------------------------------------
// needs: ingredient ids that must sit on the plate, in any order.
// unlockAfter: seconds into the shift before the recipe can be ordered.
export const RECIPES = [
  { id: 'burger',  name: 'Classic Burger', needs: ['bun', 'grilled', 'choppedLettuce'], reward: 12, unlockAfter: 0 },
  { id: 'fries',   name: 'Crispy Fries',   needs: ['fries'],                          reward: 8,  unlockAfter: 0 },
  { id: 'salad',   name: 'Garden Salad',   needs: ['choppedLettuce', 'slicedTomato'], reward: 10, unlockAfter: 0 },
  { id: 'cheese',  name: 'Cheese Burger',  needs: ['bun', 'grilled', 'cheese', 'choppedLettuce'], reward: 16, unlockAfter: 25 },
  { id: 'deluxe',  name: 'Deluxe Stack',   needs: ['bun', 'grilled', 'cheese', 'choppedLettuce', 'slicedTomato'], reward: 22, unlockAfter: 60 },
];

// ---- Orders ----------------------------------------------------------------
export const ORDER = {
  maxActive: 4,
  firstAtSeconds: 2,
  spawnEveryStart: 13,   // seconds between new orders at the start of the shift
  spawnEveryEnd: 7,      // seconds between new orders near the end
  patienceStart: 50,     // seconds an order waits before it walks out
  patienceEnd: 36,
  missPenaltyCoins: 5,   // coins lost when an order expires
};

// ---- Kitchen layout --------------------------------------------------------
// Station rectangles are in canvas coordinates. The pantry crates sit in a row
// under the order board; the work floor is everything below them.
export const STATIONS = {
  crates: CRATE_ORDER.map((id, i) => ({
    kind: 'crate', ingredient: id,
    x: 24 + i * 100, y: 150, w: 88, h: 54,
  })),
  boards: [
    { kind: 'board', x: 24,  y: 236, w: 104, h: 72 },
    { kind: 'board', x: 144, y: 236, w: 104, h: 72 },
  ],
  grills: [
    { kind: 'grill', x: 304, y: 236, w: 104, h: 72 },
    { kind: 'grill', x: 424, y: 236, w: 104, h: 72 },
  ],
  fryer: { kind: 'fryer', x: 584, y: 236, w: 104, h: 72 },
  plates: [
    { kind: 'plate', x: 24,  y: 352, w: 120, h: 84 },
    { kind: 'plate', x: 160, y: 352, w: 120, h: 84 },
  ],
  serve: { kind: 'serve', x: 780, y: 236, w: 156, h: 120 },
  trash: { kind: 'trash', x: 780, y: 392, w: 84, h: 72 },
};

// All station rects, for collision and for click picking.
export function allStations() {
  return [
    ...STATIONS.crates,
    ...STATIONS.boards,
    ...STATIONS.grills,
    STATIONS.fryer,
    ...STATIONS.plates,
    STATIONS.serve,
    STATIONS.trash,
  ];
}

// Where the chef starts the shift.
export const PLAYER_START = { x: 480, y: 540 };

// ---- Look ------------------------------------------------------------------
export const COLORS = {
  floorA: '#c98f4e',
  floorB: '#bd8346',
  wall: '#7a4a2b',
  counter: '#f3e2c2',
  counterEdge: '#b98d54',
  board: '#e8c98f',
  grill: '#4a4a52',
  steel: '#c9ccd4',
  serve: '#e2703a',
  trash: '#5b6770',
  ink: '#3a2415',
  cream: '#fff6e3',
  gold: '#f2c230',
  red: '#d84a3a',
  green: '#5da244',
};
