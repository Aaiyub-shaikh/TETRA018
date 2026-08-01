/**
 * In-memory store to pass the backend upload result from the upload page
 * to the result/dashboard page without requiring a full state management library.
 *
 * This is stored on the module level so it persists across client-side navigation.
 */
import type { UploadResponse } from './api';

let _lastResult: UploadResponse | null = null;

export function setLastResult(result: UploadResponse): void {
  _lastResult = result;
}

export function getLastResult(): UploadResponse | null {
  return _lastResult;
}

export function clearLastResult(): void {
  _lastResult = null;
}
