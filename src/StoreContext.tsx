import React, { createContext, useContext, useState, useEffect } from 'react';
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
  deleteAddress: (id: number) => Promise<void>;
  setDefaultAddress: (id: number) => Promise<void>;
  isOnline: boolean;
  isProfileComplete: () => boolean;
  isMobile: boolean;
  isTablet: boolean;
  isSyncingCart: boolean;
  syncCartToBackend: (cartItems: CartItem[]) => Promise<void>;
  currentAlert: any;
  setCurrentAlert: (alert: any) => void;
  markAlertAsRead: (id: number) => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<any>(null);
  const [pendingAlerts, setPendingAlerts] = useState<any[]>([]);
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
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const token = await firebaseUser.getIdToken();
            localStorage.setItem('hgs_token', token);
            checkAuth(token);
          } catch (e) {
            console.error('Failed to get Firebase ID token', e);
            checkAuth();
          }
        } else {
          // User logged out
          setUser(null);
          localStorage.removeItem('hgs_token');
          localStorage.removeItem('hgs_user');
        }
    });
    return unsubscribe;
  }, []);

  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
        try {
            await auth.authStateReady();
            // Wait a small amount for onIdTokenChanged to potentially fire first, or just rely on current user
            const firebaseUser = auth.currentUser;
            if (firebaseUser) {
                const token = await firebaseUser.getIdToken();
                await checkAuth(token);
            } else {
                await checkAuth();
            }
        } catch(e) {
            await checkAuth();
        } finally {
            setIsAuthChecking(false);
        }
    };
    const handleAuthError = () => {
      setUser(null);
      localStorage.removeItem('hgs_user');
      localStorage.removeItem('hgs_token');
    };
    window.addEventListener('auth_error', handleAuthError);

    initAuth();
    checkMaintenance();

    return () => window.removeEventListener('auth_error', handleAuthError);
  }, []);

  useEffect(() => {
    if (user && !isAuthChecking) {
      fetchAlerts();
      const interval = setInterval(fetchAlerts, 15000);
      return () => clearInterval(interval);
    }
  }, [user, isAuthChecking]);

  const fetchAlerts = async () => {
    if (!user) return;
    try {
      const data = await fetchWithHandling<any[]>('/api/alerts');
      if (data && data.length > 0) {
        setPendingAlerts(data);
        if (!currentAlert) {
          setCurrentAlert(data[0]);
        }
      }
    } catch (err) {}
  };

  const markAlertAsRead = async (id: number) => {
    try {
      await fetchWithHandling(`/api/alerts/${id}/read`, { method: 'POST' });
      setPendingAlerts(prev => prev.filter(a => a.id !== id));
      if (currentAlert?.id === id) {
        setCurrentAlert(null);
      }
    } catch (err) {}
  };

  const checkAuth = async (fbToken?: string) => {
    try {
      const token = fbToken || localStorage.getItem('hgs_token');
      const data = await fetchWithHandling<any>('/api/auth/me', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (data && data.user) {
        setUser(data.user);
        localStorage.setItem('hgs_user', JSON.stringify(data.user));
      } else {
        setUser(null);
        localStorage.removeItem('hgs_user');
        localStorage.removeItem('hgs_token');
      }
    } catch (err) {
      setUser(null);
      localStorage.removeItem('hgs_user');
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const data = await fetchWithHandling<User>('/api/user/profile');
      if (data) {
        setUser(data);
      }
    } catch (err) {}
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    try {
      const result = await fetchWithHandling<any>('/api/user/update-profile', {
        method: 'POST',
        body: JSON.stringify({ ...data, id: user.id })
      });
      if (result?.success) {
        setUser(result.user);
        toast.success('Profile updated');
      }
    } catch (err) {}
  };

  const subscribeNewsletter = async (email: string) => {
    try {
      const data = await fetchWithHandling<any>('/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email, user_id: user?.id })
      });
      if (data?.success) {
        toast.success('Subscribed to newsletter!');
      }
    } catch (err) {}
  };

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoadedFromStorage, setCartLoadedFromStorage] = useState(false);
  const [isSyncingCart, setIsSyncingCart] = useState(false);

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

  const syncCartToBackend = async (cartItems: CartItem[]) => {
    if (!user) return;
    setIsSyncingCart(true);
    try {
        await fetchWithHandling('/api/cart/sync', {
            method: 'POST',
            body: JSON.stringify({ userId: user.id, items: cartItems })
        });
    } catch (err) {
        console.error('Failed to sync cart:', err);
    } finally {
        setIsSyncingCart(false);
    }
  };

  useEffect(() => {
    if (!cartLoadedFromStorage) return;
    localStorage.setItem('hgs_cart', JSON.stringify(cart));
    // syncCartToBackend(cart); // Leave sync to explicit calls for now, or keep it. Let's remove this to avoid double sync.
  }, [cart, cartLoadedFromStorage]);

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
      return saved || 'theme-navy';
    } catch (e) {
      return 'theme-navy';
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [promotions, setPromotions] = useState<PromotionRule[]>([]);
  const [bulkDiscounts, setBulkDiscounts] = useState<any[]>([]);
  const [simulatedRole, setSimulatedRole] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('hgs_lang');
    return (saved as Language) || 'en';
  });
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [lastAddedId, setLastAddedId] = useState<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online!');
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are currently offline. Some features may be unavailable.');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchAddresses = async () => {
    if (!user) return;
    setLoadingAddresses(true);
    try {
      const data = await fetchWithHandling<UserAddress[]>('/api/user/addresses');
      if (data) {
        setAddresses(data);
      }
    } catch (err) {
    } finally {
      setLoadingAddresses(false);
    }
  };

  const saveAddress = async (address: Partial<UserAddress>) => {
    try {
      const data = await fetchWithHandling<any>('/api/user/addresses', {
        method: 'POST',
        body: JSON.stringify(address)
      });
      if (data?.success) {
        toast.success(data.message);
        fetchAddresses();
      }
    } catch (err) {}
  };

  const deleteAddress = async (id: number) => {
    try {
      const data = await fetchWithHandling<any>(`/api/user/addresses/${id}`, { method: 'DELETE' });
      if (data?.success) {
        toast.success(data.message);
        fetchAddresses();
      }
    } catch (err) {}
  };

  const setDefaultAddress = async (id: number) => {
    try {
      const data = await fetchWithHandling<any>(`/api/user/addresses/${id}/default`, { method: 'POST' });
      if (data?.success) {
        toast.success(data.message);
        fetchAddresses();
      }
    } catch (err) {}
  };

  useEffect(() => {
    if (user) {
      fetchAddresses();
    } else {
      setAddresses([]);
    }
  }, [user?.id]);

  const t = (key: keyof typeof translations.en) => {
    return translations[language][key] || translations.en[key] || key;
  };

  const isProfileComplete = () => {
    if (!user) return true;
    
    // Admins don't need full profile
    if (user.role === 'admin') return true;

    // Check for mandatory fields: name, phone, and profile photo
    const hasName = user.name && user.name !== 'User';
    const hasPhone = !!user.phone;
    const hasPhoto = !!user.profile_photo;
    
    // We strictly enforce these for everyone to ensure order management is possible
    return !!(hasName && hasPhone && hasPhoto);
  };

  useEffect(() => {
    localStorage.setItem('hgs_lang', language);
  }, [language]);

  const fetchPromotions = async () => {
    try {
      const data = await fetchWithHandling<PromotionRule[]>('/api/promotions-rules');
      if (data) {
        setPromotions(data.filter((p: PromotionRule) => p.active));
      }
    } catch (err) {
      // Silently fail
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchBulkDiscounts = async () => {
    try {
      const data = await fetchWithHandling<any[]>('/api/bulk-discounts');
      if (data) {
        setBulkDiscounts(data);
      }
    } catch (err) {
      // Silently fail to avoid console spam during server restarts
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
      fetchWithHandling('/api/admin/settings', {
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
      fetchWithHandling('/api/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, items: cart })
      }).catch(err => console.error('Failed to sync cart:', err));
    }
  }, [cart, user, cartLoadedFromStorage]);

  const fetchCart = async (userId: number) => {
    try {
      const items = await fetchWithHandling<any[]>(`/api/cart?userId=${userId}`);
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
    } catch (err) {
      // Silently handle
    }
  };

  useEffect(() => {
    if (user) {
      fetchCart(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    // Seeded cart logic removed
  }, [cart.length, cartLoadedFromStorage]);

  useEffect(() => {
    localStorage.setItem('hgs_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const fetchConfig = async () => {
    // Now handled by checkMaintenance
  };

  const checkMaintenance = async () => {
    try {
      const data = await fetchWithHandling<any>('/api/settings');
      if (data) {
        setIsMaintenance(!!data.maintenance);
        if (data.authMode) setAuthMode(data.authMode);
        if (data.config) {
          setConfig(data.config);
          const themeSetting = data.config.find((s: any) => s.key === 'admin_theme');
          if (themeSetting) setAdminTheme(themeSetting.value);
        }
      }
    } catch (err) {
      // Silently fail during dev server restarts
    }
  };

  useEffect(() => {
    // Poll every 60 seconds for fast updates
    const interval = setInterval(() => {
      checkMaintenance();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const getProductPrice = (product: Product, userRole?: string) => {
    const activeRole = simulatedRole || userRole;
    if (activeRole === 'wholesaler' && product.wholesale_price) return product.wholesale_price;
    // For anyone else (guests, simple users, retailers), show the retail price if it exists
    if (product.retail_price) return product.retail_price;
    return product.price;
  };

  const addToCart = (product: Product, variant?: any, quantity: number = 1) => {
    let activePrice = getProductPrice(product, user?.role);
    
    // If variant is selected, use its price (applying product discount if any)
    if (variant) {
      activePrice = variant.price;
    }

    setCart(prev => {
      const existing = prev.find(item => 
        item.id === product.id && 
        (variant ? item.selectedVariant?.id === variant.id : !item.selectedVariant)
      );
      if (existing) {
        return prev.map(item => 
          (item.id === product.id && (variant ? item.selectedVariant?.id === variant.id : !item.selectedVariant))
            ? { ...item, quantity: item.quantity + quantity, price: activePrice } 
            : item
        );
      }
      return [...prev, { ...product, quantity, selectedVariant: variant, price: activePrice }];
    });
    
    // Set last added ID for feedback then clear it
    setLastAddedId(product.id);
    setTimeout(() => setLastAddedId(null), 2000);
    
    const displayName = `${product.name}${variant ? ` (${variant.name})` : ''}`;
    toast.success(`${displayName} added to bag`, {
      icon: '🛍️',
      position: 'bottom-center',
      className: 'bg-stone-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] px-6 py-4 border border-stone-800'
    });
    logActivity('CART_ADD', `Added ${quantity}x ${displayName} to cart`);
  };

  const removeFromCart = (productId: number, variantId?: number) => {
    setCart(prev => prev.filter(item => 
      !(item.id === productId && (variantId ? item.selectedVariant?.id === variantId : !item.selectedVariant))
    ));
  };

  const updateQuantity = (productId: number, delta: number, variantId?: number) => {
    if (delta > 0) {
      setLastAddedId(productId);
      setTimeout(() => setLastAddedId(null), 2000);
    }
    
    setCart(prev => {
      const item = prev.find(i => 
        i.id === productId && (variantId ? i.selectedVariant?.id === variantId : !i.selectedVariant)
      );
      
      if (item && item.quantity + delta <= 0) {
        toast.error('Item removed from bag', {
          icon: '🗑️',
          position: 'bottom-center',
          className: 'bg-stone-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] px-6 py-4 border border-stone-800'
        });
        return prev.filter(i => 
          !(i.id === productId && (variantId ? i.selectedVariant?.id === variantId : !i.selectedVariant))
        );
      }
      return prev.map(item => {
        if (item.id === productId && (variantId ? item.selectedVariant?.id === variantId : !item.selectedVariant)) {
          const activePrice = getProductPrice(item as any, user?.role);
          return { ...item, quantity: item.quantity + delta, price: activePrice };
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

  const logActivity = async (type: string, details: string, severity: 'low' | 'medium' | 'high' = 'low') => {
    try {
      await fetchWithHandling('/api/audit/log', {
        method: 'POST',
        body: JSON.stringify({ userId: user?.id, type, details, severity })
      });
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  };

  useEffect(() => {
    if (user?.id) {
       // Check if we just logged in (this session)
       const lastSessionId = sessionStorage.getItem('hgs_session_id');
       if (!lastSessionId) {
          const newSessionId = Math.random().toString(36).substring(7);
          sessionStorage.setItem('hgs_session_id', newSessionId);
          logActivity('LOGIN', `User session started - ID: ${newSessionId}`);
       }
    }
  }, [user?.id]);

  const logout = async () => {
    if (user) {
      await logActivity('LOGOUT', 'User logged out voluntarily');
    }
    
    // Sign out from Firebase
    try {
      await signOutUser();
    } catch (e) {
      console.error('Firebase signout failed', e);
    }
    
    try {
      await fetchWithHandling('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout request failed');
    }
    setUser(null);
    localStorage.removeItem('hgs_user');
    localStorage.removeItem('hgs_token');
    sessionStorage.removeItem('hgs_session_id');
    toast.success('Logged out successfully');
  };

  const hasPermission = (permission: Permission) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions?.includes(permission) ?? false;
  };

  const calculateDiscount = (cart: CartItem[]) => {
    let totalDiscount = 0;
    promotions.forEach(promo => {
      if (!promo.active) return;
      
      const eligibleItems = cart.filter(item => {
        if (promo.target_type === 'all') return true;
        if (promo.target_type === 'category') return item.category === promo.target_id;
        if (promo.target_type === 'product') return String(item.id) === String(promo.target_id);
        return false;
      });

      if (eligibleItems.length === 0) return;

      const totalEligibleQty = eligibleItems.reduce((acc, item) => acc + item.quantity, 0);

      if (promo.type === 'percentage') {
        if (!promo.condition_qty || totalEligibleQty >= promo.condition_qty) {
          eligibleItems.forEach(item => {
            totalDiscount += (item.price * item.quantity * promo.discount_value) / 100;
          });
        }
      } else if (promo.type === 'fixed') {
        if (!promo.condition_qty || totalEligibleQty >= promo.condition_qty) {
          totalDiscount += promo.discount_value; 
        }
      } else if (promo.type === 'bogo') {
          eligibleItems.forEach(item => {
             if (item.quantity >= (promo.condition_qty || 2)) {
                 const freeItems = Math.floor(item.quantity / (promo.condition_qty || 2)) * (promo.reward_qty || 1);
                 totalDiscount += freeItems * item.price;
             }
          });
      }
    });
    return totalDiscount;
  };

  const contextValue = React.useMemo(() => ({ 
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
      promotions, fetchPromotions,
      bulkDiscounts, fetchBulkDiscounts,
      getProductPrice,
      simulatedRole, setSimulatedRole,
      language, setLanguage, t,
      addresses, fetchAddresses, saveAddress, deleteAddress, setDefaultAddress,
      isOnline, isProfileComplete,
      isMobile, isTablet, lastAddedId, isSyncingCart, syncCartToBackend,
      logActivity,
      currentAlert, setCurrentAlert, markAlertAsRead,
      hasPermission,
      calculateDiscount
    }), [user, cart, isMaintenance, cartLoadedFromStorage, wishlist, config, vibration, notifications, sound, adminTheme, appliedCoupon, bulkDiscounts, simulatedRole, language, addresses, isOnline, isMobile, isTablet, lastAddedId, currentAlert, pendingAlerts, promotions]);

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
