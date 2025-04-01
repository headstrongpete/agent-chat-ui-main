/**
 * Configuration utility functions for managing app settings
 */

export const CONFIG_KEYS = {
  API_URL: "apiUrl",
  ASSISTANT_ID: "assistantId",
  API_KEY: "lg:chat:apiKey",
};

export const DEFAULT_CONFIG = {
  [CONFIG_KEYS.API_URL]: "https://ht-gargantuan-mountain-26-34792ec4a0105801868c7fe930ce140e.us.langgraph.app",
  [CONFIG_KEYS.ASSISTANT_ID]: "agent",
  [CONFIG_KEYS.API_KEY]: "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",
};

/**
 * Get the API key from local storage
 * @returns The API key or null if not set
 */
export function getApiKey(): string | null {
  const storedKey = localStorage.getItem(CONFIG_KEYS.API_KEY);
  return storedKey || DEFAULT_CONFIG[CONFIG_KEYS.API_KEY];
}

/**
 * Save the API key to local storage
 * @param key The API key to save
 */
export function setApiKey(key: string): void {
  localStorage.setItem(CONFIG_KEYS.API_KEY, key);
}

/**
 * Get all configuration values with fallbacks to defaults
 * @returns Object containing all configuration values
 */
export function getConfig(): { apiUrl: string, assistantId: string, apiKey: string } {
  return {
    apiUrl: localStorage.getItem(CONFIG_KEYS.API_URL) || DEFAULT_CONFIG[CONFIG_KEYS.API_URL],
    assistantId: localStorage.getItem(CONFIG_KEYS.ASSISTANT_ID) || DEFAULT_CONFIG[CONFIG_KEYS.ASSISTANT_ID],
    apiKey: getApiKey() || DEFAULT_CONFIG[CONFIG_KEYS.API_KEY],
  };
}

/**
 * Save configuration values to local storage
 * @param config Object containing configuration values to save
 */
export function setConfig(config: Partial<{ apiUrl: string, assistantId: string, apiKey: string }>): void {
  if (config.apiUrl) localStorage.setItem(CONFIG_KEYS.API_URL, config.apiUrl);
  if (config.assistantId) localStorage.setItem(CONFIG_KEYS.ASSISTANT_ID, config.assistantId);
  if (config.apiKey) setApiKey(config.apiKey);
  
  console.log('Config saved:', {
    apiUrl: config.apiUrl ? 'updated' : 'unchanged',
    assistantId: config.assistantId ? 'updated' : 'unchanged',
    apiKey: config.apiKey ? 'updated' : 'unchanged',
  });
}

/**
 * Check if configuration is valid and complete
 * @returns Object with validation results
 */
export function validateConfig(): { isValid: boolean, missingValues: string[] } {
  const config = getConfig();
  const missingValues = [];
  
  if (!config.apiUrl) missingValues.push(CONFIG_KEYS.API_URL);
  if (!config.assistantId) missingValues.push(CONFIG_KEYS.ASSISTANT_ID);
  
  return {
    isValid: missingValues.length === 0,
    missingValues
  };
} 