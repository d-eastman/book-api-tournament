export interface LanguageColor {
  primary: string;
  light: string;
  dark: string;
  emoji: string;
}

export const LANGUAGE_COLORS: Record<string, LanguageColor> = {
  "Assembly":   { primary: "#6E7681", light: "#E8EAED", dark: "#3D4249", emoji: "\u2699\uFE0F"  },
  "C":          { primary: "#555555", light: "#E0E0E0", dark: "#333333", emoji: "\uD83D\uDD27"  },
  "C#":         { primary: "#68217A", light: "#EDE0F0", dark: "#4A1756", emoji: "\uD83D\uDFE3"  },
  "C++":        { primary: "#00599C", light: "#D9EAF5", dark: "#003D6B", emoji: "\uD83D\uDD29"  },
  "Clojure":    { primary: "#5881D8", light: "#DFE7F7", dark: "#3A5BA0", emoji: "\uD83C\uDF00"  },
  "COBOL":      { primary: "#4A646C", light: "#DDE4E6", dark: "#2E4047", emoji: "\uD83E\uDD95"  },
  "Crystal":    { primary: "#000100", light: "#D4D4D4", dark: "#1A1A1A", emoji: "\uD83D\uDC8E"  },
  "Elixir":     { primary: "#4B275F", light: "#E4D8EA", dark: "#321A40", emoji: "\uD83E\uDDEA"  },
  "Go":         { primary: "#00ADD8", light: "#D4F1FA", dark: "#007A99", emoji: "\uD83D\uDC39"  },
  "Haskell":    { primary: "#5D4F85", light: "#E2DDEF", dark: "#3E345A", emoji: "\u03BB"        },
  "Java":       { primary: "#B07219", light: "#F2E6D0", dark: "#7A4F12", emoji: "\u2615"        },
  "JavaScript": { primary: "#F0DB4F", light: "#FDF6D4", dark: "#B8A530", emoji: "\uD83D\uDFE1"  },
  "Kotlin":     { primary: "#A97BFF", light: "#EDE0FF", dark: "#7B52CC", emoji: "\uD83D\uDFE3"  },
  "Lua":        { primary: "#000080", light: "#D4D4F0", dark: "#000058", emoji: "\uD83C\uDF19"  },
  "Perl":       { primary: "#39457E", light: "#DBDEED", dark: "#252D54", emoji: "\uD83D\uDC2A"  },
  "PHP":        { primary: "#777BB4", light: "#E4E5F1", dark: "#52567D", emoji: "\uD83D\uDC18"  },
  "Python":     { primary: "#3776AB", light: "#D8E7F2", dark: "#265380", emoji: "\uD83D\uDC0D"  },
  "Ruby":       { primary: "#CC342D", light: "#F5D5D3", dark: "#8E241F", emoji: "\uD83D\uDC8E"  },
  "Rust":       { primary: "#DEA584", light: "#F7EBDF", dark: "#A0725A", emoji: "\uD83E\uDD80"  },
  "Swift":      { primary: "#F05138", light: "#FCD9D3", dark: "#B03525", emoji: "\uD83D\uDC26"  },
  "TypeScript": { primary: "#3178C6", light: "#D8E5F5", dark: "#1F5399", emoji: "\uD83D\uDD35"  },
  "Zig":        { primary: "#F7A41D", light: "#FDE9C7", dark: "#B07615", emoji: "\u26A1"        },
};

const DEFAULT_COLOR: LanguageColor = {
  primary: "#999999",
  light: "#EEEEEE",
  dark: "#666666",
  emoji: "\u2753",
};

export function getColor(language: string): LanguageColor {
  return LANGUAGE_COLORS[language] ?? DEFAULT_COLOR;
}

export function getEntryColor(entry: { language: string }): LanguageColor {
  return getColor(entry.language);
}

export function colorToCssVars(color: LanguageColor): Record<string, string> {
  return {
    "--lang-primary": color.primary,
    "--lang-light": color.light,
    "--lang-dark": color.dark,
  };
}

export function textColorOn(background: string): string {
  const hex = background.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#1a1a2e" : "#ffffff";
}
