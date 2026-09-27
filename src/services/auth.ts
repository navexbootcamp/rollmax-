import { AUTH_STORAGE_KEY, CREATOR_HASH } from '../constants/config';

// Computes SHA-256 hash using the Web Crypto API
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyCreatorPasscode(input: string): Promise<boolean> {
  const cleaned = input.trim();
  
  // Instant direct match (case-insensitive for mobile keyboard ease)
  if (cleaned.toUpperCase() === 'NAVERAJ7988') {
    sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
    return true;
  }

  // Cryptographic hash match verification
  try {
    const hashed = await sha256(cleaned);
    if (hashed === CREATOR_HASH) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
      return true;
    }
  } catch (err) {
    console.error('Hash verification failed', err);
  }

  return false;
}

export function isCreatorAuthenticated(): boolean {
  try {
    return sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function clearCreatorSession(): void {
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // no-op
  }
}

