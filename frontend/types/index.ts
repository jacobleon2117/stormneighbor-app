export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profileImageUrl?: string;
  bio?: string;
  locationCity?: string;
  addressState?: string;
  zipCode?: string;
  address?: string;
  locationRadiusMiles?: number;
  showCityOnly: boolean;
  latitude?: number;
  longitude?: number;
  emailVerified: boolean;
  isActive: boolean;
  notificationPreferences: any;
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
    | "general";
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
  metadata?: any;
  createdAt: string;
  updatedAt: string;
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
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

export interface ApiResponse<T = any> {
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

export type PostType = keyof typeof POST_TYPES;
export type Priority = keyof typeof PRIORITIES;

export const POST_TYPE_OPTIONS = Object.keys(POST_TYPES) as PostType[];
export const PRIORITY_OPTIONS = Object.keys(PRIORITIES) as Priority[];
