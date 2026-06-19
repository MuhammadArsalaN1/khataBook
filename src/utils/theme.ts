import { Theme } from '../types';
import { COLORS_LIGHT, COLORS_DARK } from '../constants';

/** Get color scheme based on theme. */
export function getColors(theme: Theme) {
  return theme === 'dark' ? COLORS_DARK : COLORS_LIGHT;
}

/** Check if using dark mode. */
export function isDark(theme: Theme): boolean {
  return theme === 'dark';
}
