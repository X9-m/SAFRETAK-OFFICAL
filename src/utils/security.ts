/**
 * Safretak Security & Validation Suite
 * Implements input sanitization, length boundaries, pattern validations, and XSS prevention
 * to keep the application stable, clean, and production-ready.
 */

/**
 * Sanitizes user input to prevent Cross-Site Scripting (XSS) and injection attacks.
 * Strips out HTML/XML tags and converts control characters to safe entities.
 */
export function sanitizeInput(value: string): string {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[<>'"&;]/g, (char) => {
      switch (char) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#x27;';
        case '&': return '&amp;';
        case ';': return ' ';
        default: return char;
      }
    });
}

/**
 * Validates whether string is within safe length boundaries.
 */
export function validateLength(value: string, min: number, max: number): boolean {
  if (typeof value !== 'string') return false;
  const len = value.trim().length;
  return len >= min && len <= max;
}

/**
 * Jordanian phone number validator.
 * Accepts:
 * - Local format starting with 07 or 7 and has 9 or 10 digits (e.g., 0795432109, 795432109)
 * - Cleaned numbers containing only digits
 */
export function isValidJordanPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/\s+/g, '').replace(/[^0-9]/g, '');
  return /^(07[789]\d{7}|7[789]\d{7})$/.test(cleaned);
}

/**
 * Cleans the phone number to a standard representation without spaces or non-digits.
 */
export function cleanPhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/\s+/g, '').replace(/[^0-9]/g, '');
}

/**
 * Full name validator.
 * Requires at least two words, and each word must be at least 2 characters.
 */
export function validateFullName(name: string): boolean {
  if (!name) return false;
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 && parts.every(part => part.length >= 2);
}

/**
 * Gmail pattern validator.
 * Enforces valid Gmail address or empty if optional.
 */
export function validateGmail(email: string): boolean {
  if (!email) return true; // Optional field
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email.trim().toLowerCase());
}

/**
 * General email validator.
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
}

/**
 * Security audit helper to identify malicious strings.
 */
export function isSuspicious(value: string): boolean {
  if (!value) return false;
  const lower = value.toLowerCase();
  const patterns = [
    'javascript:',
    'onload=',
    'onerror=',
    '<script',
    'union select',
    'drop table',
    '--'
  ];
  return patterns.some(pattern => lower.includes(pattern));
}
