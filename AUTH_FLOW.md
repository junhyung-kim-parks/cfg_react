# Authentication Flow Documentation

## Overview

This application implements a secure JWT + CSRF + LDAP authentication system with the following characteristics:

- **Access Token (AT)**: Short-lived JWT stored in memory (React state)
- **Refresh Token (RT)**: Long-lived JWT stored in HttpOnly + Secure cookie
- **XSRF Token**: CSRF protection token stored in non-HttpOnly cookie
- **LDAP Integration**: Backend validates credentials against Active Directory

## Security Principles

1. **Access Token in Memory**: Never stored in localStorage to prevent XSS attacks
2. **Refresh Token in HttpOnly Cookie**: JavaScript cannot access, prevents XSS theft
3. **CSRF Protection**: Double-submit cookie pattern with XSRF tokens
4. **Token Rotation**: Refresh tokens are rotated on every refresh (one-time use)
5. **Whitelist System**: Backend maintains JTI whitelist in Redis/memory

## Step-by-Step Flow

### 0. Initial State

- Browser: No cookies
- Frontend: No access token
- Backend: Redis/memory JTI store (empty)

### 1. Login Request

**Frontend:**
```typescript
POST /auth/login
Body: { username: "john.doe", password: "password123" }
Headers: 
  - Content-Type: application/json
  - NO Authorization header
  - NO CSRF header (login is exempt)
```

**Backend Process:**
1. Receives login request
2. Attempts LDAP bind: `ldap://server` with `nycdpr\{username}`
3. On LDAP success:
   - Query DB for user profile (view_web_role_based_user_list)
   - Generate JWT Access Token (AT) - 15 min expiry
   - Generate JWT Refresh Token (RT) - 7 day expiry with JTI
   - Register JTI in whitelist (Redis/memory)
   - Generate XSRF token
4. Set cookies:
   - `refresh_token`: HttpOnly, Secure, SameSite=Strict (RT)
   - `__Host-XSRF-TOKEN`: Secure, SameSite=Strict, httpOnly=false (XSRF)

**Response:**
```json
{
  "access": "eyJhbGci...",
  "profile": { 
    "id": "user-001",
    "name": "John Doe",
    "email": "john.doe@parks.nyc.gov",
    "role": "Admin",
    ...
  },
  "xsrfHeader": "X-CSRF-Token"
}
```

**Frontend Actions:**
```typescript
// Store access token in memory (React state)
setAccessToken(response.access);

// Store user profile in context
setUser(response.profile);

// Cookies are automatically stored by browser
// - refresh_token (HttpOnly - JS cannot access)
// - __Host-XSRF-TOKEN (JS can read for header)
```

### 2. Protected API Calls

**Frontend:**
```typescript
// Read CSRF token from cookie
const xsrfToken = getXsrfToken(); // Reads __Host-XSRF-TOKEN

// Make request
GET /api/projects
Headers:
  - Authorization: Bearer {accessToken}
  - X-CSRF-Token: {xsrfToken}
  - Accept: application/json
Credentials: include (sends cookies)
```

**Backend Process:**
1. JwtAuthGuard extracts Bearer token
2. Verifies JWT signature and expiry
3. If valid: `req.user = payload`, continues
4. If invalid/expired: Returns 401 Unauthorized

**Frontend Auto-Retry on 401:**
```typescript
// Automatic refresh attempt (in http.ts)
if (response.status === 401 && accessToken) {
  const refreshed = await attemptTokenRefresh();
  if (refreshed) {
    // Retry original request with new token
    return httpGet(path, init);
  }
  // If refresh fails, throw error (user logged out)
}
```

### 3. Token Refresh

**Trigger:** Access token expires (401 response) or manual refresh

**Frontend:**
```typescript
POST /auth/refresh
Headers:
  - X-CSRF-Token: {xsrfToken}  // Required!
  - Content-Type: application/json
  - Accept: application/json
  - NO Authorization header
Credentials: include (sends RT cookie automatically)
```

**Backend Process:**
1. CsrfService validates XSRF token:
   - Compare cookie `__Host-XSRF-TOKEN` with header `X-CSRF-Token`
   - If mismatch/missing: Return 401
2. Extract RT from `refresh_token` cookie
3. Verify RT signature and claims:
   - Must have `typ: "refresh"`
   - Must have valid `jti`
4. Check JTI whitelist:
   - If JTI not in store: Return 401/403 (revoked/expired)
5. Token Rotation:
   - Delete old JTI from whitelist
   - Generate new RT with new JTI
   - Register new JTI in whitelist
   - Generate new AT
   - Generate new XSRF token
6. Set new cookies:
   - New `refresh_token` cookie
   - New `__Host-XSRF-TOKEN` cookie

