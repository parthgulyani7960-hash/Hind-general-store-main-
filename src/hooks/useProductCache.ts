import { useState, useEffect, useCallback } from 'react';
import { Product } from '../types';

export interface CachedProductEntry {
  product: Product;
  accessCount: number;
  lastAccessedAt: number;
}

const CACHE_KEY = 'hgs_frequently_accessed_products';
const MAX_CACHE_SIZE = 40; // Max items to keep in localStorage

export function useProductCache() {
  const [cachedEntries, setCachedEntries] = useState<CachedProductEntry[]>(() => {
    try {
      const saved = localStorage.getItem(CACHE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse cached products from localStorage:', e);
      return [];
    }
  });

  // Track product access
  const trackProductAccess = useCallback((product: Product) => {
    if (!product || !product.id) return;
    
    setCachedEntries((prev) => {
      const productId = String(product.id);
      const existingIndex = prev.findIndex((entry) => String(entry.product.id) === productId);
      let updated: CachedProductEntry[];

      if (existingIndex !== -1) {
        // Increment access count and update timestamp
        const existing = prev[existingIndex];
        const updatedEntry: CachedProductEntry = {
          ...existing,
          product: { ...existing.product, ...product }, // Keep product details updated
          accessCount: existing.accessCount + 1,
          lastAccessedAt: Date.now(),
        };
        updated = [...prev];
        updated[existingIndex] = updatedEntry;
      } else {
        // Add new entry
        const newEntry: CachedProductEntry = {
          product,
          accessCount: 1,
          lastAccessedAt: Date.now(),
        };
        updated = [newEntry, ...prev];
      }

      // Constrain size with LFU/LRU eviction: prioritize higher accessCount, then most recent lastAccessedAt
      if (updated.length > MAX_CACHE_SIZE) {
        updated.sort((a, b) => {
          if (b.accessCount !== a.accessCount) {
            return b.accessCount - a.accessCount; // Higher counts first
          }
          return b.lastAccessedAt - a.lastAccessedAt; // Newer first
        });
        updated = updated.slice(0, MAX_CACHE_SIZE);
      }

      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save frequently accessed products to localStorage:', e);
      }
      return updated;
    });
  }, []);

  // Retrieve cached product detail by ID (offline fallback)
  const getCachedProduct = useCallback((id: string | number): Product | undefined => {
    const entry = cachedEntries.find((e) => String(e.product.id) === String(id));
    return entry?.product;
  }, [cachedEntries]);

  // Return list of cached products, ordered by frequency
  const getFrequentlyAccessedProducts = useCallback((): Product[] => {
    const sorted = [...cachedEntries].sort((a, b) => {
      if (b.accessCount !== a.accessCount) {
        return b.accessCount - a.accessCount;
      }
      return b.lastAccessedAt - a.lastAccessedAt;
    });
    return sorted.map((e) => e.product);
  }, [cachedEntries]);

  // Clear cache
  const clearProductCache = useCallback(() => {
    try {
      localStorage.removeItem(CACHE_KEY);
      setCachedEntries([]);
    } catch (e) {
      console.error('Failed to clear product cache:', e);
    }
  }, []);

  return {
    cachedEntries,
    trackProductAccess,
    getCachedProduct,
    getFrequentlyAccessedProducts,
    clearProductCache,
  };
}
