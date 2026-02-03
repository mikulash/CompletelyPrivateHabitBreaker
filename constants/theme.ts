/**
 * Material Design 3 Theme Configuration
 * 
 * This file contains the M3 color tokens and design tokens for the app.
 * Following M3 dark theme guidelines for proper contrast and accessibility.
 */

export const M3Colors = {
    // Surface colors (dark grey, not pure black per M3 guidelines)
    surface: '#1C1B1F',
    surfaceContainer: '#211F26',
    surfaceContainerHigh: '#2B2930',
    surfaceContainerLow: '#1D1B20',
    surfaceBright: '#3B383E',

    // Primary (teal/mint - app identity color, desaturated for dark theme)
    primary: '#7DD6C0',
    onPrimary: '#00382B',
    primaryContainer: '#005140',
    onPrimaryContainer: '#9AF2DB',

    // Secondary (purple accent)
    secondary: '#CCC2DC',
    onSecondary: '#332D41',
    secondaryContainer: '#4A4458',
    onSecondaryContainer: '#E8DEF8',

    // Tertiary (warm orange tones for dose decrease tracker)
    tertiary: '#FFB77C',
    onTertiary: '#4A2800',
    tertiaryContainer: '#6A3C00',
    onTertiaryContainer: '#FFDCBE',

    // Text and content colors
    onSurface: '#E6E1E5',
    onSurfaceVariant: '#CAC4D0',

    // Custom "Vibrant" Expressive colors - saturated versions for High-Emphasis backgrounds
    vibrantTeal: '#00D6A0', // Brighter teal for active hero states
    vibrantOrange: '#FF9E44', // Brighter orange for active dose hero states
    vibrantPurple: '#D0BCFF', // Pop secondary

    // Borders and outlines
    outline: '#938F99',
    outlineVariant: '#49454F',

    // Error states
    error: '#F2B8B5',
    onError: '#601410',
    errorContainer: '#8C1D18',
    onErrorContainer: '#F9DEDC',

    // Scrim/overlay
    scrim: '#000000',
} as const;

export const M3Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 48,  // For expressive spacing
    massive: 64, // For graphic separation
} as const;

export const M3Radius = {
    none: 0,
    extraSmall: 4,
    small: 8,
    medium: 12,
    large: 16,
    extraLarge: 28,
    full: 9999,
    expressive: 24, // A distinct smooth curve for containers
} as const;

export const M3Elevation = {
    level0: 0,
    level1: 1,
    level2: 3,
    level3: 6,
    level4: 8,
    level5: 12,
} as const;

// Typography following M3 type scale + Expressive "Hero" sizes
export const M3Typography = {
    // Hero / Display - For "Macro" Typography moments
    heroLarge: { fontSize: 80, fontWeight: '300' as const, lineHeight: 88, letterSpacing: -2 },
    heroMedium: { fontSize: 64, fontWeight: '300' as const, lineHeight: 72, letterSpacing: -1 },
    // Standard M3 Display
    displayLarge: { fontSize: 57, fontWeight: '400' as const, lineHeight: 64, letterSpacing: -0.25 },
    displayMedium: { fontSize: 45, fontWeight: '400' as const, lineHeight: 52 },
    displaySmall: { fontSize: 36, fontWeight: '400' as const, lineHeight: 44 },

    headlineLarge: { fontSize: 32, fontWeight: '400' as const, lineHeight: 40 },
    headlineMedium: { fontSize: 28, fontWeight: '400' as const, lineHeight: 36 },
    headlineSmall: { fontSize: 24, fontWeight: '500' as const, lineHeight: 32 }, // Increased weight for clarity

    titleLarge: { fontSize: 22, fontWeight: '500' as const, lineHeight: 28 },
    titleMedium: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24, letterSpacing: 0.15 },
    titleSmall: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20, letterSpacing: 0.1 },

    bodyLarge: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24, letterSpacing: 0.5 },
    bodyMedium: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20, letterSpacing: 0.25 },
    bodySmall: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16, letterSpacing: 0.4 },

    labelLarge: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20, letterSpacing: 0.1 },
    labelMedium: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16, letterSpacing: 0.5 },
    labelSmall: { fontSize: 11, fontWeight: '600' as const, lineHeight: 16, letterSpacing: 0.5 },
} as const;

// Helper to create rgba from hex
export function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Helper to generate a "Tonal Surface" color (mixing primary with surface) for expressive backgrounds
// This simulates the M3 "Surface Tint" elevation effect but with more control
export function getTonalSurfaceColor(baseSurface: string, tintColor: string, levelWeight: number): string {
    // Simplified mixing logic for demo purposes (in a real app, use a color library)
    // Here we just return an RGBA overlay of the tint on top of the surface
    // For 'levelWeight', think of it as opacity: 0.05, 0.08, 0.11, etc.
    return hexToRgba(tintColor, levelWeight);
}

// Semantic color aliases for specific use cases
export const SemanticColors = {
    // Cold Turkey tracker theme
    coldTurkey: {
        accent: M3Colors.primary,
        accentContainer: M3Colors.primaryContainer,
        onAccentContainer: M3Colors.onPrimaryContainer,
        border: hexToRgba(M3Colors.primary, 0.5),
        progressBg: hexToRgba(M3Colors.primary, 0.2),
    },

    // Dose Decrease tracker theme
    doseDecrease: {
        accent: M3Colors.tertiary,
        accentContainer: M3Colors.tertiaryContainer,
        onAccentContainer: M3Colors.onTertiaryContainer,
        border: hexToRgba(M3Colors.tertiary, 0.5),
        progressBg: hexToRgba(M3Colors.tertiary, 0.2),
    },
} as const;