**Response:**
```json
{
  "access": "eyJhbGci...new-token..."
}
```

**Frontend Actions:**
```typescript
// Update access token in memory
setAccessToken(response.access);

// New RT and XSRF cookies are automatically updated by browser
```

### 4. Logout

**Frontend:**
```typescript
POST /auth/logout
Headers:
  - Authorization: Bearer {accessToken}
  - X-CSRF-Token: {xsrfToken}
  - Content-Type: application/json
Credentials: include
```

**Backend Process:**
1. Validate XSRF token (CSRF protection)
2. Extract RT from cookie
3. Decode RT and get JTI
4. Delete JTI from whitelist (revoke token)
5. Clear cookies:
   - `refresh_token`
   - `__Host-XSRF-TOKEN`
6. Return 204 No Content

**Frontend Actions:**
```typescript
// Clear access token from memory
setAccessToken(null);

// Clear user from context
setUser(null);

// Navigate to login page
navigate('/');
```

## File Structure

### Frontend Files

```
services/api/
├── http.ts           # Core HTTP utilities with AT injection
├── auth.ts           # Authentication service (login/logout/refresh)
└── runtime.ts        # Runtime config loader

utils/
└── csrf.ts           # XSRF token cookie reader

contexts/
└── AuthContext.tsx   # Authentication state management

public/mock/
├── auth_login.json   # Mock login response
├── auth_logout.json  # Mock logout response
└── auth_refresh.json # Mock refresh response
```

### Key Functions

**http.ts:**
- `setAccessToken(token)` - Store AT in memory
- `getAccessToken()` - Retrieve AT from memory
- `buildHeaders()` - Auto-inject Authorization + CSRF headers
- `attemptTokenRefresh()` - Handle 401 with automatic refresh

**csrf.ts:**
- `getXsrfToken()` - Read XSRF token from cookie
- `hasXsrfToken()` - Check if XSRF token exists

**auth.ts:**
- `authService.login()` - Login with username/password
- `authService.logout()` - Logout and clear tokens
- `authService.refresh()` - Refresh access token
- `authService.validateSession()` - Restore session on page load

**AuthContext.tsx:**
- `login()` - Handle login flow, store user in state
- `logout()` - Handle logout flow, clear state
- `restoreSession()` - Attempt to restore session on mount

## Configuration

### Runtime Config

```json
// app-config.json
{
  "API_BASE": ""  // Empty = mock mode
  // "API_BASE": "https://api.example.com"  // Production
}
```

### Environment Variables

```bash
# .env
VITE_API_BASE=http://localhost:3001  # Development API
```

## Mock Mode vs Server Mode

### Mock Mode (API_BASE = "")

- GET requests: Served from `/mock/*.json`
- POST requests: Throw error → fallback to embedded dataset
- Login: Returns mock response from `auth_login.json`
- No real LDAP validation
- Access token: `MOCK_ACCESS_TOKEN_EMBEDDED_MODE`

### Server Mode (API_BASE = "https://api.example.com")

- All requests: Proxied to real API
- LDAP validation: Real Active Directory bind
- JWT tokens: Real cryptographic signatures
- Redis/memory: Real JTI whitelist
- CSRF: Real double-submit validation

## Security Considerations

### ✅ Protected Against

1. **XSS (Cross-Site Scripting)**
   - Access token in memory (not localStorage)
   - Refresh token in HttpOnly cookie
   - CSRF token readable but useless without RT

2. **CSRF (Cross-Site Request Forgery)**
   - Double-submit cookie pattern
   - XSRF token required for state-changing operations
   - SameSite=Strict cookies

3. **Token Theft**
   - Short-lived access tokens (15 min)
   - Refresh token rotation (one-time use)
   - JTI whitelist (revoked tokens rejected)

4. **Replay Attacks**
   - Token rotation prevents reuse
   - JTI immediately revoked on refresh

### ⚠️ Considerations

1. **Page Reload**: Access token lost → auto-refresh on next request
2. **Multiple Tabs**: Refresh in one tab may invalidate others
3. **Network Issues**: Failed refresh → user logged out
4. **CORS**: Must be properly configured on backend

## Testing Scenarios

### Test 1: Login Flow
```typescript
// 1. Call login
const result = await authService.login({ 
  username: 'john.doe', 
  password: 'password123' 
});

// Verify:
// - result.access exists
// - result.profile contains user data
// - getAccessToken() returns token
// - Cookies are set (check browser DevTools)
```

### Test 2: Protected API Call
```typescript
// 1. Login first
await authService.login({ username: 'john.doe', password: 'pass' });

// 2. Call protected endpoint
const projects = await httpGet('/api/projects');

// Verify:
// - Request includes Authorization header
// - Request includes X-CSRF-Token header
// - Response is successful
```

