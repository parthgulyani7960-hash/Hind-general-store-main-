
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Standardized Redaction Utility
 * Deeply redacts sensitive keys from objects and arrays
 */
export function redactSensitive(data: any): any {
  if (typeof data !== 'object' || data === null) {
    // Redact email-like strings or long hash-like strings
    if (typeof data === 'string') {
      if (data.includes('@') && data.includes('.')) return '[REDACTED_IDENTITY]';
      if (data.length > 25 && /^[a-zA-Z0-9-_]+$/.test(data)) return '[REDACTED_HASH]';
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => redactSensitive(item));
  }

  const redacted: Record<string, any> = {};
  for (const key in data) {
    const value = data[key];
    const lowKey = key.toLowerCase();
    
    const isSensitiveKey = 
      lowKey.includes('email') || 
      lowKey.includes('uid') || 
      lowKey.includes('phone') ||
      lowKey.includes('password') || 
      lowKey.includes('token') ||
      lowKey.includes('role') ||
      lowKey.includes('permission') ||
      lowKey.includes('isadmin') ||
      lowKey.includes('secret') ||
      lowKey.includes('key') ||
      lowKey.includes('auth') ||
      lowKey.includes('idToken') ||
      lowKey.includes('access_token') ||
      lowKey.includes('credential');

    if (isSensitiveKey) {
      redacted[key] = '[REDACTED_SENSITIVE]';
    } else if (typeof value === 'object') {
      redacted[key] = redactSensitive(value);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

/**
 * Production-Safe Logger
 * Silences logs in production except for redacted errors.
 */
export const logger = {
  info: (message: string, ...args: any[]) => {
    if (!isProduction) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (!isProduction) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    // Errors are ALWAYS logged, but sensitive data is redacted in ALL environments for safety
    console.error(`[ERROR] ${message}`, ...args.map(arg => redactSensitive(arg)));
  },
  debug: (message: string, ...args: any[]) => {
    if (!isProduction) {
       console.log(`[DEBUG] ${message}`, ...args);
    }
  },
  /**
   * Specialized route logger for Express and API calls
   */
  route: (method: string, path: string, status: number, duration?: number) => {
    if (!isProduction) {
      console.log(`[RES] ${method} ${path} ${status}${duration ? ` - ${duration}ms` : ''}`);
    } else if (status >= 400) {
      // Only log failed requests in production
      console.error(`[ERR_RES] ${method} ${path} ${status}`);
    }
  }
};

export default logger;
