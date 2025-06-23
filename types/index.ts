/**
 * Shared type definitions for the PlantKeeper application
 * 
 * This file contains common type definitions used throughout the application.
 * Place shared types here to avoid duplication and ensure consistency.
 */

/**
 * Common API response types
 */
export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export type ErrorResponse = {
  success: false;
  message: string;
  code: string;
  details?: Record<string, unknown>;
};

/**
 * Authentication related types
 */
export type AuthToken = {
  token: string;
  expires: number; // Timestamp when the token expires
};

/**
 * Weather API types
 */
export type WeatherInfo = {
  location: string;
  temperature: number;
  humidity: number;
  description: string;
  icon: string;
  timestamp: number;
};

export type ForecastDay = {
  date: string;
  maxTemp: number;
  minTemp: number;
  description: string;
  icon: string;
  precipitation: number;
};

export type Forecast = {
  location: string;
  days: ForecastDay[];
};

/**
 * Plant care related types
 */
export type CareAction = 'watering' | 'fertilizing' | 'repotting' | 'pruning' | 'other';

export type CareEvent = {
  id: number;
  plantId: number;
  action: CareAction;
  date: string;
  notes?: string;
};

export type PlantListItem = {
  id: number;
  name: string;
  species?: string;
  imageUrl?: string;
  nextCareDate?: string; // Next care action due date
  isFavorite: boolean;
};

/**
 * UI related types
 */
export type ThemeMode = 'light' | 'dark' | 'system';

export type AlertType = 'success' | 'info' | 'warning' | 'error';

export type Alert = {
  type: AlertType;
  message: string;
  timeout?: number;
};
