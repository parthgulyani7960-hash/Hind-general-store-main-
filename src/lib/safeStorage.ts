import CryptoJS from 'crypto-js';

const getEncryptionKey = (): string => {
  return "hgs_secure_salt_928310!@#_prod_stable_v1";
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

  decrypt: (value: string): string | null => {
    if (!value) return null;
    if (!value.startsWith(ENCRYPTION_PREFIX)) {
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
      return null; // Don't return the raw ciphertext if decryption resulted in empty string
    } catch (e) {
      console.warn('Decryption failed, returning null', e);
      return null; // Return null on decryption failure
    }
  },

  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Since window.localStorage is transparently overridden to decrypt, 
        // calling it here is sufficient and avoids double-decryption.
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('localStorage access denied', e);
    }
    return null;
  },

  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Since window.localStorage is transparently overridden to encrypt,
        // calling it here is sufficient and avoids double-encryption.
        window.localStorage.setItem(key, value);
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

