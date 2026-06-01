import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, CartItem, Product, UserAddress, PromotionRule, Permission } from './types';
import toast from 'react-hot-toast';
import { translations, Language } from './translations';
import { auth, signOutUser, onAuthStateChanged, onIdTokenChanged } from './firebase'; 
import { getAuthHeaders } from './lib/utils';
import { fetchWithHandling } from './lib/api';

interface StoreContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  cart: CartItem[];
  addToCart: (product: Product, variant?: any, quantity?: number) => void;
  removeFromCart: (productId: any, variantId?: any) => void;
  updateQuantity: (productId: any, delta: number, variantId?: any) => void;
  clearCart: () => void;
  logout: () => void;
  isMaintenance: boolean;
  setMaintenance: (val: boolean) => void;
  checkMaintenance: () => Promise<void>;
  authMode: 'otp' | 'password';
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  fetchUser: () => Promise<void>;
  wishlist: any[];
  toggleWishlist: (productId: any) => void;
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
  promotions: PromotionRule[];
  fetchPromotions: () => Promise<void>;
  bulkDiscounts: any[];
  fetchBulkDiscounts: () => Promise<void>;
  getProductPrice: (product: Product, userRole?: string) => number;
  simulatedRole: string | null;
  setSimulatedRole: (role: string | null) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
  addresses: UserAddress[];
  fetchAddresses: () => Promise<void>;
  saveAddress: (address: Partial<UserAddress>) => Promise<void>;
  deleteAddress: (id: any) => Promise<void>;
  setDefaultAddress: (id: any) => Promise<void>;
  isOnline: boolean;
  isProfileComplete: () => boolean;
  isMobile: boolean;
  isTablet: boolean;
  isSyncingCart: boolean;
  syncCartToBackend: (cartItems: CartItem[]) => Promise<void>;
  isAuthChecking: boolean;
  currentAlert: any;
  setCurrentAlert: (alert: any) => void;
  markAlertAsRead: (id: any) => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  calculateDiscount: (cart: CartItem[]) => number;
  isSyncCartPending: boolean;
  logActivity: (type: string, description: string) => Promise<void>;
  fetchCart: (userId: any) => Promise<void>;
  lastAddedId: number | null;
  fetchWithHandling: <T>(url: string, options?: RequestInit) => Promise<T>;
  showImages: boolean;
  dbError: boolean;
  setDbError: (val: boolean) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [dbError, setDbError] = useState(false);
  const initialCheckDone = useRef(false);
  const authRunningRef = useRef(false);

  const checkMaintenance = React.useCallback(async () => {
    try {
      const data = await fetchWithHandling<any>('/api/settings');
      if (data) {
        setIsMaintenance(prev => (prev !== !!data.maintenance ? !!data.maintenance : prev));
        if (data.authMode) setAuthMode(data.authMode);
        if (data.config) {
          setConfig(prev => JSON.stringify(prev) !== JSON.stringify(data.config) ? data.config : prev);
          const themeSetting = data.config.find((s: any) => s.key === 'admin_theme');
          if (themeSetting) setAdminTheme(prev => prev !== themeSetting.value ? themeSetting.value : prev);
        }
      }
    } catch (err) {}
  }, []);

  const fetchPromotions = React.useCallback(async () => {
    try {
      const data = await fetchWithHandling<PromotionRule[]>('/api/promotions-rules');
      if (data) {
        const activePromotions = data.filter((p: PromotionRule) => p.active);
        setPromotions(prev => JSON.stringify(prev) !== JSON.stringify(activePromotions) ? activePromotions : prev);
      }
    } catch (err) {}
  }, []);

  const fetchBulkDiscounts = React.useCallback(async () => {
    try {
      const data = await fetchWithHandling<any[]>('/api/bulk-discounts');
      if (data) {
        setBulkDiscounts(prev => JSON.stringify(prev) !== JSON.stringify(data) ? data : prev);
      }
    } catch (err) {}
  }, []);

  const [currentAlert, setCurrentAlert] = useState<any>(null);
  const [pendingAlerts, setPendingAlerts] = useState<any[]>([]);
  const [authMode, setAuthMode] = useState<'otp' | 'password'>('password');
  const [showImages, setShowImages] = useState(true);

  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('hgs_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const checkAuth = React.useCallback(async (fbToken?: string) => {
    if (authRunningRef.current) return;
    authRunningRef.current = true;
    try {
      const token = fbToken || localStorage.getItem('hgs_token');
      const data = await fetchWithHandling<{user: User}>('/api/auth/me', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (data && data.user) {
        console.log('User loaded:', data.user);
        setUser(prev => {
           // Deep comparison to prevent redundant re-renders
           if (prev && JSON.stringify(prev) === JSON.stringify(data.user)) return prev;
           return data.user;
        });
        localStorage.setItem('hgs_user', JSON.stringify(data.user));
      } else {
        setUser(prev => prev === null ? null : null);
        localStorage.removeItem('hgs_user');
        localStorage.removeItem('hgs_token');
      }
    } catch (err) {
      setUser(prev => prev === null ? null : null);
      localStorage.removeItem('hgs_user');
      localStorage.removeItem('hgs_token');
    } finally {
      authRunningRef.current = false;
    }
  }, [setUser]);

  useEffect(() => {
    if (initialCheckDone.current) return;
    initialCheckDone.current = true;
    
    let unsubscribe: any;
    
    const initialize = async () => {
      try {
        if (auth && typeof auth.authStateReady === 'function') {
          await auth.authStateReady();
        }
        const firebaseUser = auth?.currentUser;
        
        if (firebaseUser) {
          const token = await firebaseUser.getIdToken();
          localStorage.setItem('hgs_token', token);
          await checkAuth(token);
        } else {
          const savedToken = localStorage.getItem('hgs_token');
          if (savedToken) {
            await checkAuth(savedToken);
          } else {
            setUser(null);
          }
        }
      } catch (e) {
        console.error('Initialization error', e);
      } finally {
        setIsAuthChecking(false);
        await checkMaintenance();
      }
      
      unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            const token = await firebaseUser.getIdToken();
            const currentToken = localStorage.getItem('hgs_token');
            if (token !== currentToken) {
              localStorage.setItem('hgs_token', token);
              await checkAuth(token);
            }
          } else {
            const savedToken = localStorage.getItem('hgs_token');
            if (!savedToken) {
               setUser(null);
               return;
            }

            localStorage.removeItem('hgs_token');
            localStorage.removeItem('hgs_user');
            setUser(null);
          }
        } catch (e) {
          console.error('Auth change handling error', e);
        }
      });
    };
    
    initialize();
    
    const listener = () => setUser(null);
    const dbErrListener = (e: any) => {
      console.warn('[StoreContext] Database connection error event caught:', e.detail);
      setDbError(true);
    };
    
    window.addEventListener('auth_error', listener);
    window.addEventListener('database_error', dbErrListener);
    
    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('auth_error', listener);
      window.removeEventListener('database_error', dbErrListener);
    };
  }, []); // Empty dependencies as functions inside are stable


  const fetchCart = async (userId: number) => {
    try {
      const items = await fetchWithHandling<any[]>(`/api/cart?userId=${userId}`);
      if (items && items.length > 0) {
        setCart(items.map((i: any) => ({
          id: i.product_id,
          name: i.name || 'Unknown Product',
          price: Number(i.price) || 0,
          image_url: i.image_url || '',
          stock: i.stock,
          category: i.category,
          quantity: i.quantity,
          description: i.description || '',
          unit: i.unit || ''
        })));
        setIsSyncCartPending(false);
      }
    } catch (err) {}
  };

  // Removed simulatedRole
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoadedFromStorage, setCartLoadedFromStorage] = useState(true);
  const [isSyncingCart, setIsSyncingCart] = useState(false);
  const [isSyncCartPending, setIsSyncCartPending] = useState(false);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [config, setConfig] = useState<any[]>([]);
  const [vibration, setVibration] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(true);
  const [adminTheme, setAdminTheme] = useState('theme-navy');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [promotions, setPromotions] = useState<PromotionRule[]>([]);
  const [bulkDiscounts, setBulkDiscounts] = useState<any[]>([]);
  const [language, setLanguage] = useState<Language>('en');
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [lastAddedId, setLastAddedId] = useState<number | null>(null);

  // Sync effect hooks
  useEffect(() => {
    if (user && cartLoadedFromStorage) {
      const timeoutId = setTimeout(() => syncCartToBackend(cart), 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [cart, user, cartLoadedFromStorage]);
  
  const syncCartToBackend = async (cartItems: CartItem[]) => {
    if (!user) return;
    setIsSyncingCart(true);
    try {
        await fetchWithHandling('/api/cart/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, items: cartItems })
        });
        setIsSyncCartPending(false);
    } catch (err) {
        setIsSyncCartPending(true);
    } finally {
        setIsSyncingCart(false);
    }
  };

  const logout = async () => {
    try { await signOutUser(); } catch (e) {}
    try { await fetchWithHandling('/api/auth/logout', { method: 'POST' }); } catch (err) {}
    setUser(null);
    localStorage.removeItem('hgs_user');
    localStorage.removeItem('hgs_token');
    toast.success('Logged out');
  };

  const getProductPrice = (product: Product, userRole?: string) => {
    const activeRole = userRole || user?.role;
    if (activeRole === 'wholesaler' && product.wholesale_price) return product.wholesale_price;
    return product.retail_price || product.price;
  };

  const hasPermission = (permission: Permission) => user?.permissions?.includes(permission) ?? false;
  const calculateDiscount = (cart: CartItem[]) => 0; // Simplified
  const updateProfile = async (data: Partial<User>) => {};
  
  const refreshUser = React.useCallback(async () => {
    try {
      const data = await fetchWithHandling<{user: User}>('/api/auth/me', { headers: getAuthHeaders() });
      if (data && data.user) {
        console.log('User refreshed:', data.user);
        setUser(data.user);
        localStorage.setItem('hgs_user', JSON.stringify(data.user));
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  }, [setUser]);

  const fetchUser = refreshUser;
  
  const subscribeNewsletter = async (email: string) => {};
  const fetchConfig = async () => {};
  const fetchAddresses = async () => {};
  const saveAddress = async (addr: any) => {};
  const deleteAddress = async (id: number) => {};
  const setDefaultAddress = async (id: number) => {};
  const logActivity = async (t: string, d: string) => {};
  const markAlertAsRead = async (id: number) => {};

  const addToCart = (product: Product, variant?: any, quantity: number = 1) => {
    setCart(prev => {
        const existing = prev.find(item => item.id === product.id && (variant ? item.variantId === variant.id : !item.variantId));
        if (existing) {
            return prev.map(item => item.id === product.id && (variant ? item.variantId === variant.id : !item.variantId) ? { ...item, quantity: item.quantity + quantity } : item);
        }
        return [...prev, { ...product, variantId: variant?.id, quantity }];
    });
    toast.success('Added to cart');
  };

  const removeFromCart = (productId: number, variantId?: number) => {
    setCart(prev => prev.filter(item => !(item.id === productId && (variantId ? item.variantId === variantId : !item.variantId))));
    toast.success('Removed from cart');
  };

  const updateQuantity = (productId: number, delta: number, variantId?: number) => {
    setCart(prev => prev.map(item => item.id === productId && (variantId ? item.variantId === variantId : !item.variantId) ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (productId: number) => {
    setWishlist(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
    toast.success(wishlist.includes(productId) ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const simulatedRole = null;
  const setSimulatedRole = (role: string | null) => {};

  const contextValue = React.useMemo(() => ({
    user, setUser, cart, addToCart, removeFromCart, updateQuantity, clearCart, logout,
    isMaintenance, setMaintenance: setIsMaintenance, checkMaintenance, fetchCart,
    authMode, updateProfile, refreshUser, fetchUser, wishlist, toggleWishlist, config, fetchConfig,
    subscribeNewsletter, vibration, setVibration, notifications, setNotifications,
    sound, setSound, adminTheme, setAdminTheme, appliedCoupon, setAppliedCoupon,
    promotions, fetchPromotions, bulkDiscounts, fetchBulkDiscounts, getProductPrice,
    simulatedRole, setSimulatedRole,
    language, setLanguage, t: (key: any) => translations[language][key as keyof typeof translations.en] || key, addresses, fetchAddresses, saveAddress, deleteAddress, setDefaultAddress,
    isOnline, isProfileComplete: () => true, isMobile, isTablet, isSyncingCart, syncCartToBackend,
    isAuthChecking, currentAlert, setCurrentAlert, markAlertAsRead, hasPermission, calculateDiscount,
    isSyncCartPending, logActivity,
    lastAddedId, fetchWithHandling,
    showImages,
    dbError, setDbError
  }), [user, cart, isMaintenance, checkMaintenance, config, wishlist, promotions, bulkDiscounts, language, addresses, isMobile, isTablet, isSyncingCart, isAuthChecking, currentAlert, isSyncCartPending, lastAddedId, showImages, dbError]);

  return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
}
