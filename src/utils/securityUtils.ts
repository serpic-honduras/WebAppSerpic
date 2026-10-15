
// Security utilities for the application

// Enhanced HTML sanitization using browser's built-in DOMParser
export const sanitizeHtml = (input: string): string => {
  if (!input) return '';
  
  // Create a temporary div to safely parse HTML
  const div = document.createElement('div');
  div.textContent = input;
  
  // Additional XSS protection - remove potentially dangerous patterns
  let sanitized = div.innerHTML;
  
  // Remove javascript: protocols
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: protocols (except images)
  sanitized = sanitized.replace(/data:(?!image\/)/gi, '');
  
  // Remove on* event handlers
  sanitized = sanitized.replace(/\son\w+\s*=/gi, '');
  
  return sanitized;
};

// Enhanced rate limiting for API calls with persistent storage
export class RateLimiter {
  private storageKey: string;
  
  constructor(
    private maxRequests: number = 50, 
    private windowMs: number = 60000,
    private keyPrefix: string = 'rate_limit'
  ) {
    this.storageKey = `${keyPrefix}_requests`;
  }
  
  private getStoredRequests(): Map<string, number[]> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        return new Map(Object.entries(data).map(([k, v]) => [k, v as number[]]));
      }
    } catch (error) {
      console.warn('Failed to load rate limit data:', error);
    }
    return new Map();
  }
  
  private storeRequests(requests: Map<string, number[]>): void {
    try {
      const data = Object.fromEntries(requests);
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to store rate limit data:', error);
    }
  }
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    const requests = this.getStoredRequests();
    
    if (!requests.has(key)) {
      requests.set(key, []);
    }
    
    const userRequests = requests.get(key)!;
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => time > windowStart);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    requests.set(key, validRequests);
    
    // Clean up old entries periodically
    this.cleanupOldEntries(requests, windowStart);
    
    this.storeRequests(requests);
    return true;
  }
  
  private cleanupOldEntries(requests: Map<string, number[]>, windowStart: number): void {
    for (const [key, times] of requests.entries()) {
      const validTimes = times.filter(time => time > windowStart);
      if (validTimes.length === 0) {
        requests.delete(key);
      } else {
        requests.set(key, validTimes);
      }
    }
  }
}

// Enhanced API rate limiter with different limits for different operations
export const apiRateLimiter = new RateLimiter(50, 60000, 'api'); // 50 requests per minute
export const authRateLimiter = new RateLimiter(10, 300000, 'auth'); // 10 auth attempts per 5 minutes
export const projectRateLimiter = new RateLimiter(100, 60000, 'project'); // 100 project operations per minute

// CSRF token generation for additional security
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Secure random ID generation
export const generateSecureId = (): string => {
  return crypto.randomUUID();
};
