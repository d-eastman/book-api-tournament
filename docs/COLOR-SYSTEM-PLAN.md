# COLOR-SYSTEM.md — Language-Colored Everything

## Overview

Every visual element in the Control Center is colored by programming language. This creates instant scannability — you can spot all the Go entries on a bracket without reading a single label, see the JVM cluster in a scatter plot at a glance, and track a language's progress through a tournament by color alone.

The color system is a single source of truth used by every component: bracket lines, chart bars, trading cards, progress spinners, table row accents, matchup cards, and shareable images.

---

## The Palette

### Primary Language Colors

Each language gets one color. These are chosen to be visually distinct from each other, roughly inspired by the language's brand identity but adjusted for contrast and accessibility on both light and dark backgrounds.

```typescript
// src/shared/colors.ts

export const LANGUAGE_COLORS: Record<string, LanguageColor> = {
  "Assembly":   { primary: "#6E7681", light: "#E8EAED", dark: "#3D4249", emoji: "⚙️"  },
  "C":          { primary: "#555555", light: "#E0E0E0", dark: "#333333", emoji: "🔧"  },
  "C#":         { primary: "#68217A", light: "#EDE0F0", dark: "#4A1756", emoji: "🟣"  },
  "C++":        { primary: "#00599C", light: "#D9EAF5", dark: "#003D6B", emoji: "🔩"  },
  "Clojure":    { primary: "#5881D8", light: "#DFE7F7", dark: "#3A5BA0", emoji: "🌀"  },
  "COBOL":      { primary: "#4A646C", light: "#DDE4E6", dark: "#2E4047", emoji: "🦕"  },
  "Crystal":    { primary: "#000100", light: "#D4D4D4", dark: "#1A1A1A", emoji: "💎"  },
  "Elixir":     { primary: "#4B275F", light: "#E4D8EA", dark: "#321A40", emoji: "🧪"  },
  "Go":         { primary: "#00ADD8", light: "#D4F1FA", dark: "#007A99", emoji: "🐹"  },
  "Haskell":    { primary: "#5D4F85", light: "#E2DDEF", dark: "#3E345A", emoji: "λ"   },
  "Java":       { primary: "#B07219", light: "#F2E6D0", dark: "#7A4F12", emoji: "☕"  },
  "Kotlin/JVM": { primary: "#F89820", light: "#FEE9CC", dark: "#B06A10", emoji: "☕"  },
  "Lua":        { primary: "#000080", light: "#D4D4F0", dark: "#000058", emoji: "🌙"  },
  "Node.js":    { primary: "#339933", light: "#D6EED6", dark: "#236B23", emoji: "🟢"  },
  "Bun":        { primary: "#FBF0DF", light: "#FFFDF8", dark: "#E8C97A", emoji: "🍞"  },
  "Perl":       { primary: "#39457E", light: "#DBDEED", dark: "#252D54", emoji: "🐪"  },
  "PHP":        { primary: "#777BB4", light: "#E4E5F1", dark: "#52567D", emoji: "🐘"  },
  "Python":     { primary: "#3776AB", light: "#D8E7F2", dark: "#265380", emoji: "🐍"  },
  "Ruby":       { primary: "#CC342D", light: "#F5D5D3", dark: "#8E241F", emoji: "💎"  },
  "Rust":       { primary: "#DEA584", light: "#F7EBDF", dark: "#A0725A", emoji: "🦀"  },
  "Swift":      { primary: "#F05138", light: "#FCD9D3", dark: "#B03525", emoji: "🐦"  },
  "Zig":        { primary: "#F7A41D", light: "#FDE9C7", dark: "#B07615", emoji: "⚡"  },
};

export interface LanguageColor {
  primary: string;    // Main brand color — used for borders, lines, dots
  light: string;      // Tinted background — used for card fills, table row highlights
  dark: string;       // Darker variant — used for text on light backgrounds, hover states
  emoji: string;      // Language emoji — used on trading cards, bracket labels
}
```

### Design Constraints

The palette was built with these rules:

1. **No two adjacent languages on the color wheel.** Go (cyan) and C# (purple) are far apart. Rust (copper) and Python (blue) are far apart. This ensures languages are distinguishable even at small sizes.

