import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, CartItem, Product, UserAddress, PromotionRule, Permission, Announcement } from './types';
import toast from 'react-hot-toast';
import { translations, Language } from './translations';
import { useNetwork } from './hooks/useNetwork';
import { auth, signOutUser, onAuthStateChanged, onIdTokenChanged } from './firebase'; 
import { getAuthHeaders } from './lib/utils';
import { fetchWithHandling } from './lib/api';
import { securityService } from './services/securityService';
import { logger } from './lib/logger';

interface StoreContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  cart: CartItem[];
  addToCart: (product: Product, variant?: any, quantity?: number) => void;
  removeFromCart: (productId: any, variantId?: any) => void;
  updateQuantity: (productId: any, delta: number, variantId?: any) => void;
  clearCart: () => void;
  logout: () => void;
  performLogout: () => Promise<void>;
  showLogoutDialog: boolean;
  setShowLogoutDialog: (val: boolean) => void;
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
  latency: number | null;
  isProfileComplete: () => boolean;
  isMobile: boolean;
  isTablet: boolean;
  isSyncingCart: boolean;
  syncCartToBackend: (cartItems: CartItem[]) => Promise<void>;
  isAuthChecking: boolean;
  isInitialAuthPerformed: boolean;
  currentAlert: any;
  setCurrentAlert: (alert: any) => void;
  markAlertAsRead: (id: any) => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  calculateDiscount: (cart: CartItem[]) => number;
  isRevalidating: boolean;
  isSyncCartPending: boolean;
  setIsRevalidating: (val: boolean) => void;
  logActivity: (type: string, description: string) => Promise<void>;
  notificationsList: any[];
  unreadNotificationsCount: number;
  readNotificationIds: number[];
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (id: number) => void;
  fetchCart: (userId: any, forceRefresh?: boolean) => Promise<void>;
  lastAddedId: number | null;
  fetchWithHandling: <T>(url: string, options?: RequestInit) => Promise<T>;
  showImages: boolean;
  dbError: boolean;
  setDbError: (val: boolean) => void;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  fetchProducts: () => Promise<void>;
  isLoadingProducts: boolean;
  isApiUp: boolean;
  setIsApiUp: (val: boolean) => void;
  categories: any[];
  setCategories: (cats: any[]) => void;
  isLoadingCategories: boolean;
  fetchCategories: () => Promise<void>;
  announcements: Announcement[];
  fetchAnnouncements: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // 1. State and Refs
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isInitialAuthPerformed, setIsInitialAuthPerformed] = useState(false);
  const [dbError, setDbError] = useState(false);
  const [isApiUp, setIsApiUp] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const initialCheckDone = useRef(false);
  const isInitialized = useRef(false);
  const isLoadingCategoriesRef = useRef(false);
  const authRunningRef = useRef(false);

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

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('hgs_products');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('hgs_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [cartLoadedFromStorage, setCartLoadedFromStorage] = useState(true);
  const [isSyncingCart, setIsSyncingCart] = useState(false);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [isSyncCartPending, setIsSyncCartPending] = useState(false);
  const [wishlist, setWishlist] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('hgs_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const lastSyncCartStrRef = React.useRef<string>(JSON.stringify(cart));
  const cachedCartRef = React.useRef<{ data: CartItem[]; timestamp: number; userId: any } | null>(null);
  const fetchCartPromiseRef = React.useRef<Promise<CartItem[]> | null>(null);
  const isCartCacheDirtyRef = React.useRef<boolean>(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [config, setConfig] = useState<any[]>([]);
  const [vibration, setVibration] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('read_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [sound, setSound] = useState(true);
  const [adminTheme, setAdminTheme] = useState('theme-navy');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [promotions, setPromotions] = useState<PromotionRule[]>([]);
  const [bulkDiscounts, setBulkDiscounts] = useState<any[]>([]);
  const [simulatedRole, setSimulatedRole] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('hgs_lang') as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('hgs_lang', language);
  }, [language]);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const { isOnline, latency } = useNetwork();
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(navigator.userAgent) || window.innerWidth < 768;
    }
    return false;
  });
  const [isTablet, setIsTablet] = useState(() => {
    if (typeof window !== 'undefined') {
      return /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(navigator.userAgent);
    }
    return false;
  });
  const [lastAddedId, setLastAddedId] = useState<number | null>(null);

  // Update device type states on resize
  useEffect(() => {
    const handleResize = () => {
      const ua = navigator.userAgent;
      const width = window.innerWidth;
      setIsMobile(/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua) || width < 768);
      setIsTablet(/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 2. Helper Functions (useCallbacks and async functions)
  const fetchProducts = React.useCallback(async () => {
    if (isLoadingProducts) return;
    setIsLoadingProducts(true);
    try {
      if (!isOnline && products.length > 0) {
        setIsLoadingProducts(false);
        return;
      }

      logger.debug('Fetching products...');
      const data = await fetchWithHandling<Product[]>('/api/products');
      if (data && data.length > 0) {
        setProducts(data);
        localStorage.setItem('hgs_products', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [isOnline, products.length, isLoadingProducts]);

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

  const fetchAnnouncements = React.useCallback(async () => {
    try {
      const data = await fetchWithHandling<Announcement[]>('/api/announcements');
      if (data) {
        setAnnouncements(data);
      }
    } catch (err) {}
  }, []);

  const checkAuth = React.useCallback(async (fbToken?: string) => {
    if (authRunningRef.current) return;
    authRunningRef.current = true;
    try {
      const token = fbToken || localStorage.getItem('hgs_token');
      const isValidToken = token && token !== 'null' && token !== 'undefined' && token.trim() !== '' && token.split('.').length === 3;
      
      if (!isValidToken) {
        setUser(null);
        localStorage.removeItem('hgs_user');
        localStorage.removeItem('hgs_token');
        authRunningRef.current = false;
        return;
      }

      const data = await fetchWithHandling<{user: User}>('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (data && data.user) {
        const isNewLogin = !user || user.id !== data.user.id;
        setUser(prev => {
           if (prev && JSON.stringify(prev) === JSON.stringify(data.user)) return prev;
           return data.user;
        });
        localStorage.setItem('hgs_user', JSON.stringify(data.user));
        if (isNewLogin) {
          securityService.trackAuth('login', data.user);
        }
      } else {
        setUser(null);
        localStorage.removeItem('hgs_user');
        localStorage.removeItem('hgs_token');
      }
    } catch (err: any) {
      if (err.status === 401) {
        setUser(null);
        localStorage.removeItem('hgs_user');
        localStorage.removeItem('hgs_token');
      }
    } finally {
      authRunningRef.current = false;
    }
  }, []);

  const refreshUser = React.useCallback(async () => {
    setIsRevalidating(true);
    try {
      const data = await fetchWithHandling<{user: User}>('/api/auth/me', { headers: getAuthHeaders() });
      if (data && data.user) {
        setUser(data.user);
        localStorage.setItem('hgs_user', JSON.stringify(data.user));
      }
    } catch (err) {
      // ignore
    } finally {
      setIsRevalidating(false);
    }
  }, []);

  const fetchUser = refreshUser;

  const fetchCart = React.useCallback(async (userId: any, forceRefresh = false) => {
    if (!forceRefresh && !isCartCacheDirtyRef.current && cachedCartRef.current && cachedCartRef.current.userId === userId && Date.now() - cachedCartRef.current.timestamp < 15000) {
      logger.debug(`CART CACHE HIT: Returning cached cart for user ${userId}`);
      return;
    }

    if (fetchCartPromiseRef.current) {
      logger.debug('CART FETCH DEDUP: Joining in-flight cart fetch promise');
      try {
        const items = await fetchCartPromiseRef.current;
        setCart(items);
        return;
      } catch (err) {
        // Fallback to fresh fetch if failure or try again below if ref was cleared
      }
    }

    const fetchPromise = (async () => {
      const items = await fetchWithHandling<any[]>(`/api/cart?userId=${userId}`);
      if (!items) throw new Error('Failed to fetch cart');
      const mappedItems = items.map((i: any) => ({
        id: i.product_id,
        name: i.name || 'Unknown Product',
        price: Number(i.price) || 0,
        image_url: i.image_url || '',
        stock: i.stock,
        category: i.category,
        quantity: i.quantity,
        description: i.description || '',
        unit: i.unit || ''
      }));
      return mappedItems;
    })();

    fetchCartPromiseRef.current = fetchPromise;

    try {
      const mappedItems = await fetchPromise;
      setCart(mappedItems);
      cachedCartRef.current = { data: mappedItems, timestamp: Date.now(), userId };
      lastSyncCartStrRef.current = JSON.stringify(mappedItems);
      isCartCacheDirtyRef.current = false;
      setIsSyncCartPending(false);
    } catch (err) {
      console.error('[CART FETCH] Error fetching cart:', err);
    } finally {
      fetchCartPromiseRef.current = null;
    }
  }, []);

  const syncCartToBackend = React.useCallback(async (cartItems: CartItem[]) => {
    if (!user) return;
    setIsSyncingCart(true);
    try {
        await fetchWithHandling('/api/cart/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, items: cartItems })
        });
        cachedCartRef.current = { data: cartItems, timestamp: Date.now(), userId: user.id };
        isCartCacheDirtyRef.current = false;
        setIsSyncCartPending(false);
    } catch (err) {
        setIsSyncCartPending(true);
        isCartCacheDirtyRef.current = true;
    } finally {
        setIsSyncingCart(false);
    }
  }, [user]);

  const fetchAddresses = React.useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchWithHandling<UserAddress[]>('/api/addresses', { headers: getAuthHeaders() });
      if (data) {
        setAddresses(prev => JSON.stringify(prev) !== JSON.stringify(data) ? data : prev);
      }
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
    }
  }, [user]);

  const saveAddress = async (addr: Partial<UserAddress>) => {
    try {
      const isNew = !addr.id;
      const data = await fetchWithHandling<UserAddress>(isNew ? '/api/addresses' : `/api/addresses/${addr.id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(addr)
      });
      if (data) {
        toast.success(isNew ? 'Address added!' : 'Address updated!');
        await fetchAddresses();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save address');
    }
  };

  const deleteAddress = async (id: number) => {
    try {
      await fetchWithHandling<any>(`/api/addresses/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      toast.success('Address removed');
      await fetchAddresses();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete address');
    }
  };

  const setDefaultAddress = async (id: number) => {
    try {
      await fetchWithHandling<any>(`/api/addresses/${id}/default`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      toast.success('Default address set');
      await fetchAddresses();
    } catch (err: any) {
      toast.error(err.message || 'Failed to set default address');
    }
  };

  const addToCart = async (product: Product, variant?: any, quantity: number = 1) => {
    isCartCacheDirtyRef.current = true;
    
    // Artificial delay to simulate cloud inventory lock (User Request: "Add some delay and lag")
    await new Promise(resolve => setTimeout(resolve, 350));
    
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
    isCartCacheDirtyRef.current = true;
    setCart(prev => prev.filter(item => !(item.id === productId && (variantId ? item.variantId === variantId : !item.variantId))));
    toast.success('Removed from cart');
  };

  const updateQuantity = (productId: number, delta: number, variantId?: number) => {
    isCartCacheDirtyRef.current = true;
    setCart(prev => prev.map(item => item.id === productId && (variantId ? item.variantId === variantId : !item.variantId) ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };

  const clearCart = () => {
    isCartCacheDirtyRef.current = true;
    setCart([]);
  };

  const toggleWishlist = (productId: number) => {
    setWishlist(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
    toast.success(wishlist.includes(productId) ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const logout = () => setShowLogoutDialog(true);
  const performLogout = async () => {
    try { 
      const currentUser = user;
      await signOutUser(); 
      securityService.trackAuth('logout', currentUser);
    } catch (e) {}
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
  const fetchNotifications = React.useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchWithHandling<any[]>('/api/notifications');
      if (data && Array.isArray(data)) {
        const activeRole = simulatedRole || user?.role || 'user';
        const visible = data.filter((n: any) => 
          (n.user_id === user?.id || !n.user_id) && 
          (!n.target_role || n.target_role === 'all' || n.target_role === activeRole)
        );
        setNotificationsList(visible);
      }
    } catch (err) {
      logger.warn('Notifications fetch failed');
    }
  }, [user, simulatedRole]);

  const markNotificationAsRead = React.useCallback((id: number) => {
    setReadNotificationIds(prev => {
      const next = [...new Set([...prev, id])];
      localStorage.setItem('read_notifications', JSON.stringify(next));
      return next;
    });
  }, []);

  const unreadNotificationsCount = React.useMemo(() => {
    return notificationsList.filter(n => !readNotificationIds.includes(n.id)).length;
  }, [notificationsList, readNotificationIds]);

  const calculateDiscount = (cart: CartItem[]) => 0; // Simplified
  const updateProfile = async (data: Partial<User>) => {
    try {
      const res = await fetchWithHandling<{success: boolean; user: User}>('/api/user/update-profile', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (res && res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('hgs_user', JSON.stringify(res.user));
        toast.success(translations[language]['profile_updated'] as string || 'Profile successfully updated!');
      } else {
        toast.error('Failed to update profile.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    }
  };
  const subscribeNewsletter = async (email: string) => {};
  const fetchCategories = React.useCallback(async () => {
    if (isLoadingCategoriesRef.current) return;
    isLoadingCategoriesRef.current = true;
    setIsLoadingCategories(true);
    try {
      const data = await fetchWithHandling<any[]>('/api/categories');
      if (data && Array.isArray(data)) {
        setCategories(data);
      } else {
        setCategories([]);
      }
    } catch (err) {
      setCategories([]);
    } finally {
      setIsLoadingCategories(false);
      isLoadingCategoriesRef.current = false;
    }
  }, []);

  const fetchConfig = React.useCallback(async () => {
    try {
      const data = await fetchWithHandling<any>('/api/settings');
      if (data && data.config) {
        setConfig(prev => JSON.stringify(prev) !== JSON.stringify(data.config) ? data.config : prev);
      }
    } catch (err) {
      // Config failure handled silently
    }
  }, []);
  const logActivity = async (t: string, d: string) => {};
  const markAlertAsRead = async (id: number) => {};

  // 3. Effects
  useEffect(() => {
    if (initialCheckDone.current) {
        logger.debug('StoreProvider was already initialized, skipping');
        return;
    }
    initialCheckDone.current = true;
    
    let unsubscribe: any;

    const initialize = async () => {
      console.log('STORE_INIT_START');
      let authSafetyTimeout: any;
      try {
        logger.info('[BOOT] Starting store context initialization...');
        
        // Safety timeout to prevent infinite Loading state
        authSafetyTimeout = setTimeout(() => {
          if (!isInitialized.current) {
            logger.warn('[BOOT] Auth check timed out after 5s. Forcing initialization complete.');
            console.warn('[BOOT] Auth safety timeout triggered. Clearing loader.');
            setIsAuthChecking(false);
            setIsInitialAuthPerformed(true);
          }
        }, 5000);

        // Add timeout detection for overall init
        const initTimeout = setTimeout(() => logger.error('[BOOT] Initialization is taking longer than 30s'), 30000);

        const coreAssetsPromise = Promise.allSettled([
          checkMaintenance(),
          fetchConfig(),
          fetchCategories(),
          fetchAnnouncements()
        ]);
        
        await coreAssetsPromise;
        clearTimeout(initTimeout);

        if (auth && typeof auth.authStateReady === 'function') {
          try {
            logger.info('[BOOT] Checking Firebase auth state...');
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Auth state timeout')), 5000));
            await Promise.race([auth.authStateReady(), timeoutPromise]);
            console.log('AUTH_STATE_RECEIVED');
            logger.info('[BOOT] Firebase auth state ready.');
          } catch (e: any) {
            logger.warn('[BOOT] Auth state check failed or timed out:', e.message);
          }
        }

        const firebaseUser = auth?.currentUser;
        logger.info(`[BOOT] Initial firebaseUser: ${firebaseUser ? firebaseUser.uid : 'null'}`);

        if (firebaseUser) {
          const token = await firebaseUser.getIdToken();
          localStorage.setItem('hgs_token', token);
          await checkAuth(token);
          console.log('USER_CONTEXT_SET');
        } else {
          const savedToken = localStorage.getItem('hgs_token');
          logger.info(`[BOOT] No firebaseUser. Checking saved token: ${savedToken ? 'exists' : 'missing'}`);
          if (savedToken && savedToken !== 'null' && savedToken.split('.').length === 3) {
            await checkAuth(savedToken);
            console.log('USER_CONTEXT_SET');
          } else {
            setUser(null);
          }
        }

        await coreAssetsPromise;

      } catch (err: any) {
        logger.error('[BOOT] Initialization error:', err.message);
      } finally {
        // Absolute safety guard: ensure checking flags are ALWAYS cleared
        logger.info('[BOOT] Finalizing initialization state');
        isInitialized.current = true;
        
        if (authSafetyTimeout) clearTimeout(authSafetyTimeout);
        setIsAuthChecking(false);
        setIsInitialAuthPerformed(true);
        console.log('STORE_INIT_COMPLETE');
      }
      
      unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const token = await firebaseUser.getIdToken();
          if (token !== localStorage.getItem('hgs_token')) {
            localStorage.setItem('hgs_token', token);
            await checkAuth(token);
          }
        } else {
          if (localStorage.getItem('hgs_token')) {
            localStorage.removeItem('hgs_token');
            localStorage.removeItem('hgs_user');
            setUser(null);
          }
        }
      });
    };
    
    initialize();
    
    const authErrListener = () => {
      setUser(null);
    };
    const dbErrListener = () => {
      setDbError(true);
    };
    const forceBypassListener = () => {
      console.warn('[RECOVERY] Force bypass loading state event triggered.');
      setIsAuthChecking(false);
      setIsInitialAuthPerformed(true);
    };
    window.addEventListener('auth_error', authErrListener);
    window.addEventListener('database_error', dbErrListener);
    window.addEventListener('force_bypass_loading', forceBypassListener);
    
    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('auth_error', authErrListener);
      window.removeEventListener('database_error', dbErrListener);
      window.removeEventListener('force_bypass_loading', forceBypassListener);
    };
  }, []);

  useEffect(() => {
    if (user) fetchAddresses();
    else setAddresses([]);
  }, [user, fetchAddresses]);

  useEffect(() => {
    localStorage.setItem('hgs_cart', JSON.stringify(cart));
    const cartStr = JSON.stringify(cart);
    if (user && cartLoadedFromStorage && isOnline) {
      if (cartStr !== lastSyncCartStrRef.current) {
        const timeoutId = setTimeout(() => {
          syncCartToBackend(cart);
          lastSyncCartStrRef.current = cartStr;
        }, 1000);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [cart, user, cartLoadedFromStorage, syncCartToBackend]); // Note: isOnline dependency removed as updates trigger frequent unwanted sync triggers

  // Track reconnection & login event triggers safely
  const previousOnlineRef = React.useRef<boolean>(isOnline);
  const previousUserRef = React.useRef<User | null>(user);

  useEffect(() => {
    if (user && !previousUserRef.current && isOnline) {
      logger.debug('User logged in. Force synchronizing and fetching latest cart.');
      isCartCacheDirtyRef.current = true;
      fetchCart(user.id, true);
    }
    previousUserRef.current = user;
  }, [user, isOnline, fetchCart]);

  useEffect(() => {
    if (isOnline && !previousOnlineRef.current) {
      logger.debug('Connection restored. Force synchronizing cart.');
      if (user) {
        isCartCacheDirtyRef.current = true;
        fetchCart(user.id, true);
      }
    }
    previousOnlineRef.current = isOnline;
  }, [isOnline, user, fetchCart]);

  useEffect(() => {
    localStorage.setItem('hgs_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // API Health Monitor Polling
  useEffect(() => {
    let failureCount = 0;
    
    const checkApiHealth = async () => {
      try {
        const res = await fetch('/api/health', { 
          method: 'GET', 
          cache: 'no-store',
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            console.warn("[API MONITOR] API health response is not JSON, treating as up but not fully functional.");
            setIsApiUp(true);
            failureCount = 0;
            return;
          }
          setIsApiUp(true);
          failureCount = 0;
          setDbError(false);
          const data = await res.json();
          if (data.status === 'degraded' || data.firestoreStatus === 'ERROR' || data.firestoreStatus === 'DEGRADED') {
            failureCount++;
            console.warn(`[API MONITOR] Database has degraded status reported: ${data.firestoreStatus}`);
          }
        } else {
          setIsApiUp(false);
          failureCount++;
          console.warn(`[API MONITOR] /api/health returned non-2xx status: ${res.status}`);
        }
      } catch (err) {
        setIsApiUp(false);
        failureCount++;
        logger.warn('[API MONITOR] Temporary connection warning while checking health', err);
      }
    };
    
    // Initial check
    checkApiHealth();
    
    return () => {};
  }, []);

  // 4. Context Provider
  const contextValue = React.useMemo(() => ({
    user, setUser, cart, addToCart, removeFromCart, updateQuantity, clearCart, logout, performLogout, showLogoutDialog, setShowLogoutDialog,
    isMaintenance, setMaintenance: setIsMaintenance, checkMaintenance, fetchCart,
    authMode, updateProfile, refreshUser, fetchUser, wishlist, toggleWishlist, config, fetchConfig,
    subscribeNewsletter, vibration, setVibration, notifications, setNotifications,
    sound, setSound, adminTheme, setAdminTheme, appliedCoupon, setAppliedCoupon,
    promotions, fetchPromotions, bulkDiscounts, fetchBulkDiscounts, getProductPrice,
    simulatedRole, setSimulatedRole,
    language, setLanguage, t: (key: any) => translations[language][key as keyof typeof translations.en] || key, 
    addresses, fetchAddresses, saveAddress, deleteAddress, setDefaultAddress,
    isOnline, latency, isProfileComplete: () => true, isMobile, isTablet, isSyncingCart, syncCartToBackend,
    isAuthChecking, isRevalidating, setIsRevalidating, isInitialAuthPerformed, currentAlert, setCurrentAlert, markAlertAsRead, hasPermission, calculateDiscount,
    isSyncCartPending, logActivity, lastAddedId, fetchWithHandling, showImages, dbError, setDbError,
    notificationsList, unreadNotificationsCount, readNotificationIds, fetchNotifications, markNotificationAsRead,
    products, setProducts, fetchProducts, isLoadingProducts,
    isApiUp, setIsApiUp,
    categories, setCategories, fetchCategories, isLoadingCategories,
    announcements, fetchAnnouncements
  }), [user, cart, isMaintenance, checkMaintenance, config, wishlist, promotions, bulkDiscounts, language, addresses, isMobile, isTablet, isSyncingCart, isAuthChecking, isInitialAuthPerformed, currentAlert, isSyncCartPending, lastAddedId, showImages, dbError, fetchAddresses, refreshUser, syncCartToBackend, simulatedRole, 
    notificationsList, unreadNotificationsCount, readNotificationIds, fetchNotifications, markNotificationAsRead,
    products, setProducts, fetchProducts, isLoadingProducts, isApiUp, isOnline, latency, categories, fetchCategories, isLoadingCategories,
    announcements, fetchAnnouncements]);

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
