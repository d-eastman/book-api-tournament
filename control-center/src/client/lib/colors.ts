// Re-export the shared color system
export {
  LANGUAGE_COLORS,
  getColor,
  getEntryColor,
  colorToCssVars,
  textColorOn,
} from "@shared/colors";
export type { LanguageColor } from "@shared/colors";

import { getColor } from "@shared/colors";

// Backward-compatible helper that returns just the primary hex string
export function getLanguageColor(language: string): string {
  return getColor(language).primary;
}