### Test 3: Token Refresh
```typescript
// 1. Login
await authService.login({ username: 'john.doe', password: 'pass' });

// 2. Wait for token expiry or force 401
// 3. Make API call
const data = await httpGet('/api/data');

// Verify:
// - Auto-refresh triggered on 401
// - New access token retrieved
// - Original request retried and succeeded
```

### Test 4: Logout
```typescript
// 1. Login
await authService.login({ username: 'john.doe', password: 'pass' });

// 2. Logout
await authService.logout();

// Verify:
// - getAccessToken() returns null
// - Cookies cleared (check browser DevTools)
// - Next API call requires re-login
```

## Troubleshooting

### Issue: 401 Unauthorized on every request

**Causes:**
- Access token not being sent
- Backend not recognizing token format
- Token expired and refresh failed

**Solutions:**
1. Check `getAccessToken()` returns valid token
2. Verify Authorization header: `Bearer {token}`
3. Check token expiry with JWT decoder
4. Verify backend JWT secret matches

### Issue: CSRF token missing/invalid

**Causes:**
- Cookie not set by backend
- Cookie not being read correctly
- Header name mismatch

**Solutions:**
1. Check cookie `__Host-XSRF-TOKEN` exists in DevTools
2. Verify `getXsrfToken()` reads cookie correctly
3. Ensure header name matches: `X-CSRF-Token`
4. Check backend expects same header name

### Issue: Refresh loop (constant 401s)

**Causes:**
- Refresh endpoint also returning 401
- JTI not in whitelist
- RT cookie not being sent

**Solutions:**
1. Check RT cookie exists and is HttpOnly
2. Verify `credentials: 'include'` in fetch
3. Check backend CORS allows credentials
4. Verify JTI whitelist working on backend

### Issue: Session not restored on page reload

**Causes:**
- No valid RT cookie
- Refresh failing silently
- isLoading stuck on true

**Solutions:**
1. Check `restoreSession()` is called in useEffect
2. Verify refresh endpoint returns new AT
3. Check console for refresh errors
4. Verify cookies persist across page reloads

## API Endpoints Summary

| Endpoint | Method | Auth | CSRF | Purpose |
|----------|--------|------|------|---------|
| `/auth/login` | POST | ❌ No | ❌ No | Initial login |
| `/auth/refresh` | POST | ❌ No | ✅ Yes | Refresh AT |
| `/auth/logout` | POST | ✅ Yes | ✅ Yes | Logout/revoke |
| `/api/*` | Any | ✅ Yes | ✅ Yes | Protected APIs |

## Backend Implementation Notes

### NestJS Guards

```typescript
// JWT Auth Guard
@UseGuards(JwtAuthGuard)
export class ProtectedController {
  @Get('/data')
  getData(@Request() req) {
    // req.user is populated by JwtAuthGuard
    return this.service.getData(req.user.id);
  }
}

// CSRF Guard
@UseGuards(CsrfGuard)
@Post('/action')
changeState() {
  // Protected against CSRF
}
```

### Redis JTI Store

```typescript
// On refresh
const jti = oldToken.jti;
await redis.del(`jti:${jti}`); // Revoke old

const newJti = uuid();
await redis.setex(`jti:${newJti}`, 604800, userId); // 7 days
```

## Best Practices

1. **Always use `credentials: 'include'`** for API calls
2. **Never store AT in localStorage** - memory only
3. **Let http.ts handle headers** - don't manually add Auth/CSRF
4. **Trust auto-refresh** - don't manually refresh unless needed
5. **Handle logout globally** - clear all state on 401 failure
6. **Use HTTPS in production** - required for Secure cookies
7. **Set short AT expiry** - 15-30 minutes recommended
8. **Rotate RT on every use** - prevents token reuse
9. **Log all auth events** - helps debugging
10. **Test with network offline** - ensure graceful degradation

## Migration Guide

### From Old System

**Old:**
```typescript
// ❌ Old approach
localStorage.setItem('token', token);
fetch('/api/data', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**New:**
```typescript
// ✅ New approach
await authService.login({ username, password });
// Token stored in memory automatically
const data = await httpGet('/api/data');
// Headers added automatically
```

### Update Checklist

- [ ] Remove all `localStorage` token storage
- [ ] Update login to use `authService.login()`
- [ ] Update logout to use `authService.logout()`
- [ ] Replace direct fetch with `httpGet`/`httpPost`
- [ ] Remove manual Authorization header injection
- [ ] Update API mock responses (access/profile format)
- [ ] Test session restoration on page reload
- [ ] Verify CSRF headers on protected endpoints
- [ ] Test auto-refresh on 401 errors
- [ ] Update backend to match new auth flow

---

**Last Updated:** 2025-01-28  
**Version:** 1.0.0  
**Author:** Construction Form Generator Team
