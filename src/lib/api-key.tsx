import { CONFIG_KEYS } from './config-utils';

/**
 * @deprecated Use getApiKey from config-utils.ts instead
 * This function is kept for backward compatibility
 */
export function getApiKey(): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(CONFIG_KEYS.API_KEY) ?? null;
  } catch {
    // no-op
  }

  return null;
}
