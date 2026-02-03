import { M3Colors } from './theme';

// M3 color scheme - dark theme only for this app
const tintColorDark = M3Colors.primary;

export default {
  light: {
    text: M3Colors.onSurface,
    background: M3Colors.surface,
    tint: tintColorDark,
    tabIconDefault: M3Colors.onSurfaceVariant,
    tabIconSelected: tintColorDark,
  },
  dark: {
    text: M3Colors.onSurface,
    background: M3Colors.surface,
    tint: tintColorDark,
    tabIconDefault: M3Colors.onSurfaceVariant,
    tabIconSelected: tintColorDark,
  },
};

// Re-export theme for direct access
export { hexToRgba, M3Colors, M3Radius, M3Spacing, M3Typography, SemanticColors } from './theme';

