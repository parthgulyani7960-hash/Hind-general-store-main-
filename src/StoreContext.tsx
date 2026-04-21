import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, CartItem, Product } from './types';
import toast from 'react-hot-toast';

interface StoreContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  cart: CartItem[];
  addToCart: (product: Product, variant?: any, quantity?: number) => void;
  removeFromCart: (productId: number, variantId?: number) => void;
  updateQuantity: (productId: number, delta: number, variantId?: number) => void;
  clearCart: () => void;
  logout: () => void;
  isMaintenance: boolean;
  setMaintenance: (val: boolean) => void;
  checkMaintenance: () => Promise<void>;
  authMode: 'otp' | 'password';
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  wishlist: number[];
  toggleWishlist: (productId: number) => void;
  config: any[];
  fetchConfig: () => Promise<void>;
  subscribeNewsletter: (email: string) => Promise<void>;
  vibration: boolean;
  setVibration: (val: boolean) => void;
  notifications: boolean;
  setNotifications: (val: boolean) => void;
  sound: boolean;
  setSound: (val: boolean) => void;
  adminTheme: string;
  setAdminTheme: (theme: string) => void;
  appliedCoupon: any;
  setAppliedCoupon: (coupon: any) => void;
  bulkDiscounts: any[];
  fetchBulkDiscounts: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [authMode, setAuthMode] = useState<'otp' | 'password'>('password');
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('hgs_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    checkAuth();
    checkMaintenance();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        // If session is invalid, clear local user
        setUser(null);
        localStorage.removeItem('hgs_user');
      }
    } catch (err) {
      console.error('Auth check failed');
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (err) {
      console.error('Failed to refresh user');
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, id: user.id })
      });
      const result = await res.json();
      if (result.success) {
        setUser(result.user);
        toast.success('Profile updated');
      } else {
        toast.error(result.message || 'Update failed');
      }
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  const subscribeNewsletter = async (email: string) => {
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, user_id: user?.id })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Subscribed to newsletter!');
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Subscription failed');
    }
  };

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoadedFromStorage, setCartLoadedFromStorage] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('hgs_cart');
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to parse cart from local storage', e);
    }
    setCartLoadedFromStorage(true);
  }, []);

  const [wishlist, setWishlist] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('hgs_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [config, setConfig] = useState<any[]>([]);
  const [vibration, setVibration] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('hgs_vibration');
      return saved ? JSON.parse(saved) : true;
    } catch (e) {
      return true;
    }
  });

  const [notifications, setNotifications] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('hgs_notifications');
      return saved ? JSON.parse(saved) : true;
    } catch (e) {
      return true;
    }
  });

  const [sound, setSound] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('hgs_sound');
      return saved ? JSON.parse(saved) : true;
    } catch (e) {
      return true;
    }
  });

  const [adminTheme, setAdminTheme] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('hgs_admin_theme');
      return saved || 'theme-emerald';
    } catch (e) {
      return 'theme-emerald';
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [bulkDiscounts, setBulkDiscounts] = useState<any[]>([]);

  const fetchBulkDiscounts = async () => {
    try {
      const res = await fetch('/api/bulk-discounts');
      const data = await res.json();
      setBulkDiscounts(data);
    } catch (err) {
      console.error('Failed to fetch bulk discounts');
    }
  };

  useEffect(() => {
    fetchBulkDiscounts();
  }, []);

  useEffect(() => {
    localStorage.setItem('hgs_vibration', JSON.stringify(vibration));
  }, [vibration]);

  useEffect(() => {
    localStorage.setItem('hgs_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('hgs_sound', JSON.stringify(sound));
  }, [sound]);

  useEffect(() => {
    localStorage.setItem('hgs_admin_theme', adminTheme);
    // Also save to server if admin
    if (user?.role === 'admin') {
      fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'admin_theme', value: adminTheme })
      }).catch(err => console.error('Failed to save theme to server:', err));
    }
  }, [adminTheme, user?.role]);

  useEffect(() => {
    localStorage.setItem('hgs_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    if (!cartLoadedFromStorage) return;
    localStorage.setItem('hgs_cart', JSON.stringify(cart));
    if (user) {
      fetch('/api/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, items: cart })
      }).catch(err => console.error('Failed to sync cart:', err));
    }
  }, [cart, user, cartLoadedFromStorage]);

  const fetchCart = async (userId: number) => {
    try {
      const res = await fetch(`/api/cart?userId=${userId}`);
      if (res.ok) {
        const items = await res.json();
        // Server wins on load
        if (items && items.length > 0) {
          setCart(items.map((i: any) => ({
            id: i.product_id,
            name: i.name,
            price: i.price,
            image_url: i.image_url,
            stock: i.stock,
            category: i.category,
            quantity: i.quantity
          })));
        }
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCart(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    if (cartLoadedFromStorage && cart.length === 0) {
      const hasSeeded = localStorage.getItem('hgs_seeded_cart');
      if (!hasSeeded) {
        // Add a default welcome product if available
        fetch('/api/products')
          .then(res => res.json())
          .then(products => {
            if (products && products.length > 0) {
              const welcomeProduct = products[0];
              addToCart(welcomeProduct, undefined, 1);
              localStorage.setItem('hgs_seeded_cart', 'true');
            }
          })
          .catch(err => console.error('Failed to seed default cart:', err));
      }
    }
  }, [cart.length, cartLoadedFromStorage]);

  useEffect(() => {
    localStorage.setItem('hgs_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const fetchConfig = async () => {
    // Now handled by checkMaintenance
  };

  const checkMaintenance = async () => {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok && res.status !== 503) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setIsMaintenance(!!data.maintenance);
      if (data.authMode) setAuthMode(data.authMode);
      if (data.config) {
        setConfig(data.config);
        const themeSetting = data.config.find((s: any) => s.key === 'admin_theme');
        if (themeSetting) setAdminTheme(themeSetting.value);
      }
    } catch (err) {
      console.error('Failed to check maintenance status:', err);
    }
  };

  useEffect(() => {
    checkAuth();
    checkMaintenance();
    // Poll every 30 seconds for fast updates
    const interval = setInterval(() => {
      checkMaintenance();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const addToCart = (product: Product, variant?: any, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => 
        item.id === product.id && 
        (variant ? item.selectedVariant?.id === variant.id : !item.selectedVariant)
      );
      if (existing) {
        return prev.map(item => 
          (item.id === product.id && (variant ? item.selectedVariant?.id === variant.id : !item.selectedVariant))
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      }
      return [...prev, { ...product, quantity, selectedVariant: variant }];
    });
    toast.success(`${product.name}${variant ? ` (${variant.name})` : ''} added to cart`);
  };

  const removeFromCart = (productId: number, variantId?: number) => {
    setCart(prev => prev.filter(item => 
      !(item.id === productId && (variantId ? item.selectedVariant?.id === variantId : !item.selectedVariant))
    ));
  };

  const updateQuantity = (productId: number, delta: number, variantId?: number) => {
    setCart(prev => {
      const item = prev.find(i => 
        i.id === productId && (variantId ? i.selectedVariant?.id === variantId : !i.selectedVariant)
      );
      if (item && item.quantity + delta <= 0) {
        return prev.filter(i => 
          !(i.id === productId && (variantId ? i.selectedVariant?.id === variantId : !i.selectedVariant))
        );
      }
      return prev.map(item => {
        if (item.id === productId && (variantId ? item.selectedVariant?.id === variantId : !item.selectedVariant)) {
          return { ...item, quantity: item.quantity + delta };
        }
        return item;
      });
    });
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = (productId: number) => {
    setWishlist(prev => {
      const exists = prev.includes(productId);
      if (exists) {
        toast.success('Removed from wishlist');
        return prev.filter(id => id !== productId);
      } else {
        toast.success('Added to wishlist');
        return [...prev, productId];
      }
    });
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout request failed');
    }
    setUser(null);
    localStorage.removeItem('hgs_user');
    toast.success('Logged out successfully');
  };

  return (
    <StoreContext.Provider value={{ 
      user, setUser, cart, addToCart, removeFromCart, updateQuantity, clearCart, logout,
      isMaintenance, setMaintenance: setIsMaintenance, checkMaintenance,
      authMode,
      updateProfile, refreshUser,
      wishlist, toggleWishlist, config, fetchConfig,
      subscribeNewsletter,
      vibration, setVibration,
      notifications, setNotifications,
      sound, setSound,
      adminTheme, setAdminTheme,
      appliedCoupon, setAppliedCoupon,
      bulkDiscounts, fetchBulkDiscounts
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
}
