/**
 * CSRF Token Utility
 * 
 * Reads the XSRF token from cookies (set by backend with httpOnly: false)
 * so that it can be included in request headers for double-submit CSRF protection.
 */

export function getXsrfToken(): string | null {
  // Read the __Host-XSRF-TOKEN cookie
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === '__Host-XSRF-TOKEN' || name === 'XSRF-TOKEN') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Check if XSRF token exists in cookies
 */
export function hasXsrfToken(): boolean {
  return getXsrfToken() !== null;
}
