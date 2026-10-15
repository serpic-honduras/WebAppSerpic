
// Project name validation - must be between 2 and 100 characters
export const validateProjectName = (name: string): boolean => {
  if (!name || typeof name !== 'string') return false;
  const trimmedName = name.trim();
  return trimmedName.length >= 2 && trimmedName.length <= 100;
};

// Email validation - must be a valid email format
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation - more permissive to accept various international formats
export const validatePhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') return false;
  
  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Accept phone numbers with 7-15 digits (international standard)
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
};

// Date validation - ensure date is valid and not empty
export const validateDate = (date: string): boolean => {
  if (!date || typeof date !== 'string') return false;
  
  // Check if it's a valid date string in YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  // Check if it's a valid date
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === date;
};

// Amount validation - must be a valid positive number
export const validateAmount = (amount: number): boolean => {
  if (typeof amount !== 'number') return false;
  return amount >= 0;
};

// Password validation - must meet security requirements
export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }
  
  return { isValid: true };
};

// Enhanced email validation that returns detailed result
export const validateEmailDetailed = (email: string): { isValid: boolean; error?: string } => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  return { isValid: true };
};

// Sanitize input to prevent XSS attacks
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove HTML tags and encode special characters
  const sanitized = input.replace(/<[^>]*>?/gm, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  return sanitized.trim();
};
