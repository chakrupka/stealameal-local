import Config from 'react-native-config';
import { Platform } from 'react-native';

/**
 * API configuration that handles different environments
 * 
 * This uses react-native-config to get environment variables from .env files.
 * If BACKEND_URL is defined in the .env file, it uses that.
 * 
 * For local development:
 * - On Android emulator, localhost maps to 10.0.2.2
 * - On iOS simulator, localhost works normally
 * - On physical devices, you need to use the actual IP address of your computer
 */

// Default to localhost with proper mapping for Android emulator
let apiBaseUrl = Platform.OS === 'android' 
  ? 'http://10.0.2.2:9090/api' 
  : 'http://localhost:9090/api';

// Use environment variable if available (from .env file)
if (Config?.BACKEND_URL) {
  apiBaseUrl = `${Config.BACKEND_URL}/api`;
}

// Helper to check if a string is a valid URL
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

// Ensure URL has proper format
if (!isValidUrl(apiBaseUrl)) {
  console.warn(`Invalid API URL: ${apiBaseUrl}, falling back to localhost`);
  apiBaseUrl = Platform.OS === 'android' 
    ? 'http://10.0.2.2:9090/api' 
    : 'http://localhost:9090/api';
}

export const API_BASE_URL = apiBaseUrl;
export const USER_API_URL = `${apiBaseUrl}`;
export const SQUAD_API_URL = `${apiBaseUrl}/squads`;
export const PING_API_URL = `${apiBaseUrl}/pings`;
export const MEAL_API_URL = `${apiBaseUrl}/meals`;

// For debugging
console.log(`API Base URL: ${apiBaseUrl}`);