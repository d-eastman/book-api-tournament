# Color System — Execution Summary

## Status: COMPLETE (core system + component integration)

Every visual element in the Control Center is now colored by programming language. The flat color map has been replaced with a rich `LanguageColor` type providing primary, light, dark, and emoji variants per language, living in a shared module used by all components.

---

## Files Created

| # | File | Purpose |
|---|------|---------|
| 1 | src/shared/colors.ts | `LanguageColor` interface, 22-language palette with primary/light/dark/emoji, utility functions (`getColor`, `getEntryColor`, `colorToCssVars`, `textColorOn`) |

## Files Modified

| # | File | Change |
|---|------|--------|
| 1 | src/client/lib/colors.ts | Replaced flat map with re-exports from shared module. Kept backward-compatible `getLanguageColor()` that returns just the primary hex. |
| 2 | src/client/components/EntrySelector.tsx | Added language-colored left border and emoji per entry row |
| 3 | src/client/components/ResultsTable.tsx | Added language-colored left border per result row, replaced color dot with emoji |
| 4 | src/client/components/MatchupCard.tsx | Added colored left borders per entry side, winner gets glowing border + tinted background in their language color, score bar uses language color, WIN label uses language color |
| 5 | src/client/components/BracketView.tsx | Added colored left borders per bracket slot (dashed for byes), losers dim to 40% opacity, winners get tinted background, champion banner uses winner's language color and emoji |
| 6 | src/client/pages/LandingPage.tsx | Language grid cards now have colored left border and emoji |
| 7 | src/client/pages/OperatorPage.tsx | Progress panel uses the current entry's language color for the pulsing dot, left border, step label, and shows the emoji |

---

## Language Palette (22 languages)

| Language | Primary | Emoji |
|----------|---------|-------|
| Assembly | #6E7681 | :gear: |
| C | #555555 | :wrench: |
| C# | #68217A | :purple_circle: |
| C++ | #00599C | :nut_and_bolt: |
| Clojure | #5881D8 | :cyclone: |
| COBOL | #4A646C | :sauropod: |
| Crystal | #000100 | :gem: |
| Elixir | #4B275F | :test_tube: |
| Go | #00ADD8 | :hamster: |
| Haskell | #5D4F85 | lambda |
| Java | #B07219 | :coffee: |
| JavaScript | #F0DB4F | :yellow_circle: |
| Kotlin | #A97BFF | :purple_circle: |
| Lua | #000080 | :crescent_moon: |
| Perl | #39457E | :camel: |
| PHP | #777BB4 | :elephant: |
| Python | #3776AB | :snake: |
| Ruby | #CC342D | :gem: |
| Rust | #DEA584 | :crab: |
| Swift | #F05138 | :bird: |
| TypeScript | #3178C6 | :blue_circle: |
| Zig | #F7A41D | :zap: |

Each entry has four values:
- **primary** — borders, lines, dots, score bars
- **light** — tinted backgrounds (primary at ~15% opacity)
- **dark** — text/borders on light backgrounds
- **emoji** — bracket labels, entry rows, progress indicators

---

## Utility Functions

| Function | Purpose |
|----------|---------|
| `getColor(language)` | Returns `LanguageColor` for a language (fallback: gray with ? emoji) |
| `getEntryColor(entry)` | Convenience wrapper taking an entry object |
| `colorToCssVars(color)` | Returns `--lang-primary`, `--lang-light`, `--lang-dark` CSS custom properties |
| `textColorOn(background)` | Returns black or white text color based on background luminance |
| `getLanguageColor(language)` | Backward-compatible, returns just the primary hex string |

---

## Build Verification

- TypeScript: `tsc --noEmit` passes with zero errors
- Vite: `vite build` succeeds (50 modules, ~212KB JS)

---

## What Still Needs Doing

### Features from the plan not yet implemented

1. **Trading cards** — the plan describes a `TradingCard` component with colored header, stat bars, and bordered layout. This component doesn't exist yet. It would be a new component used in results/tournament views.

2. **Charts** — the plan describes Recharts/Chart.js integration with language-colored bars and scatter plot dots. No charting library is installed yet. When charts are added, use `getColor(language).primary` for bar fills and `getColor(language).dark` for borders.

3. **Shareable PNG export** — the plan describes generating tournament matchup cards as PNG images using `html-to-image`. Not implemented. Would require adding the `html-to-image` dependency.

4. **Winner glow animation** — the plan describes a `@keyframes winner-glow` CSS animation. The current implementation uses a static `box-shadow` glow on the matchup card winner. Adding the pulsing animation would be a CSS addition.

5. **CSS custom properties approach** — the `colorToCssVars()` utility exists but no components currently set `--lang-primary` etc. as CSS variables. The current approach uses inline styles directly. Either approach works; CSS vars would be useful if adding the `tr:hover { background-color: var(--language-light) }` pattern described in the plan.

### Keeping the palette up to date

When a new language enters the tournament:

1. Add its entry to `LANGUAGE_COLORS` in `src/shared/colors.ts`
2. Choose a primary that's visually distinct from adjacent languages in the bracket
3. Generate light (primary at ~15% on white) and dark (primary darkened ~30%) variants
4. Pick an emoji that's recognizable and doesn't duplicate existing ones
5. Test: all components automatically pick up the new color via `getColor()`

The palette currently covers all 22 languages listed in CLAUDE.md. If a contributor adds a language not in the palette, `getColor()` returns a gray fallback with a ? emoji — visible enough to signal that a color needs to be added.