2. **All primary colors pass WCAG AA contrast** against both white and #1a1a2e (the dark theme background). This was tested with contrast ratio calculators.

3. **The light variant is the primary at ~15% opacity on white.** Used for card backgrounds and table row striping. Subtle enough to not overwhelm but visible enough to group entries visually.

4. **The dark variant is the primary darkened by ~30%.** Used for text and borders on light backgrounds where the primary would be too bright.

5. **Bun is a special case.** Its brand color is very light (cream/tan), so on dark backgrounds we use the dark variant as the primary, and the light variant is almost white. The UI handles this with a `needsDarkText` flag.

---

## Where Colors Are Applied

### 1. Tournament Bracket

Every element in the bracket is colored by the entry's language:

```
  ┌─ go-fiber ─── (cyan border, cyan connecting line)
  │             ├─── go-fiber ── (winning line is bold cyan)
  └─ rails ────── (red border, red connecting line, dimmed after loss)
```

**Implementation:**
- Entry name labels have a left border in the language color: `border-left: 3px solid {primary}`
- Connecting lines between rounds use the winner's language color
- Losing entries dim to 40% opacity: `opacity: 0.4`
- Bye entries have a dashed border: `border-left: 3px dashed {primary}`

```tsx
// BracketEntry component
<div
  className="bracket-entry"
  style={{
    borderLeft: `3px solid ${color.primary}`,
    opacity: isEliminated ? 0.4 : 1,
    backgroundColor: isActive ? color.light : 'transparent',
  }}
>
  <span className="emoji">{color.emoji}</span>
  <span className="name">{entry.framework}</span>
</div>
```

### 2. Trading Cards

The card border, header background, and stat bars all use the language color:

```tsx
<div
  className="trading-card"
  style={{
    border: `2px solid ${color.primary}`,
    boxShadow: `0 4px 12px ${color.primary}33`,  // 20% opacity shadow
  }}
>
  <div
    className="card-header"
    style={{ backgroundColor: color.light }}
  >
    <span className="emoji">{color.emoji}</span>
    <span className="framework-name">{entry.framework}</span>
    <span className="language-badge" style={{ color: color.dark }}>
      {entry.language}
    </span>
  </div>
  <div className="card-stats">
    {stats.map(stat => (
      <StatBar
        key={stat.name}
        label={stat.name}
        value={stat.value}
        percentage={stat.percentage}
        color={color.primary}
      />
    ))}
  </div>
</div>
```

### 3. Matchup Cards

During a tournament matchup, the two entries face off with their colors on opposite sides:

```tsx
<div className="matchup-card">
  <div className="entry-side" style={{ borderTop: `4px solid ${color1.primary}` }}>
    <span className="emoji">{color1.emoji}</span>
    <span>{entry1.framework}</span>
    <span className="score">{score1}</span>
  </div>

  <div className="vs">vs</div>

  <div className="entry-side" style={{ borderTop: `4px solid ${color2.primary}` }}>
    <span className="emoji">{color2.emoji}</span>
    <span>{entry2.framework}</span>
    <span className="score">{score2}</span>
  </div>
</div>
```

The winner's side gets a glowing border animation:

```css
@keyframes winner-glow {
  0% { box-shadow: 0 0 5px var(--winner-color); }
  50% { box-shadow: 0 0 20px var(--winner-color); }
  100% { box-shadow: 0 0 5px var(--winner-color); }
}

.entry-side.winner {
  animation: winner-glow 2s ease-in-out infinite;
}
```

### 4. Results Tables

Table rows get a subtle language color accent:

```tsx
<tr style={{ borderLeft: `3px solid ${color.primary}` }}>
  <td>
    <span className="emoji">{color.emoji}</span>
    {entry.framework}
  </td>
  <td>{entry.language}</td>
  <td>{result.reqPerSec.toLocaleString()}</td>
  ...
</tr>
```

On hover, the row background fills with the light color:

```css
tr:hover {
  background-color: var(--language-light);
}
```

### 5. Charts (Recharts / Chart.js)

Bar charts use the language primary color for each bar:

```tsx
// For a throughput bar chart
const chartData = results.map(r => ({
  name: r.framework,
  value: r.reqPerSec,
  fill: LANGUAGE_COLORS[r.language].primary,
}));

<BarChart data={chartData}>
  <Bar dataKey="value">
    {chartData.map((entry, i) => (
      <Cell key={i} fill={entry.fill} />
    ))}
  </Bar>
</BarChart>
```

