export interface LocationPermissionsWithChoice {
  foreground: "granted" | "denied" | "undetermined";
  background: "granted" | "denied" | "undetermined";
  lastUpdated?: string;
  userChoice: "always" | "while-using" | "never" | "cancelled";
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  emergencyAlerts: boolean;
  weatherAlerts: boolean;
  communityUpdates: boolean;
  postReactions: boolean;
  comments: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface LocationPermissions {
  foreground: "granted" | "denied" | "undetermined";
  background: "granted" | "denied" | "undetermined";
  lastUpdated?: string;
}

export interface LocationPreferences {
  useCurrentLocationForWeather: boolean;
  useCurrentLocationForAlerts: boolean;
  allowBackgroundLocation: boolean;
  shareLocationInPosts: boolean;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profileImageUrl?: string;
  bio?: string;
  homeCity?: string | null;
  homeState?: string | null;
  homeZipCode?: string | null;
  homeAddress?: string | null;
  homeLatitude?: number;
  homeLongitude?: number;
  locationRadiusMiles?: number;
  showCityOnly: boolean;
  locationCity?: string;
  addressState?: string;
  zipCode?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  locationPermissions?: LocationPermissions;
  locationPreferences?: LocationPreferences;
  emailVerified: boolean;
  isActive: boolean;
  isTestingUser?: boolean;
  apiRateLimit?: number;
  dailyApiCalls?: number;
  lastApiReset?: string;
  notificationPreferences: NotificationPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: number;
  userId: number;
  title?: string;
  content: string;
  postType:
    | "help_request"
    | "help_offer"
    | "lost_found"
    | "safety_alert"
    | "general"
    | "question"
    | "event"
    | "announcement"
    | "weather_alert";
  priority: "low" | "normal" | "high" | "urgent";
  locationCity?: string;
  locationState?: string;
  locationCounty?: string;
  latitude?: number;
  longitude?: number;
  images: string[];
  tags: string[];
  isEmergency: boolean;
  isResolved: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;

  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  reactionCount?: number;
  commentCount?: number;
  userReaction?: string | null;
  likeCount?: number;
}

export interface Comment {
  id: number;
  postId: number;
  userId: number;
  content: string;
  parentCommentId?: number;
  images: string[];
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;

  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  reactionCount?: number;
  userReaction?: string | null;
  replies?: Comment[];
}

export interface WeatherData {
  temperature: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  visibility: number;
  pressure: number;
  uvIndex: number;
  cloudCover: number;
  location: {
    city: string;
    state: string;
    country: string;
  };
  timestamp: string;
  current?: {
    temperature: number;
    condition: string;
    description: string;
    humidity: number;
    windSpeed: number;
    windDirection?: string;
    shortForecast?: string;
  };
  forecast?: Array<{
    name: string;
    temperature: number;
    temperatureUnit: string;
    shortForecast: string;
    windSpeed: string;
    windDirection: string;
    isDaytime: boolean;
  }>;
}

export interface Alert {
  id: number;
  title: string;
  description: string;
  severity: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  alertType: string;
  startTime?: string;
  endTime?: string;
  isActive: boolean;
  metadata?: {
    areaDesc?: string;
    [key: string]: unknown;
  };
  createdAt: string;
  updatedAt: string;
  coordinates?: number[][];
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  notificationType: string;
  relatedPostId?: number;
  relatedUserId?: number;
  relatedCommentId?: number;
  relatedConversationId?: number;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  recipientId: number;
  content: string;
  messageType: "text" | "image";
  images: string[];
  isRead: boolean;
  readAt?: string;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  sender?: {
    id: number;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
}

export interface Conversation {
  id: number;
  lastMessageAt: string;
  unreadCount: number;
  otherUser: {
    id: number;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  lastMessage?: {
    content: string;
    senderId: number;
    messageType: string;
    createdAt: string;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface CreatePostForm {
  title?: string;
  content: string;
  postType: Post["postType"];
  priority: Post["priority"];
  isEmergency: boolean;
  images: string[];
  tags: string[];
}

export interface SearchFilters {
  city?: string;
  state?: string;
  types?: string[];
  priorities?: string[];
  dateFrom?: string;
  dateTo?: string;
  emergencyOnly?: boolean;
  resolved?: "all" | "resolved" | "unresolved";
  sortBy?: "relevance" | "date" | "popularity";
}

export interface Location {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  address?: string;
}

export interface TabParamList {
  index: undefined;
  weather: undefined;
  create: undefined;
  alerts: undefined;
  profile: undefined;
}

export interface AuthParamList {
  login: undefined;
  register: undefined;
  "forgot-password": undefined;
  "verify-code": { email: string };
  "reset-password": { email: string; code: string };
}

export interface AppState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export const POST_TYPES = {
  HELP_REQUEST: "help_request" as const,
  HELP_OFFER: "help_offer" as const,
  LOST_FOUND: "lost_found" as const,
  SAFETY_ALERT: "safety_alert" as const,
  GENERAL: "general" as const,
};

export const PRIORITIES = {
  LOW: "low" as const,
  NORMAL: "normal" as const,
  HIGH: "high" as const,
  URGENT: "urgent" as const,
};

export const REACTION_TYPES = {
  LIKE: "like" as const,
  LOVE: "love" as const,
  HELPFUL: "helpful" as const,
  CONCERNED: "concerned" as const,
  ANGRY: "angry" as const,
};

export interface UserFeedback {
  id?: number;
  userId: number;
  feedbackType: "bug_report" | "feature_request" | "general_feedback" | "ui_ux_feedback";
  title: string;
  description: string;
  priority: "low" | "normal" | "high";
  status?: "new" | "in_review" | "addressed" | "closed";
  appVersion?: string;
  deviceInfo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type PostType = (typeof POST_TYPES)[keyof typeof POST_TYPES];
export type Priority = (typeof PRIORITIES)[keyof typeof PRIORITIES];

export const POST_TYPE_OPTIONS = Object.values(POST_TYPES) as PostType[];
export const PRIORITY_OPTIONS = Object.values(PRIORITIES) as Priority[];
