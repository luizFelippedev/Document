// frontend/src/utils/storage.ts

/**
 * Save data to localStorage
 */
export const saveToStorage = <T>(key: string, data: T): void => {
  try {
    if (typeof window === 'undefined') return;
    
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
  } catch (error) {
    console.error(`Error saving to localStorage: ${error}`);
  }
};

/**
 * Get data from localStorage
 */
export const getFromStorage = <T>(key: string): T | null => {
  try {
    if (typeof window === 'undefined') return null;
    
    const serializedData = localStorage.getItem(key);
    
    if (!serializedData) return null;
    
    return JSON.parse(serializedData) as T;
  } catch (error) {
    console.error(`Error getting from localStorage: ${error}`);
    return null;
  }
};

/**
 * Remove data from localStorage
 */
export const removeFromStorage = (key: string): void => {
  try {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage: ${error}`);
  }
};

/**
 * Clear all data from localStorage
 */
export const clearStorage = (): void => {
  try {
    if (typeof window === 'undefined') return;
    
    localStorage.clear();
  } catch (error) {
    console.error(`Error clearing localStorage: ${error}`);
  }
};

/**
 * Save data to sessionStorage
 */
export const saveToSessionStorage = <T>(key: string, data: T): void => {
  try {
    if (typeof window === 'undefined') return;
    
    const serializedData = JSON.stringify(data);
    sessionStorage.setItem(key, serializedData);
  } catch (error) {
    console.error(`Error saving to sessionStorage: ${error}`);
  }
};

/**
 * Get data from sessionStorage
 */
export const getFromSessionStorage = <T>(key: string): T | null => {
  try {
    if (typeof window === 'undefined') return null;
    
    const serializedData = sessionStorage.getItem(key);
    
    if (!serializedData) return null;
    
    return JSON.parse(serializedData) as T;
  } catch (error) {
    console.error(`Error getting from sessionStorage: ${error}`);
    return null;
  }
};

/**
 * Remove data from sessionStorage
 */
export const removeFromSessionStorage = (key: string): void => {
  try {
    if (typeof window === 'undefined') return;
    
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from sessionStorage: ${error}`);
  }
};

/**
 * Clear all data from sessionStorage
 */
export const clearSessionStorage = (): void => {
  try {
    if (typeof window === 'undefined') return;
    
    sessionStorage.clear();
  } catch (error) {
    console.error(`Error clearing sessionStorage: ${error}`);
  }
};