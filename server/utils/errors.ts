/**
 * Custom error types and utilities for the PlantKeeper application
 */

// Represents an API error with status code
export type ApiError = Error & {
  statusCode: number;
  data?: Record<string, unknown>;
}

/**
 * Check if an error object is an API error with status code
 * @param error Any error object
 * @returns Whether the error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'statusCode' in error &&
    typeof (error as ApiError).statusCode === 'number'
  );
}

/**
 * Safe error handler that ensures error is properly typed
 * @param err Unknown error object
 * @param defaultMessage Default message to use if error doesn't have one
 * @returns Properly formatted API error
 */
export function handleError(err: unknown, defaultMessage = 'Server error'): ApiError {
  console.error('Error:', err);
  
  // If it's already an API error, just return it
  if (isApiError(err)) {
    return err;
  }
  
  // For regular Error objects, create an API error
  if (err instanceof Error) {
    const apiError: ApiError = new Error(err.message) as ApiError;
    apiError.statusCode = 500;
    apiError.stack = err.stack ?? '';
    return apiError;
  }
  
  // For anything else, create a generic error
  const apiError: ApiError = new Error(defaultMessage) as ApiError;
  apiError.statusCode = 500;
  return apiError;
}
