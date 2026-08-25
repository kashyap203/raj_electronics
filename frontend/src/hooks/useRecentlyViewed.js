import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'raj_electronics_recently_viewed';
const MAX_RECENTLY_VIEWED = 10;

export const useRecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Load initial data
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentlyViewed(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to parse recently viewed products', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Sync state with other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY) {
        try {
          const newVal = e.newValue ? JSON.parse(e.newValue) : [];
          if (Array.isArray(newVal)) {
            setRecentlyViewed(newVal);
          }
        } catch (err) {
          console.error('Error syncing recently viewed across tabs', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addRecentlyViewed = useCallback((productId) => {
    if (!productId) return;

    setRecentlyViewed((prev) => {
      // Remove the product if it already exists to avoid duplicates
      const filtered = prev.filter(id => id !== productId);
      
      // Add the product to the beginning
      const updated = [productId, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Error saving recently viewed product', err);
      }
      
      return updated;
    });
  }, []);

  const removeRecentlyViewed = useCallback((productId) => {
    if (!productId) return;

    setRecentlyViewed((prev) => {
      const updated = prev.filter(id => id !== productId);
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Error saving recently viewed products', err);
      }
      
      return updated;
    });
  }, []);

  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Error clearing recently viewed products', err);
    }
  }, []);

  return {
    recentlyViewed,
    addRecentlyViewed,
    removeRecentlyViewed,
    clearRecentlyViewed
  };
};

export default useRecentlyViewed;
