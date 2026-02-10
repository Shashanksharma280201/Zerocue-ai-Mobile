// ZeroCue Brand Colors - From Landing Page
export const Colors = {
  // Cream Palette (Backgrounds & Neutrals)
  cream: {
    50: '#FDFCFB',
    100: '#F7F5F2',
    200: '#EDE9E3',
    300: '#E3DDD4',
    400: '#D9D1C5',
  },

  // Stone Palette (Text & Secondary Elements)
  stone: {
    DEFAULT: '#4A4A4A',
    light: '#6B6B6B',
    lighter: '#9E9E9E',
  },

  // Accent Colors (Brand & Highlights)
  accent: {
    sage: '#64B5F6',      // Soft blue
    terracotta: '#FFB6B9', // Pastel coral
    charcoal: '#4A4A4A',   // Charcoal gray
  },

  // Fashion Premium Colors (Quick Scan Feature)
  fashion: {
    ocean: '#4A90E2',         // Ocean Blue - Luxury primary
    oceanDark: '#2E5C8A',     // Deeper ocean
    oceanLight: '#7FB3E8',    // Sky blue
    skyBlue: '#B4D7FF',       // Soft Sky Blue - Accent
    skyBlueDark: '#90C4F5',   // Medium sky blue
    azure: '#64B5F6',         // Azure - Highlight
    azureDark: '#42A5F5',     // Deeper azure
    azureLight: '#90CAF9',    // Light azure
    sage: '#95B99C',          // Sage Green - Success
    charcoal: '#2C2C2C',      // Rich Charcoal
    softGray: '#F5F5F7',      // Soft Gray bg
    cream: '#FAF9F7',         // Warm Cream
  },

  // Semantic Colors (Soft Pastels)
  primary: '#64B5F6',        // Soft Blue
  primaryDark: '#42A5F5',
  primaryLight: '#90CAF9',
  primaryGradientStart: '#64B5F6',
  primaryGradientEnd: '#42A5F5',

  secondary: '#FFB6B9',      // Pastel Coral
  secondaryDark: '#FF9FA3',
  secondaryLight: '#FFCDCF',

  error: '#E57373',          // Soft Red
  errorLight: '#FFEBEE',     // Light Red Background
  success: '#81C784',        // Soft Green
  successLight: '#E8F5E9',   // Light Green Background
  warning: '#FFD54F',        // Soft Yellow
  info: '#64B5F6',           // Soft Blue

  // Backgrounds
  background: '#FFFFFF',         // Pure White
  backgroundSecondary: '#F5F5F5', // Light Gray
  surface: '#FAFAFA',            // Elevated surfaces
  surfaceElevated: '#FFFFFF',

  // Text Colors
  text: '#4A4A4A',           // Charcoal Gray
  textSecondary: '#757575',  // Medium Gray
  textLight: '#9E9E9E',      // Light Gray
  textMuted: '#BDBDBD',      // Disabled text

  // Borders
  border: '#E0E0E0',         // Light border
  borderLight: '#EEEEEE',    // Very light border

  // Base Colors
  white: '#FFFFFF',
  black: '#000000',

  // Shadows
  shadowColor: '#2C2C2C',    // charcoal

  // Shopping-Specific Colors
  cartBadge: '#FFB6B9',      // Pastel Coral
  inStock: '#81C784',        // Soft Green
  lowStock: '#FFD54F',       // Soft Yellow
  outOfStock: '#E57373',     // Soft Red

  // Status Colors
  status: {
    pending: '#FFD54F',      // Yellow
    confirmed: '#64B5F6',    // Blue
    preparing: '#C9A9E9',    // Lavender
    ready: '#81C784',        // Green
    completed: '#757575',    // Gray
    cancelled: '#E57373',    // Red
    expired: '#BDBDBD',      // Light Gray
  },

  // Category Colors
  category: {
    apparel: '#FFE5B4',      // Peach
    footwear: '#B4D7FF',     // Sky Blue
    accessories: '#FFB4D1',  // Pink
    electronics: '#E5C9FF',  // Lavender
    home: '#C9E5FF',         // Light Blue
    beauty: '#FFE5C9',       // Light Orange
  },

  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.5)',         // Dark overlay
  overlayLight: 'rgba(0, 0, 0, 0.2)',    // Light overlay
  glassBg: 'rgba(255, 255, 255, 0.9)',   // Glassmorphism

  transparent: 'transparent',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FontWeight = {
  light: '300' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// Typography scale for better hierarchy
export const Typography = {
  // Display - For hero sections
  display: {
    fontSize: 40,
    fontWeight: '700' as const,
    letterSpacing: -1.5,
    lineHeight: 48,
  },
  // H1 - Main headers
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -1,
    lineHeight: 40,
  },
  // H2 - Section headers
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  // H3 - Sub-headers
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  // Body Large - Important content
  bodyLarge: {
    fontSize: 18,
    fontWeight: '500' as const,
    letterSpacing: 0,
    lineHeight: 26,
  },
  // Body - Default text
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 24,
  },
  // Body Small - Secondary text
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 20,
  },
  // Caption - Labels and hints
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  // Button - Button text
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    lineHeight: 24,
  },
};

export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};