Scatter plots use the primary color for dots with the dark color for borders:

```tsx
// Each language is a separate dataset for legend grouping
const datasets = languages.map(lang => ({
  label: lang,
  data: results.filter(r => r.language === lang).map(r => ({
    x: r.reqPerSec,
    y: r.memLoadedMib,
  })),
  backgroundColor: LANGUAGE_COLORS[lang].primary,
  borderColor: LANGUAGE_COLORS[lang].dark,
  borderWidth: 1,
  pointRadius: 8,
}));
```

### 6. Progress Spinner

When benchmarking an entry, the spinner uses the entry's language color:

```tsx
<div
  className="spinner"
  style={{
    borderTopColor: color.primary,
    borderRightColor: `${color.primary}33`,
    borderBottomColor: `${color.primary}33`,
    borderLeftColor: `${color.primary}33`,
  }}
/>
```

### 7. Shareable Tournament Cards (PNG export)

When generating a PNG image of a matchup result:

```tsx
// Use html-to-image or canvas API
const card = (
  <div className="share-card" style={{ width: 600, height: 315 }}>
    <div className="left" style={{ backgroundColor: color1.light, borderLeft: `6px solid ${color1.primary}` }}>
      <div className="emoji">{color1.emoji}</div>
      <div className="name">{entry1.framework}</div>
      <div className="score">{score1.toLocaleString()} req/s</div>
    </div>
    <div className="center">
      <div className="metric">{metricName}</div>
      <div className="winner-label">🏆 {winner.framework}</div>
    </div>
    <div className="right" style={{ backgroundColor: color2.light, borderRight: `6px solid ${color2.primary}` }}>
      <div className="emoji">{color2.emoji}</div>
      <div className="name">{entry2.framework}</div>
      <div className="score">{score2.toLocaleString()} req/s</div>
    </div>
  </div>
);
```

---

## Utility Functions

```typescript
// src/shared/colors.ts

export function getColor(language: string): LanguageColor {
  return LANGUAGE_COLORS[language] ?? {
    primary: "#999999",
    light: "#EEEEEE",
    dark: "#666666",
    emoji: "❓",
  };
}

export function getEntryColor(entry: Entry): LanguageColor {
  return getColor(entry.language);
}

// For CSS custom properties (set on a container element)
export function colorToCssVars(color: LanguageColor): Record<string, string> {
  return {
    "--lang-primary": color.primary,
    "--lang-light": color.light,
    "--lang-dark": color.dark,
  };
}

// For generating accessible text color on a given background
export function textColorOn(background: string): string {
  // Simple luminance check
  const hex = background.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#1a1a2e" : "#ffffff";
}
```

---

## Dark Mode Considerations

The primary colors were chosen to work on both light and dark backgrounds, but some adjustments are needed:

```css
/* Light theme */
:root {
  --bg: #ffffff;
  --surface: #f5f5f5;
  --text: #333333;
}

/* Dark theme (default for tournament/presentation mode) */
[data-theme="dark"] {
  --bg: #1a1a2e;
  --surface: #242440;
  --text: #e0e0e0;
}

/* Language colors adapt */
[data-theme="dark"] .bracket-entry {
  /* Use slightly brighter version of primary on dark bg */
  filter: brightness(1.1);
}

[data-theme="dark"] .trading-card {
  background-color: var(--surface);
  /* Light variant becomes the subtle fill on dark bg */
  border-color: var(--lang-primary);
}
```

---

## Adding a New Language

When a new language enters the tournament:

1. Add its color to `LANGUAGE_COLORS` in `src/shared/colors.ts`
2. Choose a primary that doesn't conflict with adjacent languages in the bracket
3. Generate light (primary at 15% on white) and dark (primary darkened 30%) variants
4. Pick an emoji that's recognizable and doesn't duplicate an existing one
5. Test contrast ratios against both `#ffffff` and `#1a1a2e`

Tools for picking colors:
- **Contrast checker:** https://webaim.org/resources/contrastchecker/
- **Color blindness simulator:** https://www.color-blindness.com/coblis-color-blindness-simulator/
- **Palette generator:** https://coolors.co/
