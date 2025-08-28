export const Colors = {
  primary: {
    25: "#f0f9ff",
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6", // Main color (Color from Figma)
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },

  neutral: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
  },

  success: {
    25: "#f0fdf4",
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
  },

  warning: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fed7aa",
    300: "#fdba74",
    400: "#fb923c",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
  },

  error: {
    25: "#fef2f2",
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
  },

  emergency: {
    50: "#fdf2f8",
    100: "#fce7f3",
    500: "#ec4899",
    600: "#db2777",
    700: "#be185d",
  },

  purple: {
    50: "#faf5ff",
    100: "#f3e8ff",
    200: "#e9d5ff",
    300: "#d8b4fe",
    400: "#c084fc",
    500: "#a855f7",
    600: "#9333ea",
    700: "#7c3aed",
  },

  weather: {
    sunny: "#fbbf24",
    cloudy: "#9ca3af",
    rainy: "#3b82f6",
    stormy: "#6366f1",
    snow: "#e5e7eb",
  },

  background: "#ffffff",
  surface: "#f8fafc",
  border: "#e2e8f0",
  text: {
    primary: "#1e293b",
    secondary: "#64748b",
    disabled: "#94a3b8",
    inverse: "#ffffff",
  },

  tabBar: {
    background: "#ffffff",
    border: "#e2e8f0",
    active: "#2563eb",
    inactive: "#64748b",
  },
};

export const AppColors = {
  primary: Colors.primary[600],
  primaryLight: Colors.primary[500],
  primaryDark: Colors.primary[700],
  textPrimary: Colors.text.primary,
  textSecondary: Colors.text.secondary,
  textDisabled: Colors.text.disabled,
  background: Colors.background,
  surface: Colors.surface,
  border: Colors.border,
  success: Colors.success[600],
  warning: Colors.warning[600],
  error: Colors.error[600],
  emergency: Colors.emergency[600],
};

export default Colors;
