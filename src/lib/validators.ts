// ── Shared validation utilities for Tech Carnival 2K26 ──

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/** Strip HTML tags and trim whitespace */
export function sanitizeInput(input: string): string {
  return input.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

/** Full name: letters + spaces only, 2–20 chars, no consecutive spaces */
export function validateName(name: string): ValidationResult {
  const s = sanitizeInput(name);
  if (!s) return { valid: false, error: "Full name is required" };
  if (s.length < 2) return { valid: false, error: "Name must be at least 2 characters" };
  if (s.length > 20) return { valid: false, error: "Name must not exceed 20 characters" };
  if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(s))
    return { valid: false, error: "Name must contain only letters and spaces" };
  return { valid: true };
}

/** Phone: exactly 10 digits starting with 6-9 */
export function validatePhone(phone: string): ValidationResult {
  const s = phone.trim();
  if (!s) return { valid: false, error: "Phone number is required" };
  if (!/^\d{10}$/.test(s)) return { valid: false, error: "Enter a valid 10-digit Indian mobile number" };
  if (!/^[6-9]/.test(s)) return { valid: false, error: "Phone number must start with 6, 7, 8, or 9" };
  return { valid: true };
}

/** Email: standard format, max 50 chars */
export function validateEmail(email: string): ValidationResult {
  const s = email.trim().toLowerCase();
  if (!s) return { valid: false, error: "Email is required" };
  if (s.length > 50) return { valid: false, error: "Email must not exceed 50 characters" };
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(s))
    return { valid: false, error: "Enter a valid email address (e.g., name@example.com)" };
  return { valid: true };
}

/** Team name: alphanumeric, spaces, hyphens, 3–30 chars */
export function validateTeamName(name: string): ValidationResult {
  const s = sanitizeInput(name);
  if (!s) return { valid: false, error: "Team name is required" };
  if (s.length < 3) return { valid: false, error: "Team name must be at least 3 characters" };
  if (s.length > 30) return { valid: false, error: "Team name must not exceed 30 characters" };
  if (!/^[A-Za-z0-9][A-Za-z0-9 -]*$/.test(s))
    return { valid: false, error: "Team name can only contain letters, numbers, spaces, and hyphens" };
  return { valid: true };
}

/** College name: letters, spaces, periods, commas, 3–100 chars */
export function validateCollegeName(name: string): ValidationResult {
  const s = sanitizeInput(name);
  if (!s) return { valid: false, error: "College name is required" };
  if (s.length < 3) return { valid: false, error: "College name must be at least 3 characters" };
  if (s.length > 100) return { valid: false, error: "College name must not exceed 100 characters" };
  return { valid: true };
}

/** Message: 10–500 chars */
export function validateMessage(msg: string): ValidationResult {
  const s = sanitizeInput(msg);
  if (!s) return { valid: false, error: "Message is required" };
  if (s.length < 10) return { valid: false, error: "Message must be at least 10 characters" };
  if (s.length > 500) return { valid: false, error: "Message must not exceed 500 characters" };
  return { valid: true };
}

/** Count errors in a record */
export function countErrors(errors: Record<string, string>): number {
  return Object.keys(errors).length;
}
