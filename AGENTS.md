# Instructions for AI assistants

Read this before changing anything in ASTRION. These rules hold for every AI tool used on this repo.

## What this project is

ASTRION is an educational web game for the NASA Space Apps Challenge. Players design a satellite, fly a mission over the Paraguayan Chaco and compare NASA Landsat images to find forest loss.

- **Players:** girls aged 9 to 12. They read fluently and can handle real trade-offs (mass, energy, data). Keep **one task per screen**.
- **Stack:** Vite + Phaser 4 (1920×1080 design area, `Scale.EXPAND`), HTML overlays for the UI, Three.js for the 3D Earth, MapLibre for the Chaco map.
- **Flow:** Boot → Menu → Station → Build → Test (flight) → Reward → Observe → Finale.

## Language

- **UI text and NOAH's lines:** Spanish with *voseo* ("Elegí", "Arrastrá", "Podés").
- **Code, comments, commit messages and docs for developers:** English.

## Visual design: clean, not "AI-looking"

- **No emoji or decorative symbols** (✦, 🚀, ✨) in UI text, labels or buttons.
- **Say each thing once.** If NOAH says it, don't also put the same sentence in a panel, title or caption.
- **Few numbers on screen.** Only the ones needed for the decision the player is making right now. No stacks of chips, pills or badges.
- **Glow and neon sparingly:** only on the selected or primary element. Prefer plain borders and space.
- **One progress indicator per screen.** Don't add step dots when a step bar already exists.
- **Colors:** use the palette in `src/ui/palette.js` (the same values are CSS variables in `src/ui/workshop.css`). **No lime or neon green**, and no new colors without a reason.
- **Fonts:** Cinzel (big titles), Audiowide (labels, buttons), Quicksand (body text). Don't add others.
- **Window sizes:** it must work at 16:9, 16:10 and short laptop windows (e.g. 1470×720). Check that nothing gets cut off or hidden behind other panels.

## Reuse what exists. Don't build a second copy.

| Need | Use |
| --- | --- |
| A modal, message or question to the player | `showDialog()` in `src/ui/dialog.js` (await it to get the chosen button) |
| Layout of a mission screen (top bar, panels, NOAH, buttons) | `mount()` in `src/ui/mission-ui.js` |
| NOAH speaking | `noahSpeak()` / `speakIfEnabled()` in `src/ui/noahVoice.js` |
| Voice on/off | the Phaser registry key `noahVoice` (already saved to localStorage). Don't keep a separate copy of this state. |
| Satellite parts and their numbers | `src/game/parts.json` |
| Game rules (energy, data, success) | `src/game/model.js` |

If something you need is almost there, extend the shared piece instead of copying it into your file.

## Code style

- **Write readable code.** One statement per line, normal indentation, descriptive names. No minified one-line functions or long chains on a single line.
- **Game logic goes in `src/game/`:** pure functions with no DOM and no Phaser, covered by tests in `tests/`. UI goes in `src/ui/` or `src/scenes/`.
- **Keep files focused.** If a file starts doing several unrelated things, split it.
- **Comments explain *why*,** written for a beginner reading the code.
- **No new dependencies** unless the team asks for one.
- **No inline `style="..."` for things that belong in CSS.**

## NOAH's voice

NOAH's lines are pre-recorded MP3s in `public/assets/voice/`, keyed by a hash of the text.

- **Changing a line's text means its audio no longer matches.** The game then falls back to the browser voice.
- **Workshop lines** belong in `src/game/noah-lines.js`.
- **Lines for other screens:** add a copy to `scripts/noah-other-lines.mjs`.
- **Never edit `public/assets/voice/` by hand.** Tell the team that `npm run voice` needs to run (it spends ElevenLabs credits).
- **Never commit `.env.local`.**

## Working on this repo

1. **Make small changes, one topic at a time.** A human reviews and commits each one, so keep diffs easy to read.
2. **Don't rewrite or restyle files you weren't asked to touch.** Don't rename things for taste.
3. **Before finishing, run `npm test` and `npm run build`.** Both must pass.
4. **Look at the change in the browser** (`npm run dev`). On localhost, `?dev=1` opens a picker that jumps straight to any build step or flight stage.
5. **When done, summarize what changed and suggest a short commit message in English.** Then offer to commit and push (see below). Don't do it without the person's OK.
6. **Data and sources:** NASA and Natural Earth files in `public/data/` are tracked in `public/data/sources.json` and `public/FUENTES.md`. Update those when adding or replacing data.

## Git: stay in sync with the team

Several people push to `main` at the same time. Conflicts happen when someone works for hours without syncing. Not everyone on the team is used to Git, so **guide the person step by step**: say which command you are running and why, in plain words.

**Before starting any task**, get the latest version:

```sh
git status        # must be clean; if not, commit or ask what to do with the changes first
git pull
```

**After each small finished change** (tests and build passing), with the person's OK:

```sh
git add <the files you changed>
git commit -m "Short message in English"
git pull          # bring in what others pushed meanwhile
git push
```

- **Commit and push often:** after each small piece, not once at the end of the day. Small, frequent pushes keep conflicts small.
- **If `git pull` reports a conflict, stop.** Show the person which files conflict. Resolve by keeping **both** sides' work, never by deleting the other person's code. If unsure, ask the team before continuing.
- **Never** use `git push --force`, `git reset --hard`, `git checkout -- .` or `git clean`, and never delete branches. These can destroy other people's work.
- **Only add the files you changed.** Not `git add .` when unrelated files show up in `git status`.
