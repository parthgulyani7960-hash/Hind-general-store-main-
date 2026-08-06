import CryptoJS from 'crypto-js';

const getEncryptionKey = (): string => {
  const base = "hgs_secure_salt_928310!@#_prod";
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'node';
  const screenInfo = typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : 'screen';
  return `${base}_${userAgent}_${screenInfo}`;
};

const ENCRYPTION_PREFIX = '__enc__::';

export const safeStorage = {
  encrypt: (value: string): string => {
    try {
      const key = getEncryptionKey();
      const encrypted = CryptoJS.AES.encrypt(value, key).toString();
      return `${ENCRYPTION_PREFIX}${encrypted}`;
    } catch (e) {
      console.warn('Encryption failed, storing in plaintext fallback', e);
      return value;
    }
  },

  decrypt: (value: string): string => {
    if (!value || !value.startsWith(ENCRYPTION_PREFIX)) {
      return value;
    }
    try {
      const key = getEncryptionKey();
      const cipherText = value.slice(ENCRYPTION_PREFIX.length);
      const bytes = CryptoJS.AES.decrypt(cipherText, key);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      if (decrypted) {
        return decrypted;
      }
      return value; // fallback to original if decrypted is empty
    } catch (e) {
      console.warn('Decryption failed, returning raw value', e);
      return value;
    }
  },

  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(key);
        if (raw === null) return null;
        return safeStorage.decrypt(raw);
      }
    } catch (e) {
      console.warn('localStorage access denied', e);
    }
    return null;
  },

  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const encrypted = safeStorage.encrypt(value);
        window.localStorage.setItem(key, encrypted);
      }
    } catch (e) {
      console.warn('localStorage access denied', e);
    }
  },

  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('localStorage access denied', e);
    }
  },

  clear: (): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch (e) {
      console.warn('localStorage access denied', e);
    }
  },

  get length(): number {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.length;
      }
    } catch (e) {
      console.warn('localStorage access denied', e);
    }
    return 0;
  },

  key: (index: number): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.key(index);
      }
    } catch (e) {
      console.warn('localStorage access denied', e);
    }
    return null;
  }
};

