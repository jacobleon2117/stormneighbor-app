import { Colors } from './Colors';

// Standardized alert type colors used across the entire app
// These colors should be consistent on all screens (home, alerts, weather, notifications, etc.)
export const ALERT_COLORS = {
  // Weather & Safety
  severe_weather: Colors.error[600],        // Red - Critical/dangerous
  weather_alerts: Colors.warning[600],      // Orange - Weather warnings
  safety_alerts: Colors.error[500],         // Red - Safety concerns
  
  // Community & Help
  community_alerts: Colors.primary[600],    // Blue - General community
  help_needed: Colors.success[600],         // Green - Help requests
  
  // Events & Communication
  events: Colors.purple[600],               // Purple - Events
  announcements: Colors.primary[500],       // Blue - Announcements
  questions: Colors.neutral[600],           // Gray - Questions
  
  // Legacy support for post types
  help_offer: Colors.success[600],          // Green - Help offers
  lost_found: Colors.warning[600],          // Yellow - Lost & found
  general: Colors.primary[600],             // Blue - General posts
} as const;

// Alert type to display name mapping
export const ALERT_LABELS = {
  severe_weather: 'Severe Weather',
  weather_alerts: 'Weather Alert',
  safety_alerts: 'Safety Alert',
  community_alerts: 'Community Alert',
  help_needed: 'Help Needed',
  events: 'Event',
  announcements: 'Announcement',
  questions: 'Question',
  help_offer: 'Help Offer',
  lost_found: 'Lost & Found',
  general: 'General',
} as const;

// Alert type to background color mapping (with transparency)
export const ALERT_BACKGROUNDS = {
  severe_weather: Colors.error[50],
  weather_alerts: Colors.warning[50], 
  safety_alerts: Colors.error[50],
  community_alerts: Colors.primary[50],
  help_needed: Colors.success[50],
  events: Colors.purple[50],
  announcements: Colors.primary[50],
  questions: Colors.neutral[50],
  help_offer: Colors.success[50],
  lost_found: Colors.warning[50],
  general: Colors.primary[50],
} as const;

// Alert type to border color mapping
export const ALERT_BORDERS = {
  severe_weather: Colors.error[200],
  weather_alerts: Colors.warning[200],
  safety_alerts: Colors.error[200], 
  community_alerts: Colors.primary[200],
  help_needed: Colors.success[200],
  events: Colors.purple[200],
  announcements: Colors.primary[200],
  questions: Colors.neutral[200],
  help_offer: Colors.success[200],
  lost_found: Colors.warning[200],
  general: Colors.primary[200],
} as const;

// Priority level colors (for posts and alerts)
export const PRIORITY_COLORS = {
  urgent: Colors.error[600],
  high: Colors.warning[600], 
  normal: Colors.primary[600],
  low: Colors.neutral[500],
} as const;

// Helper function to get alert color
export const getAlertColor = (type: keyof typeof ALERT_COLORS): string => {
  return ALERT_COLORS[type] || ALERT_COLORS.general;
};

// Helper function to get alert background color
export const getAlertBackground = (type: keyof typeof ALERT_BACKGROUNDS): string => {
  return ALERT_BACKGROUNDS[type] || ALERT_BACKGROUNDS.general;
};

// Helper function to get alert border color
export const getAlertBorder = (type: keyof typeof ALERT_BORDERS): string => {
  return ALERT_BORDERS[type] || ALERT_BORDERS.general;
};

// Helper function to get alert label
export const getAlertLabel = (type: keyof typeof ALERT_LABELS): string => {
  return ALERT_LABELS[type] || 'Alert';
};

// Helper function to get priority color
export const getPriorityColor = (priority: keyof typeof PRIORITY_COLORS): string => {
  return PRIORITY_COLORS[priority] || PRIORITY_COLORS.normal;
};