import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, CartItem, Product, UserAddress, PromotionRule, Permission, Announcement } from './types';
import toast from 'react-hot-toast';
import { translations, Language } from './translations';
import { useLanguage } from './LanguageContext';
import { useSWRConfig } from 'swr';
import { useNetwork } from './hooks/useNetwork';
import { auth, signOutUser, onAuthStateChanged, onIdTokenChanged, db, doc, onSnapshot, collection, query, orderBy, limit, where } from './firebase'; 
import { getAuthHeaders } from './lib/utils';
import { fetchWithHandling } from './lib/api';
import { securityService } from './services/securityService';
import { logger } from './lib/logger';
import { triggerFeedback } from './lib/feedback';

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
  subscribeNewsletter: (email: string) => Promise<boolean>;
  unsubscribeNewsletter: (email: string) => Promise<boolean>;
  checkNewsletterStatus: (email: string) => Promise<boolean>;
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
  fetchProducts: (params?: { page?: number; limit?: number; search?: string; category?: string; sortBy?: string; append?: boolean }) => Promise<number>;
  isLoadingProducts: boolean;
  fetchProductsError: string | null;
  isApiUp: boolean;
  setIsApiUp: (val: boolean) => void;
  categories: any[];
  setCategories: (cats: any[]) => void;
  isLoadingCategories: boolean;
  fetchCategories: () => Promise<void>;
  announcements: Announcement[];
  fetchAnnouncements: () => Promise<void>;
  prefetchProducts: (params?: { page?: number; limit?: number; search?: string; category?: string; sortBy?: string }) => void;
  prefetchProduct: (productId: string | number) => void;
  startupPhase: number;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log('[StoreProvider] Initialized (mounted)');
  }, []);
  const { language, setLanguage, t } = useLanguage();
  const { mutate: swrMutate } = useSWRConfig();
  // 1. State and Refs
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(() => {
    try {
      const hasToken = !!localStorage.getItem('hgs_token');
      console.log('[StoreProvider] Initial Auth Checking:', hasToken);
      // If we have a token, we MUST verify it regardless of whether we have a local user cache
      if (hasToken) return true;
      return false;
    } catch {
      return false;
    }
  });
  const [isInitialAuthPerformed, setIsInitialAuthPerformed] = useState(() => {
    try {
      const hasToken = !!localStorage.getItem('hgs_token');
      // Verification hasn't happened yet if we have a token
      if (hasToken) return false;
      return true;
    } catch {
      return true;
    }
  });
  const [dbError, setDbError] = useState(false);
  const [isApiUp, setIsApiUp] = useState(true);
  const [startupPhase, setStartupPhase] = useState(1);
  const [categories, setCategories] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('hgs_categories');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
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
  const [fetchProductsError, setFetchProductsError] = useState<string | null>(null);

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
  const clientProductsCacheRef = React.useRef<Record<string, { data: Product[]; timestamp: number }>>({});
  const clientProductDetailCacheRef = React.useRef<Record<string, { data: any; timestamp: number }>>({});
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [config, setConfig] = useState<any[]>([]);
  const [vibration, setVibration] = useState(() => {
    try {
      const saved = localStorage.getItem('hgs_vibration');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('hgs_notifications');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('read_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [sound, setSound] = useState(() => {
    try {
      const saved = localStorage.getItem('hgs_sound');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [adminTheme, setAdminTheme] = useState('theme-navy');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [promotions, setPromotions] = useState<PromotionRule[]>([]);
  const [bulkDiscounts, setBulkDiscounts] = useState<any[]>([]);
  const [simulatedRole, setSimulatedRole] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('hgs_vibration', String(vibration));
    } catch {}
  }, [vibration]);

  useEffect(() => {
    try {
      localStorage.setItem('hgs_notifications', String(notifications));
    } catch {}
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem('hgs_sound', String(sound));
    } catch {}
  }, [sound]);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const { isOnline, latency } = useNetwork();
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [lastAddedId, setLastAddedId] = useState<number | null>(null);

  // Update device type states on mount and on resize
  useEffect(() => {
    const checkDevice = () => {
      const ua = navigator.userAgent;
      const width = window.innerWidth;
      setIsMobile(/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua) || width < 768);
      setIsTablet(/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua));
    };

    checkDevice(); // Initial check
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // 2. Helper Functions (useCallbacks and async functions)
  const fetchProducts = React.useCallback(async (params?: { page?: number; limit?: number; search?: string; category?: string; sortBy?: string; append?: boolean }) => {
    const { page = 1, limit = 20, search = '', category = 'All', sortBy = 'relevance', append = false } = params || {};
    
    const cacheKey = `${category}_${sortBy}_${search}_${page}_${limit}_${append}`;
    const cached = clientProductsCacheRef.current[cacheKey];
    const isCached = !!cached;
    const isStale = cached ? (Date.now() - cached.timestamp > 30000) : true;

    // Stale-While-Revalidate: instantly serve cached data so layout renders immediately
    if (isCached && cached) {
      if (append) {
        setProducts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newProducts = cached.data.filter(p => !existingIds.has(p.id));
          return [...prev, ...newProducts];
        });
      } else {
        setProducts(cached.data);
      }
      
      // If the cache is fresh (< 30s), skip unnecessary network requests completely!
      if (!isStale) {
        return cached.data.length;
      }
    }

    // Only set loading overlays if we have absolutely nothing to show.
    // This avoids flickering spinners on cached items!
    if (!isCached) {
      setIsLoadingProducts(true);
    }
    setFetchProductsError(null);

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        category,
        sortBy
      });

      logger.debug(`Fetching products SWR update (Page ${page})...`);
      const data = await fetchWithHandling<Product[]>(`/api/products?${queryParams.toString()}`);
      
      console.log('Fetched products data:', data);

      if (data) {
        // Save to cache
        clientProductsCacheRef.current[cacheKey] = {
          data,
          timestamp: Date.now()
        };

        if (append) {
          setProducts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newProducts = data.filter(p => !existingIds.has(p.id));
            return [...prev, ...newProducts];
          });
        } else {
          setProducts(data);
          localStorage.setItem('hgs_products', JSON.stringify(data));
        }
        return data.length;
      }
      return 0;
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      // Only show error to user if they aren't looking at cached data
      if (!isCached) {
        setFetchProductsError(err.message || 'Failed to fetch products');
      }
      return 0;
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  const prefetchProducts = React.useCallback((params?: { page?: number; limit?: number; search?: string; category?: string; sortBy?: string }) => {
    const { page = 1, limit = 20, search = '', category = 'All', sortBy = 'relevance' } = params || {};
    const cacheKey = `${category}_${sortBy}_${search}_${page}_${limit}_false`;
    
    // If already cached and fresh, don't double fetch
    const cached = clientProductsCacheRef.current[cacheKey];
    if (cached && Date.now() - cached.timestamp < 30000) {
      return;
    }

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      category,
      sortBy
    });

    // Fetch silently in the background
    fetchWithHandling<Product[]>(`/api/products?${queryParams.toString()}`).then(data => {
      if (data) {
        clientProductsCacheRef.current[cacheKey] = {
          data,
          timestamp: Date.now()
        };
        logger.debug(`[PREFETCH] Prefetched products for key: ${cacheKey}`);
      }
    }).catch(() => {});
  }, []);

  const prefetchProduct = React.useCallback((productId: string | number) => {
    const cacheKey = String(productId);
    const cached = clientProductDetailCacheRef.current[cacheKey];
    if (cached && Date.now() - cached.timestamp < 30000) {
      return;
    }

    // Fetch in background to warm client memory caches and service worker caches
    fetchWithHandling<any>(`/api/products/${productId}`).then(data => {
      if (data) {
        clientProductDetailCacheRef.current[cacheKey] = {
          data,
          timestamp: Date.now()
        };
        logger.debug(`[PREFETCH] Prefetched product detail: ${productId}`);
      }
    }).catch(() => {});
  }, []);

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

      const data = await fetchWithHandling<{user: User; dbOffline?: boolean}>('/api/auth/me', {
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
      } else if (data && (data as any).dbOffline) {
        console.warn('[AUTH] Database offline, maintaining existing session state');
        // Do nothing, don't clear session
      } else {
        // If data is null, check if we had a network error or transient failure that wasn't thrown.
        // We do not clear credentials to prevent infinite redirect loops under 429 rate limits or transient errors
        logger.warn('[checkAuth] Auth API returned empty user without throwing. Maintaining existing session to prevent loops.');
      }
    } catch (err: any) {
      if (err.status === 401) {
        logger.warn('[checkAuth] Unauthorized token (401). Clearing session.', err);
        setUser(null);
        localStorage.removeItem('hgs_user');
        localStorage.removeItem('hgs_token');
      } else {
        logger.warn('[checkAuth] Transient auth check error. Maintaining existing credentials to prevent loops:', err);
      }
    } finally {
      authRunningRef.current = false;
      setIsAuthChecking(false);
      setIsInitialAuthPerformed(true);
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
    
    // Speed up the artificial delay to proceed blazingly fast
    await new Promise(resolve => setTimeout(resolve, 10));
    
    setCart(prev => {
        const existing = prev.find(item => item.id === product.id && (variant ? item.variantId === variant.id : !item.variantId));
        if (existing) {
            return prev.map(item => item.id === product.id && (variant ? item.variantId === variant.id : !item.variantId) ? { ...item, quantity: item.quantity + quantity } : item);
        }
        return [...prev, { ...product, variantId: variant?.id, quantity }];
    });
    triggerFeedback('medium');
    toast.success('Added to cart');
  };

  const removeFromCart = (productId: number, variantId?: number) => {
    isCartCacheDirtyRef.current = true;
    setCart(prev => prev.filter(item => !(item.id === productId && (variantId ? item.variantId === variantId : !item.variantId))));
    triggerFeedback('light');
    toast.success('Removed from cart');
  };

  const updateQuantity = (productId: number, delta: number, variantId?: number) => {
    isCartCacheDirtyRef.current = true;
    setCart(prev => prev.map(item => item.id === productId && (variantId ? item.variantId === variantId : !item.variantId) ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
    triggerFeedback('light');
  };

  const clearCart = () => {
    isCartCacheDirtyRef.current = true;
    setCart([]);
  };

  const toggleWishlist = (productId: number) => {
    setWishlist(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
    triggerFeedback('medium');
    toast.success(wishlist.includes(productId) ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const logout = () => setShowLogoutDialog(true);
  const performLogout = async () => {
    try { 
      const currentUser = user;
      await signOutUser(); 
      securityService.trackAuth('logout', currentUser);
    } catch (e) {}
    
    // Server-side session invalidation
    try { 
      await fetchWithHandling('/api/auth/logout', { method: 'POST' }); 
    } catch (err) {}

    // 1. Invalidate SWR Cache entirely
    try {
      if (swrMutate) {
        await swrMutate(() => true, undefined, { revalidate: false });
      }
    } catch (swrErr) {
      console.warn('SWR Cache reset warning:', swrErr);
    }

    // 2. Clear all local storage values
    try {
      localStorage.clear();
    } catch (lsErr) {}

    // 3. Reset all StoreContext state
    setUser(null);
    setCart([]);
    setWishlist([]);
    setNotificationsList([]);
    setPendingAlerts([]);
    setCurrentAlert(null);

    // 4. Invalidate compiler refs
    clientProductsCacheRef.current = {};
    clientProductDetailCacheRef.current = {};
    cachedCartRef.current = null;

    toast.success('Logged out successfully');
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
  const subscribeNewsletter = React.useCallback(async (email: string): Promise<boolean> => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return false;
    }
    try {
      const res = await fetchWithHandling<any>('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user ? getAuthHeaders() : {}),
        },
        body: JSON.stringify({ email }),
      });
      if (res && res.success) {
        toast.success(res.message || 'Successfully subscribed to our newsletter!', { icon: '📧' });
        return true;
      } else {
        toast.error(res?.message || 'Failed to subscribe. Please try again.');
        return false;
      }
    } catch (err: any) {
      console.error('Newsletter error:', err);
      toast.error(err.message || 'Network error during subscription.');
      return false;
    }
  }, [user]);

  const unsubscribeNewsletter = React.useCallback(async (email: string): Promise<boolean> => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return false;
    }
    try {
      const res = await fetchWithHandling<any>('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user ? getAuthHeaders() : {}),
        },
        body: JSON.stringify({ email }),
      });
      if (res && res.success) {
        toast.success(res.message || 'Successfully unsubscribed from our newsletter.');
        return true;
      } else {
        toast.error(res?.message || 'Failed to unsubscribe.');
        return false;
      }
    } catch (err: any) {
      console.error('Newsletter unsubscribe error:', err);
      toast.error(err.message || 'Network error during unsubscription.');
      return false;
    }
  }, [user]);

  const checkNewsletterStatus = React.useCallback(async (email: string): Promise<boolean> => {
    if (!email || !email.includes('@')) {
      return false;
    }
    try {
      const res = await fetchWithHandling<any>('/api/newsletter/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user ? getAuthHeaders() : {}),
        },
        body: JSON.stringify({ email }),
      });
      return !!(res && res.subscribed);
    } catch (err) {
      console.error('Newsletter status check error:', err);
      return false;
    }
  }, [user]);
  const fetchCategories = React.useCallback(async () => {
    if (isLoadingCategoriesRef.current) return;
    isLoadingCategoriesRef.current = true;
    setIsLoadingCategories(true);
    try {
      const data = await fetchWithHandling<any[]>('/api/categories');
      if (data && Array.isArray(data)) {
        setCategories(data);
        localStorage.setItem('hgs_categories', JSON.stringify(data));
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
  const logActivity = React.useCallback(async (type: string, description: string) => {
    if (!user) return;
    try {
      fetchWithHandling('/api/admin/activities/log', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ type, description, user_id: user.id })
      }).catch(() => {});
    } catch (err) {
      // Background logging fails silently
    }
  }, [user]);

  const markAlertAsRead = React.useCallback(async (id: number) => {
    setReadNotificationIds(prev => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      localStorage.setItem('read_notifications', JSON.stringify(next));
      return next;
    });
  }, []);

  // 3. Effects
  // Real-time User Data Hook
  useEffect(() => {
    if (!user?.id || !db) return;
    
    // Listen to changes in the user's document for real-time wallet/khata/role updates
    const userDocRef = doc(db, 'users', String(user.id));
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setUser(prev => {
          const updated = { ...prev, ...data } as User;
          if (JSON.stringify(prev) !== JSON.stringify(updated)) {
            localStorage.setItem('hgs_user', JSON.stringify(updated));
            return updated;
          }
          return prev;
        });
      }
    }, (error: any) => {
      console.error('[REALTIME] User listener error:', error);
      if (error.code !== 'permission-denied') {
        setDbError(true);
      }
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Real-time Categories Hook
  useEffect(() => {
    if (!db) return;
    const catRef = collection(db, 'categories');
    const unsubscribe = onSnapshot(catRef, (snapshot) => {
      const cats = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCategories(cats);
      localStorage.setItem('hgs_categories', JSON.stringify(cats));
    }, (error: any) => {
      console.error('[REALTIME] Categories listener error:', error);
      if (error.code !== 'permission-denied') {
        setDbError(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Products Hook
  useEffect(() => {
    if (!db) return;
    const productsRef = query(collection(db, 'products'), where('is_listed', '==', true));
    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
      const data = snapshot.docs.map(d => ({ 
        id: isNaN(Number(d.id)) ? d.id : Number(d.id), 
        ...d.data() 
      })) as Product[];
      setProducts(data);
      localStorage.setItem('hgs_products', JSON.stringify(data));
    }, (error: any) => {
      console.error('[REALTIME] Products listener error:', error);
      if (error.code !== 'permission-denied') {
        setDbError(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Announcements Hook
  useEffect(() => {
    if (!db) return;
    const announcementsRef = query(collection(db, 'announcements'), orderBy('created_at', 'desc'), limit(5));
    const unsubscribe = onSnapshot(announcementsRef, (snapshot) => {
      const data = snapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      })) as unknown as Announcement[];
      setAnnouncements(data);
    }, (error: any) => {
      // Permission denied is expected while auth is initializing or user not authenticated.
      // Simply ignore and do not log to console to prevent noise.
      if (error.code !== 'permission-denied') {
        console.error('[REALTIME] Announcements listener error:', error);
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Notifications Hook
  useEffect(() => {
    if (!user?.id || !db) return;
    
    // Listen for both user-specific and broadcast notifications
    const notificationsRef = query(
      collection(db, 'notifications'), 
      where('target_role', 'in', ['all', user.role || 'customer']),
      orderBy('created_at', 'desc'),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(notificationsRef, (snapshot) => {
      const currentUserIdStr = user?.id ? String(user.id) : null;
      const data = snapshot.docs.map(d => {
        return { id: d.id, ...d.data() } as any;
      }).filter(n => !n.user_id || String(n.user_id) === currentUserIdStr);
      
      setNotificationsList(data);
    }, (error: any) => {
      // Permission denied is expected while auth is initializing or user not authenticated.
      // Simply ignore and do not log to console to prevent noise.
      if (error.code !== 'permission-denied') {
        console.error('[REALTIME] Notifications listener error:', error);
      }
    });
    
    return () => unsubscribe();
  }, [user?.id, user?.role]);

  const [previousRole, setPreviousRole] = React.useState(user?.role || 'retailer');
  useEffect(() => {
    if (user && user.role === 'wholesaler' && previousRole !== 'wholesaler') {
      const hasSeen = localStorage.getItem(`has_seen_wholesale_alert_${user.id}`);
      if (!hasSeen) {
        setCurrentAlert({
          id: Date.now(),
          type: 'success',
          title: 'Congratulations!',
          message: 'Account converted to wholesale. Congratulations and many more things. Now you can purchase at wholesale prices. And start shopping now.',
          duration: 7000,
          is_unskippable: true
        });
        localStorage.setItem(`has_seen_wholesale_alert_${user.id}`, 'true');
      }
    }
    setPreviousRole(user?.role || 'retailer');
  }, [user?.role]);

  useEffect(() => {
    if (initialCheckDone.current) {
        logger.debug('StoreProvider re-mounted, skipping initialization');
        return;
    }
    initialCheckDone.current = true;
    
    let unsubscribe: any;
    
    // Restore session immediately if local token exists
    const savedToken = localStorage.getItem('hgs_token');
    if (savedToken) {
      checkAuth(savedToken).catch(err => {
        logger.warn('[BOOT] Initial checkAuth failed:', err);
      });
    }
    
    // Auth initialization is already handled in firebase.ts.
    // Just set up the listener.
    unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const token = await firebaseUser.getIdToken();
          const hasExpiredTokenChange = token !== localStorage.getItem('hgs_token');
          // If token changed OR we current have no user state, we must authorize
          if (hasExpiredTokenChange || !user) {
            localStorage.setItem('hgs_token', token);
            await checkAuth(token);
          } else {
            setIsInitialAuthPerformed(true);
            setIsAuthChecking(false);
          }
        } else {
          if (localStorage.getItem('hgs_token')) {
            localStorage.removeItem('hgs_token');
            localStorage.removeItem('hgs_user');
            setUser(null);
          }
          setIsInitialAuthPerformed(true);
          setIsAuthChecking(false);
        }
      });
    
    // Auth error listeners
    const authErrListener = () => { setUser(null); };
    const dbErrListener = () => { setDbError(true); };
    window.addEventListener('auth_error', authErrListener);
    window.addEventListener('database_error', dbErrListener);
    
    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('auth_error', authErrListener);
      window.removeEventListener('database_error', dbErrListener);
    };
  }, []);

  // Startup Orchestrator Effect
  // Phase 1 to Phase 2 transition when auth verification finishes
  useEffect(() => {
    if (startupPhase === 1) {
      if (!isAuthChecking) {
        setStartupPhase(2);
      }
    }
  }, [isAuthChecking, startupPhase]);

  // Phase 2 triggers
  useEffect(() => {
    if (startupPhase === 2) {
      logger.info('[STARTUP_ORCHESTRATOR] Running Phase 2: Notifications & Settings');
      Promise.all([
        fetchNotifications().catch(err => logger.debug('[STARTUP] Initial Notifications failed:', err)),
        fetchConfig().catch(err => logger.debug('[STARTUP] Initial Config/Settings failed:', err))
      ]).then(() => {
        // Delay moving to Phase 3 slightly to let rendering complete and relieve API load
        setTimeout(() => {
          setStartupPhase(3);
        }, 400);
      });
    }
  }, [startupPhase, fetchNotifications, fetchConfig]);

  // Phase 3 triggers (Promotions, bulk discounts, announcements, addresses)
  useEffect(() => {
    if (startupPhase === 3) {
      logger.info('[STARTUP_ORCHESTRATOR] Running Phase 3: Promotions, Bulk Discounts, Announcements, Addresses');
      const promises: Promise<any>[] = [
        fetchPromotions().catch(err => logger.debug('[STARTUP] Initial Promotions failed:', err)),
        fetchBulkDiscounts().catch(err => logger.debug('[STARTUP] Initial Bulk Discounts failed:', err)),
        fetchAnnouncements().catch(err => logger.debug('[STARTUP] Initial Announcements failed:', err))
      ];
      if (user) {
        promises.push(fetchAddresses().catch(err => logger.debug('[STARTUP] Initial Addresses failed:', err)));
      }
      Promise.all(promises);
    }
  }, [startupPhase, user, fetchPromotions, fetchBulkDiscounts, fetchAnnouncements, fetchAddresses]);

  useEffect(() => {
    if (user) {
      if (startupPhase >= 3) {
        fetchAddresses();
      }
    } else {
      setAddresses([]);
    }
  }, [user, fetchAddresses, startupPhase]);

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
          // Don't immediately mark as down on a single non-2xx check
          failureCount++;
          if (failureCount > 2) setIsApiUp(false);
          console.warn(`[API MONITOR] /api/health returned non-2xx status: ${res.status}`);
        }
      } catch (err) {
        failureCount++;
        if (failureCount > 3) setIsApiUp(false);
        logger.warn('[API MONITOR] Temporary connection warning while checking health', err);
      }
    };
    
    if (startupPhase < 3) return;

    // Initial check
    checkApiHealth();
    
    // Poll every 45 seconds
    const interval = setInterval(checkApiHealth, 45000);
    
    return () => clearInterval(interval);
  }, [startupPhase]);

  // 4. Context Provider
  const contextValue = React.useMemo(() => ({
    user, setUser, cart, addToCart, removeFromCart, updateQuantity, clearCart, logout, performLogout, showLogoutDialog, setShowLogoutDialog,
    isMaintenance, setMaintenance: setIsMaintenance, checkMaintenance, fetchCart,
    authMode, updateProfile, refreshUser, fetchUser, wishlist, toggleWishlist, config, fetchConfig,
    subscribeNewsletter, unsubscribeNewsletter, checkNewsletterStatus, vibration, setVibration, notifications, setNotifications,
    sound, setSound, adminTheme, setAdminTheme, appliedCoupon, setAppliedCoupon,
    promotions, fetchPromotions, bulkDiscounts, fetchBulkDiscounts, getProductPrice,
    simulatedRole, setSimulatedRole,
    language, setLanguage, t, 
    addresses, fetchAddresses, saveAddress, deleteAddress, setDefaultAddress,
    isOnline, latency, isProfileComplete: () => true, isMobile, isTablet, isSyncingCart, syncCartToBackend,
    isAuthChecking, isRevalidating, setIsRevalidating, isInitialAuthPerformed, currentAlert, setCurrentAlert, markAlertAsRead, hasPermission, calculateDiscount,
    isSyncCartPending, logActivity, lastAddedId, fetchWithHandling, showImages, dbError, setDbError,
    notificationsList, unreadNotificationsCount, readNotificationIds, fetchNotifications, markNotificationAsRead,
    products, setProducts, fetchProducts, isLoadingProducts, fetchProductsError,
    isApiUp, setIsApiUp,
    categories, setCategories, fetchCategories, isLoadingCategories,
    announcements, fetchAnnouncements,
    prefetchProducts, prefetchProduct,
    startupPhase
  }), [user, cart, isMaintenance, checkMaintenance, config, wishlist, promotions, bulkDiscounts, language, addresses, isMobile, isTablet, isSyncingCart, isAuthChecking, isInitialAuthPerformed, currentAlert, isSyncCartPending, lastAddedId, showImages, dbError, fetchAddresses, refreshUser, syncCartToBackend, simulatedRole, 
    notifications, vibration, sound,
    notificationsList, unreadNotificationsCount, readNotificationIds, fetchNotifications, markNotificationAsRead,
    products, setProducts, fetchProducts, isLoadingProducts, fetchProductsError, isApiUp, isOnline, latency, categories, fetchCategories, isLoadingCategories,
    announcements, fetchAnnouncements, prefetchProducts, prefetchProduct, startupPhase]);

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
