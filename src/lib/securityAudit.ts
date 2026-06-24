import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Memory store for tracking real-time IP/Session security metrics (IDS)
interface ThreatTracker {
  failedLogins: number;
  requestCount: number;
  unauthorizedAttempts: number;
  injectionAttempts: number;
  lastSeen: number;
  score: number;
  blockedUntil?: number;
}

const threatMap = new Map<string, ThreatTracker>();

// Threat thresholds
const SCORE_LIMITS = {
  SUSPICIOUS: 10,
  BLOCKED: 50,
  CRITICAL: 100, // Trigger maintenance mode
};

// Global threat state
let systemThreatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
let isAutoMaintenanceMode = false;
let maintenanceReason = '';
let maintenanceTriggeredAt = '';

/**
 * XSS & HTML Injection Sanitization
 * Removes dangerous tags and attributes recursively from objects
 */
export function sanitizeInput(data: any): any {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    // Regex for typical XSS attack vectors
    return data
      .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:\s*[^"']*/gi, '')
      .replace(/<iframe[^>]*>([\s\S]*?)<\/iframe>/gi, '')
      .replace(/<\/?[^>]+(>|$)/g, ''); // Strip remaining HTML tags
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeInput(item));
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, any> = {};
    for (const key in data) {
      sanitized[key] = sanitizeInput(data[key]);
    }
    return sanitized;
  }

  return data;
}

/**
 * Cryptographically sign QR code strings using HMAC-SHA256
 */
export function signQRCode(qrString: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret || 'hgs-qr-crypt-2026')
    .update(qrString)
    .digest('hex');
}

/**
 * Verify integrity and cryptographic signature of a UPI QR Code
 */
export function verifyQRCode(qrString: string, signature: string, secret: string): boolean {
  if (!signature) return false;
  const expected = signQRCode(qrString, secret);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

/**
 * Secure Validation of Base64 uploaded files (MIME type, size & contents)
 */
export function validateBase64Image(base64: string): { valid: boolean; error?: string; mime?: string; sizeBytes?: number } {
  if (!base64 || typeof base64 !== 'string') {
    return { valid: false, error: 'Empty or invalid file payload' };
  }

  // Parse Data URL format
  const match = base64.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    // Check if it's raw base64 without header
    const rawBuffer = Buffer.from(base64, 'base64');
    if (rawBuffer.length > 5 * 1024 * 1024) {
      return { valid: false, error: 'File size exceeds 5MB limit' };
    }
    return { valid: true, sizeBytes: rawBuffer.length };
  }

  const mime = match[1].toLowerCase();
  const rawData = match[2];
  const buffer = Buffer.from(rawData, 'base64');
  const sizeBytes = buffer.length;

  // 1. File size limit check (5MB)
  if (sizeBytes > 5 * 1024 * 1024) {
    return { valid: false, error: 'File size exceeds 5MB limit' };
  }

  // 2. MIME type verification
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedMimeTypes.includes(mime)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, WEBP and GIF are allowed.' };
  }

  // 3. Executable/Malware structural signatures check
  // Look for standard script tags or executable magic bytes (e.g., MZ header for PE files)
  if (buffer.length >= 2) {
    const magicHex = buffer.toString('hex', 0, 2);
    if (magicHex === '4d5a') { // 'MZ' signature for .exe, .dll
      return { valid: false, error: 'Security Alert: Executable binary files are strictly prohibited.' };
    }
  }

  // Check for embedded HTML/Script content inside image binary metadata (Polyglot files)
  const binaryString = buffer.toString('utf8', 0, Math.min(buffer.length, 4096));
  if (binaryString.includes('<script') || binaryString.includes('<?php') || binaryString.includes('eval(')) {
    return { valid: false, error: 'Security Alert: Malicious script injection detected inside image metadata.' };
  }

  return { valid: true, mime, sizeBytes };
}

/**
 * Intrusion Detection System (IDS) Engine
 * Registers anomalous incidents, adjusts individual threat scores,
 * and escalates system threat levels or triggers automated maintenance lockouts.
 */
export function registerSecurityIncident(
  ip: string,
  type: 'failed_login' | 'unauthorized_admin' | 'injection_attempt' | 'csrf_tamper' | 'file_attack' | 'api_abuse',
  details: string
): { score: number; blocked: boolean; level: string } {
  const now = Date.now();
  let tracker = threatMap.get(ip);

  if (!tracker) {
    tracker = {
      failedLogins: 0,
      requestCount: 0,
      unauthorizedAttempts: 0,
      injectionAttempts: 0,
      lastSeen: now,
      score: 0,
    };
    threatMap.set(ip, tracker);
  }

  tracker.lastSeen = now;

  // Scoring weights depending on incident severity
  let weight = 1;
  switch (type) {
    case 'failed_login':
      tracker.failedLogins++;
      weight = 5;
      break;
    case 'unauthorized_admin':
      tracker.unauthorizedAttempts++;
      weight = 20;
      break;
    case 'injection_attempt':
      tracker.injectionAttempts++;
      weight = 30;
      break;
    case 'csrf_tamper':
      weight = 15;
      break;
    case 'file_attack':
      weight = 40;
      break;
    case 'api_abuse':
      weight = 10;
      break;
  }

  tracker.score += weight;

  // Block temporary if score exceeds block limit
  let blocked = false;
  if (tracker.score >= SCORE_LIMITS.BLOCKED) {
    tracker.blockedUntil = now + 15 * 60 * 1000; // 15-minute block
    blocked = true;
  }

  // Calculate system-wide global threat level
  recalculateSystemThreatLevel();

  // If score crosses system threshold, trigger automated emergency lockdown
  if (tracker.score >= SCORE_LIMITS.CRITICAL && !isAutoMaintenanceMode) {
    triggerLockdown(`Intrusion attempt from IP ${ip} - Threat score reached ${tracker.score} (type: ${type})`);
  }

  return {
    score: tracker.score,
    blocked,
    level: systemThreatLevel,
  };
}

