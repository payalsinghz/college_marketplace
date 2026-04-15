import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { token } = useContext(AuthContext);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  // Local-only wishlist for mock/hardcoded items (session memory, not persisted to DB)
  const [mockWishlistIds, setMockWishlistIds] = useState(new Set());

  const fetchWishlistIds = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get('http://localhost:5000/api/wishlist/ids', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWishlistIds(new Set(res.data));
    } catch (err) {
      console.error('Failed to fetch wishlist IDs', err);
    }
  }, [token]);

  useEffect(() => {
    fetchWishlistIds();
  }, [fetchWishlistIds]);

  const toggleWishlist = async (itemId) => {
    if (!token) return;
    const idStr = itemId?.toString();

    // Handle mock items locally (no backend call needed)
    if (idStr?.startsWith('mock')) {
      setMockWishlistIds(prev => {
        const next = new Set(prev);
        if (next.has(idStr)) next.delete(idStr);
        else next.add(idStr);
        return next;
      });
      return;
    }

    // Real DB items — persist to backend
    try {
      const res = await axios.post(`http://localhost:5000/api/wishlist/toggle/${itemId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWishlistIds(new Set(res.data.wishlist));
    } catch (err) {
      console.error('Failed to toggle wishlist', err);
    }
  };

  const isSaved = (itemId) => {
    const idStr = itemId?.toString();
    if (idStr?.startsWith('mock')) return mockWishlistIds.has(idStr);
    return wishlistIds.has(idStr);
  };

  // Total count including mock saved items
  const totalSaved = wishlistIds.size + mockWishlistIds.size;

  return (
    <WishlistContext.Provider value={{ wishlistIds, mockWishlistIds, toggleWishlist, isSaved, fetchWishlistIds, totalSaved }}>
      {children}
    </WishlistContext.Provider>
  );
};

