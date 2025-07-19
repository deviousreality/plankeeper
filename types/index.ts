/**
 * Shared type definitions for the PlantKeeper application
 *
 * This file contains common type definitions used throughout the application.
 * Place shared types here to avoid duplication and ensure consistency.
 */

export * from './plant-models';
export * from './database';

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
 * Plant and inventory related types
 */
export type PlantSpecies = {
  id: number;
  name: string;
};

export type PlantGenus = {
  id: number;
  name: string;
  familyId: number;
};

export type PlantFamily = {
  id: number;
  name: string;
};

export type MarketPrice = {
  id: number;
  plantId: number;
  dateChecked: string;
  price: number;
};

export type PropagationType = 1 | 2 | 3; // 1 = seed, 2 = cutting, 3 = division (or define an enum)

export type PlantPropagation = {
  id: number;
  plantId: number;
  propType?: PropagationType;
  seedSource?: string;
  cuttingSource?: string;
  propDate?: string;
  initialCount?: number;
  currentCount?: number;
  transplantDate?: string;
  notes?: string;
  zeroCoutNotes?: string;
};

export type PlantInventory = {
  id: number;
  plantId: number;
  quantity?: number;
  plantAge?: number;
  plantSize?: number;
  lastWateredDate?: string;
  lastFertilizedDate?: string;
  location?: string;
  notes?: string;
  acquisitionDate?: string;
  status?: string;
  dateDeath?: string;
  causeOfDeath?: string;
  deathNotes?: string;
  deathLocation?: string;
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
  canSell?: boolean;
  isPersonal?: boolean;
  commonName?: string;
  flowerColor?: string;
  variety?: string;
  lightPref?: string;
  waterPref?: string;
  soilType?: string;
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