/**
 * Check if an IP address is currently blocked by the IDS
 */
export function isIpBlocked(ip: string): boolean {
  const tracker = threatMap.get(ip);
  if (!tracker || !tracker.blockedUntil) return false;
  
  if (Date.now() > tracker.blockedUntil) {
    // Unblock expired
    tracker.blockedUntil = undefined;
    tracker.score = Math.floor(SCORE_LIMITS.BLOCKED / 2); // reset half score
    return false;
  }
  return true;
}

/**
 * System-wide recalculation of Threat Index
 */
function recalculateSystemThreatLevel() {
  let highestScore = 0;
  for (const tracker of threatMap.values()) {
    if (tracker.score > highestScore) highestScore = tracker.score;
  }

  if (highestScore >= SCORE_LIMITS.CRITICAL || isAutoMaintenanceMode) {
    systemThreatLevel = 'CRITICAL';
  } else if (highestScore >= SCORE_LIMITS.BLOCKED) {
    systemThreatLevel = 'HIGH';
  } else if (highestScore >= SCORE_LIMITS.SUSPICIOUS) {
    systemThreatLevel = 'MEDIUM';
  } else {
    systemThreatLevel = 'LOW';
  }
}

/**
 * Triggers full storefront emergency maintenance mode lockdown
 */
export function triggerLockdown(reason: string) {
  isAutoMaintenanceMode = true;
  systemThreatLevel = 'CRITICAL';
  maintenanceReason = reason;
  maintenanceTriggeredAt = new Date().toISOString();
  console.error(`!!! SECURITY LOCKDOWN ENFORCED !!! Reason: ${reason}`);
}

/**
 * Resets / de-escalates security lockdown
 */
export function releaseLockdown() {
  isAutoMaintenanceMode = false;
  systemThreatLevel = 'LOW';
  maintenanceReason = '';
  maintenanceTriggeredAt = '';
  threatMap.clear();
  console.log(`Security lockdown cleared by administrator.`);
}

export function getSystemSecurityStatus() {
  let activeIncidents = 0;
  let totalScore = 0;
  for (const tracker of threatMap.values()) {
    if (tracker.score > 0) {
      activeIncidents++;
      totalScore += tracker.score;
    }
  }

  return {
    threatLevel: systemThreatLevel,
    isMaintenanceMode: isAutoMaintenanceMode,
    maintenanceReason,
    maintenanceTriggeredAt,
    activeIncidents,
    totalThreatScore: totalScore,
    scoreLimits: SCORE_LIMITS,
    ipTrackers: Array.from(threatMap.entries()).map(([ip, data]) => ({
      ip,
      ...data,
      blocked: data.blockedUntil ? Date.now() < data.blockedUntil : false,
      blockedRemainingMs: data.blockedUntil ? Math.max(0, data.blockedUntil - Date.now()) : 0
    }))
  };
}

/**
 * Verify Integrity of Critical System Files (Core code footprint verification)
 */
export function verifySystemIntegrity(): { 
  valid: boolean; 
  errors: string[]; 
  checkedFiles: string[]; 
} {
  const errors: string[] = [];
  const checkedFiles: string[] = ['server.ts', 'package.json', '.env.example', 'index.html'];
  
  // Verify key environment variables
  const criticalEnvVars = ['SESSION_SECRET', 'FIREBASE_SERVICE_ACCOUNT_KEY'];
  criticalEnvVars.forEach(env => {
    if (!process.env[env]) {
      errors.push(`Missing critical configuration variable: ${env}`);
    } else if (process.env[env] === 'placeholder' || process.env[env]?.length < 5) {
      errors.push(`Vulnerable or placeholder value configured for: ${env}`);
    }
  });

  // Verify file footprints
  checkedFiles.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (!fs.existsSync(fullPath)) {
      errors.push(`System Integrity Breach: Missing critical source file: ${file}`);
    } else {
      const stats = fs.statSync(fullPath);
      if (stats.size === 0) {
        errors.push(`System Integrity Breach: Critical file ${file} is empty`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    checkedFiles
  };
}
