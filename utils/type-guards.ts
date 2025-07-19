/**
 * Type checking utilities for the PlantKeeper application
 *
 * This module provides utility functions for type checking and validation
 * throughout the application.
 */

import type { CareAction } from '~/types';

/**
 * Type guard for checking if a value is a non-null object
 */
export const isObject = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object';
};

/**
 * Type guard for checking if a string is a valid CareAction
 */
export const isCareAction = (value: string): value is CareAction => {
  return ['watering', 'fertilizing', 'repotting', 'pruning', 'other'].includes(value);
};

/**
 * Type guard for checking if a value is a valid date string
 */
export const isDateString = (value: unknown): value is string => {
  if (typeof value !== 'string') {
    return false;
  }

  const date = new Date(value);
  return !isNaN(date.getTime());
};

/**
 * Type guard to check if a value is a number or can be parsed as a number
 */
export const isNumeric = (value: unknown): value is number | string => {
  if (typeof value === 'number') return true;
  if (typeof value !== 'string') return false;
  return !isNaN(parseFloat(value)) && isFinite(Number(value));
};

/**
 * Convert unknown value to a string if possible, or return a default
 */
export const ensureString = (value: unknown, defaultValue = ''): string => {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  return String(value);
};

/**
 * Parse value as a number if possible, or return a default
 */
export const ensureNumber = (value: unknown, defaultValue = 0): number => {
  if (isNumeric(value)) {
    return Number(value);
  }

  return defaultValue;
};

/**
 * Ensure value is a boolean
 */
export const ensureBoolean = (value: unknown, defaultValue = false): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const lowercased = value.toLowerCase();
    if (lowercased === 'true' || lowercased === '1' || lowercased === 'yes') {
      return true;
    }
    if (lowercased === 'false' || lowercased === '0' || lowercased === 'no') {
      return false;
    }
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return defaultValue;
};
