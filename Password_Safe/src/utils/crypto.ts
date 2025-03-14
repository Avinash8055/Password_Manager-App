// Utility functions for encryption and security

/**
 * Derives an encryption key from the master password
 */
async function deriveKey(password: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  // Create a key from the password
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  // Use PBKDF2 to derive a key
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('your-secure-salt'), // In production, use a unique salt per user
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts data using AES-GCM
 */
export async function encryptData(data: string, password: string): Promise<string> {
  const key = await deriveKey(password);
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    encoder.encode(data)
  );
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + new Uint8Array(encryptedData).length);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedData), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts data using AES-GCM
 */
export async function decryptData(encryptedData: string, password: string): Promise<string> {
  const key = await deriveKey(password);
  const decoder = new TextDecoder();
  const combined = new Uint8Array(
    atob(encryptedData)
      .split('')
      .map(char => char.charCodeAt(0))
  );
  
  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  
  const decryptedData = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    data
  );
  
  return decoder.decode(decryptedData);
}

/**
 * Generates a secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }
  
  return password;
}

// Rate limiting for password attempts
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes
let attempts = 0;
let lastAttemptTime = 0;

export function checkPasswordAttempts(): boolean {
  const now = Date.now();
  
  // Reset attempts after lockout period
  if (now - lastAttemptTime > LOCKOUT_TIME) {
    attempts = 0;
  }
  
  if (attempts >= MAX_ATTEMPTS) {
    const remainingLockout = LOCKOUT_TIME - (now - lastAttemptTime);
    if (remainingLockout > 0) {
      throw new Error(`Too many attempts. Please try again in ${Math.ceil(remainingLockout / 60000)} minutes.`);
    }
    attempts = 0;
  }
  
  attempts++;
  lastAttemptTime = now;
  return true;
}