# best-cooking-game-01

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/tony0976/best-cooking-game-01/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/tony0976/best-cooking-game-01/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Sizzle Station — a tiny cooking game: one chef, one rush-hour kitchen, 150 seconds.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. No build step, no network requests: the game is plain static files under `game/`.

## How to play

- **Move:** WASD / arrow keys / click. **Use a station:** E / Space / click the station. **Mute:** M.
- Grab ingredients from the pantry crates (bun, patty, lettuce, tomato, cheese, potato).
- **Chop** lettuce and tomato on the chopping boards, **grill** patties on the grill (don't let them burn!), **fry** potatoes in the fryer.
- Stack ingredients on a plate at the assembly counter, pick the plate up, and **serve** it at the serving window when it matches an order on the board.
- Orders expire — serve fast for combo bonuses. Recipes:
  - Classic Burger: bun + grilled patty + chopped lettuce (12 coins)
  - Crispy Fries: fries (8 coins)
  - Garden Salad: chopped lettuce + sliced tomato (10 coins)
  - Cheese Burger: bun + grilled patty + cheese + chopped lettuce (16 coins)
  - Deluxe Stack: bun + grilled patty + cheese + chopped lettuce + sliced tomato (22 coins)

## Layout

- `game/index.html` — page and canvas
- `game/style.css` — page chrome
- `game/src/config.js` — ingredients, recipes, pacing, kitchen layout
- `game/src/state.js` — the world: player, stations, orders, rules
- `game/src/render.js` — all drawing, including the hand-drawn food icons
- `game/src/input.js` — keyboard and mouse
- `game/src/audio.js` — synthesised sound effects (Web Audio, no files)
- `game/src/main.js` — boot, game loop, `?shot=` screenshot staging
- `main.ts` — the entry program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`
- `screenshots/` — 3–4 real renders of the game, taken in headless Chrome

---

<sub>Entered on [make.fun](https://make.fun/?ref=0gzpxxg0&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
