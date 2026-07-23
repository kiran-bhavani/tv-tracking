/**
 * CacheManager: A utility to aggressively cache API responses in LocalStorage.
 * Includes a TTL (Time To Live) to automatically evict stale data, and handles
 * QuotaExceeded errors by gracefully clearing the cache.
 */

const CACHE_PREFIX = 'tvt_cache_';
const DEFAULT_TTL = 1000 * 60 * 60 * 24; // 24 hours in milliseconds

interface CacheItem<T> {
  timestamp: number;
  data: T;
}

export const cacheManager = {
  get: <T>(key: string): T | null => {
    if (typeof window === 'undefined') return null; // Safety for SSR

    try {
      const fullKey = `${CACHE_PREFIX}${key}`;
      const itemStr = localStorage.getItem(fullKey);
      
      if (!itemStr) return null;
      
      const item: CacheItem<T> = JSON.parse(itemStr);
      const now = Date.now();
      
      // If the cache is older than the TTL, delete it and return null
      if (now - item.timestamp > DEFAULT_TTL) {
        localStorage.removeItem(fullKey);
        return null;
      }
      
      return item.data;
    } catch (e) {
      console.warn("Failed to read from cache", e);
      return null;
    }
  },

  set: <T>(key: string, data: T): void => {
    if (typeof window === 'undefined') return;

    try {
      const fullKey = `${CACHE_PREFIX}${key}`;
      const item: CacheItem<T> = {
        timestamp: Date.now(),
        data,
      };
      localStorage.setItem(fullKey, JSON.stringify(item));
    } catch (e) {
      // If we hit the 5MB quota limit, clear our specific cache items and try one last time
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.warn("LocalStorage quota exceeded. Clearing cache...");
        cacheManager.clearAll();
        try {
          const fullKey = `${CACHE_PREFIX}${key}`;
          localStorage.setItem(fullKey, JSON.stringify({ timestamp: Date.now(), data }));
        } catch (retryError) {
          console.error("Failed to write to cache even after clearing", retryError);
        }
      }
    }
  },

  clearAll: (): void => {
    if (typeof window === 'undefined') return;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (e) {
      console.error("Failed to clear cache", e);
    }
  }
};
