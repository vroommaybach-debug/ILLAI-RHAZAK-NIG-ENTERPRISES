import { ThemeSettings } from '../types';

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  colors: {
    ink: '#05070d',
    surface: '#0a0e18',
    surfaceElevated: '#0f1524',
    text: '#f4f6fb',
    textMuted: '#9aa3b8',
    primaryBlue: '#2563ff',
    highlightBlue: '#38bdf8',
    signalRed: '#ef2b3a',
    accentGold: '#f5b93a',
    hairline: 'rgba(255,255,255,0.09)',
  },
  typography: {
    fontDisplay: '"Space Grotesk", system-ui, sans-serif',
    fontBody: '"Inter", system-ui, sans-serif',
    scale: 1,
  },
  layout: {
    containerWidthPx: 1200,
    radiusPx: 22,
  },
  motion: {
    level: 'full',
  },
  filters: {
    grainOpacity: 0.06,
    blurIntensity: 14,
  },
  version: 1,
};

/**
 * Applies theme settings as CSS custom properties on the document root at runtime.
 */
export function applyThemeTokens(
  theme: ThemeSettings = DEFAULT_THEME_SETTINGS,
  rootElement?: HTMLElement | null
): Record<string, string> {
  const tokenMap: Record<string, string> = {
    '--bg': theme.colors.ink,
    '--ink': theme.colors.text,
    '--muted': theme.colors.textMuted,
    '--line': theme.colors.hairline,
    '--blue': theme.colors.primaryBlue,
    '--blue2': theme.colors.highlightBlue,
    '--red': theme.colors.signalRed,
    '--gold': theme.colors.accentGold,
    '--radius': `${theme.layout.radiusPx}px`,
    '--display': theme.typography.fontDisplay,
    '--body': theme.typography.fontBody,
    '--color-ink': theme.colors.ink,
    '--color-surface': theme.colors.surface,
    '--color-surface-elevated': theme.colors.surfaceElevated,
    '--color-text': theme.colors.text,
    '--color-text-muted': theme.colors.textMuted,
    '--color-primary-blue': theme.colors.primaryBlue,
    '--color-highlight-blue': theme.colors.highlightBlue,
    '--color-signal-red': theme.colors.signalRed,
    '--color-accent-gold': theme.colors.accentGold,
    '--color-hairline': theme.colors.hairline,
    '--font-display': theme.typography.fontDisplay,
    '--font-body': theme.typography.fontBody,
    '--type-scale': String(theme.typography.scale),
    '--container-width': `${theme.layout.containerWidthPx}px`,
    '--radius-card': `${theme.layout.radiusPx}px`,
    '--grain-opacity': String(theme.filters.grainOpacity),
    '--blur-intensity': `${theme.filters.blurIntensity}px`,
    '--motion-level': theme.motion.level,
  };

  const target =
    rootElement ?? (typeof document !== 'undefined' ? document.documentElement : null);

  if (target) {
    for (const [key, value] of Object.entries(tokenMap)) {
      target.style.setProperty(key, value);
    }
    target.dataset.motion = theme.motion.level;
  }

  return tokenMap;
}
