import { Colors } from './Colors';

export const ALERT_COLORS = {
  severe_weather: Colors.error[600],
  weather_alerts: Colors.warning[600],
  safety_alerts: Colors.error[500],
  
  community_alerts: Colors.primary[600],
  help_needed: Colors.success[600],
  
  events: Colors.purple[600],
  announcements: Colors.primary[500],
  questions: Colors.neutral[600],
  
  help_offer: Colors.success[600],
  lost_found: Colors.warning[600],
  general: Colors.primary[600],
} as const;

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

export const PRIORITY_COLORS = {
  urgent: Colors.error[600],
  high: Colors.warning[600], 
  normal: Colors.primary[600],
  low: Colors.neutral[500],
} as const;

export const getAlertColor = (type: keyof typeof ALERT_COLORS): string => {
  return ALERT_COLORS[type] || ALERT_COLORS.general;
};

export const getAlertBackground = (type: keyof typeof ALERT_BACKGROUNDS): string => {
  return ALERT_BACKGROUNDS[type] || ALERT_BACKGROUNDS.general;
};

export const getAlertBorder = (type: keyof typeof ALERT_BORDERS): string => {
  return ALERT_BORDERS[type] || ALERT_BORDERS.general;
};

export const getAlertLabel = (type: keyof typeof ALERT_LABELS): string => {
  return ALERT_LABELS[type] || 'Alert';
};

export const getPriorityColor = (priority: keyof typeof PRIORITY_COLORS): string => {
  return PRIORITY_COLORS[priority] || PRIORITY_COLORS.normal;
};