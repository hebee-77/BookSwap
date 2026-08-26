import { toast } from 'sonner';
import type { ApiErrorResponse } from '../types/api';

// Timestamp cache to deduplicate simultaneous toast triggers
let lastToastMessage = '';
let lastToastTime = 0;
const DEDUPLICATION_INTERVAL_MS = 600;

/**
 * Extracts a clean, human-readable error message from any API error.
 */
export function getErrorMessage(error: unknown, fallback = 'An unexpected error occurred. Please try again.'): string {
  if (!error) {
    return fallback;
  }

  // If it's already a string
  if (typeof error === 'string') {
    return error.trim() || fallback;
  }

  const err = error as any;

  // 1. Structured backend response: response.data.message
  if (err.response?.data) {
    const data: ApiErrorResponse = err.response.data;

    if (data.message && typeof data.message === 'string' && data.message.trim().length > 0) {
      return data.message.trim();
    }

    // If validationErrors object exists and message was generic
    if (data.validationErrors && typeof data.validationErrors === 'object') {
      const firstKey = Object.keys(data.validationErrors)[0];
      if (firstKey && data.validationErrors[firstKey]) {
        return data.validationErrors[firstKey];
      }
    }
  }

  // 2. HTTP Status-specific default messages when body is empty
  if (err.response?.status) {
    switch (err.response.status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Authentication required. Please log in to continue.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This operation conflicts with an existing record.';
      case 500:
        return 'A server error occurred. Please try again later.';
      default:
        break;
    }
  }

  // 3. Network or connection errors
  if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  // 4. Standard JavaScript Error with message (filter out raw AxiosError titles)
  if (err.message && typeof err.message === 'string') {
    const msg = err.message.trim();
    if (!msg.startsWith('Request failed with status') && !msg.startsWith('AxiosError') && msg !== '[object Object]') {
      return msg;
    }
  }

  return fallback;
}

/**
 * Extracts field-level validation errors from the backend response.
 */
export function getFieldErrors(error: unknown): Record<string, string> | undefined {
  const err = error as any;
  if (err?.response?.data?.validationErrors && typeof err.response.data.validationErrors === 'object') {
    return err.response.data.validationErrors;
  }
  return undefined;
}

/**
 * Displays a Sonner error toast with deduplication.
 */
export function showErrorToast(error: unknown, fallback?: string): void {
  const message = getErrorMessage(error, fallback);
  const now = Date.now();

  if (message === lastToastMessage && now - lastToastTime < DEDUPLICATION_INTERVAL_MS) {
    return;
  }

  lastToastMessage = message;
  lastToastTime = now;
  toast.error(message);
}

/**
 * Displays a Sonner success toast.
 */
export function showSuccessToast(message: string): void {
  toast.success(message);
}

/**
 * Displays a Sonner warning toast.
 */
export function showWarningToast(message: string): void {
  toast.warning(message);
}

/**
 * Displays a Sonner info toast.
 */
export function showInfoToast(message: string): void {
  toast.info(message);
}
