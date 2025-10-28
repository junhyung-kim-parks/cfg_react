# Authentication API Contract

## Overview
This document specifies the exact API contract for authentication endpoints that the frontend expects.

## Authentication Flow
```
1. Login    → POST /auth/login    → Get AT (response) + RT (cookie) + XSRF (cookie)
2. Request  → GET/POST /api/*     → Send AT (header) + XSRF (header)
3. 401      → POST /auth/refresh  → Get new AT (response) + new RT (cookie) + new XSRF (cookie)
4. Retry    → GET/POST /api/*     → Send new AT (header) + XSRF (header)
5. Logout   → POST /auth/logout   → Clear AT (memory) + RT (cookie) + XSRF (cookie)
```

## Endpoints

### 1. POST /auth/login
**Purpose:** Authenticate user with username and password

**Request:**
```http
POST /auth/login HTTP/1.1
Content-Type: application/json

{
  "username": "Junhyung.Kim",
  "password": "user_password_here"
}
```

**Response (Success - 200 OK):**
```http
HTTP/1.1 200 OK
Content-Type: application/json
Set-Cookie: __Host-RT=<refresh_token>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800
Set-Cookie: __Host-XSRF-TOKEN=<xsrf_token>; Secure; SameSite=Strict; Path=/; Max-Age=604800

{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "profile": {
    "userid": "449",
    "username": "Junhyung.Kim",
    "first_name": "Junhyung",
    "last_name": "Kim",
    "email": "junhyung.kim@parks.nyc.gov"
  },
  "xsrfHeader": "X-CSRF-Token"
}
```

**Response Fields:**
- `access` (string, required): JWT access token (short-lived, e.g., 15 minutes)
- `profile` (object, required): User profile information
  - `userid` (string, required): Unique user identifier
  - `username` (string, required): Username (e.g., "Junhyung.Kim")
  - `first_name` (string, required): User's first name
  - `last_name` (string, required): User's last name
  - `email` (string, required): User's email address
- `xsrfHeader` (string, optional): Name of CSRF header (default: "X-CSRF-Token")

**Cookies Set:**
- `__Host-RT`: Refresh token (httpOnly: true, secure: true, sameSite: strict, maxAge: 7 days)
- `__Host-XSRF-TOKEN`: CSRF token (httpOnly: false, secure: true, sameSite: strict, maxAge: 7 days)

**Response (Failure - 401 Unauthorized):**
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Invalid credentials",
  "message": "Username or password is incorrect"
}
```

**Response (Failure - 429 Too Many Requests):**
```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 60

{
  "error": "Rate limit exceeded",
  "message": "Too many login attempts. Please try again later."
}
```

**Notes:**
- This endpoint does NOT require `Authorization` header
- This endpoint does NOT require `X-CSRF-Token` header
- Backend should validate credentials against LDAP
- Backend should generate JWT access token with appropriate claims
- Backend should generate refresh token and store in whitelist/database
- Backend should generate CSRF token matching the refresh token

---

### 2. POST /auth/refresh
**Purpose:** Refresh expired access token using refresh token cookie

**Request:**
```http
POST /auth/refresh HTTP/1.1
Content-Type: application/json
X-CSRF-Token: <xsrf_token_from_cookie>
Cookie: __Host-RT=<refresh_token>
```

**Response (Success - 200 OK):**
```http
HTTP/1.1 200 OK
Content-Type: application/json
Set-Cookie: __Host-RT=<new_refresh_token>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800
Set-Cookie: __Host-XSRF-TOKEN=<new_xsrf_token>; Secure; SameSite=Strict; Path=/; Max-Age=604800

{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Fields:**
- `access` (string, required): New JWT access token

**Cookies Set:**
- `__Host-RT`: New refresh token (rotated - old token is revoked)
- `__Host-XSRF-TOKEN`: New CSRF token

**Response (Failure - 401 Unauthorized):**
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Invalid refresh token",
  "message": "Refresh token is invalid or expired"
}
```

**Response (Failure - 403 Forbidden):**
```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "error": "CSRF token mismatch",
  "message": "Invalid CSRF token"
}
```

**Notes:**
- This endpoint does NOT require `Authorization` header (uses RT cookie instead)
- This endpoint DOES require `X-CSRF-Token` header
- Backend should validate refresh token from `__Host-RT` cookie
- Backend should validate CSRF token from header matches cookie
- Backend should ROTATE refresh token (revoke old, issue new)
- Backend should generate new CSRF token
- Old refresh token should be immediately revoked (one-time use)

---

### 3. POST /auth/logout
**Purpose:** Logout user and revoke refresh token

**Request:**
```http
POST /auth/logout HTTP/1.1
Content-Type: application/json
Authorization: Bearer <access_token>
X-CSRF-Token: <xsrf_token_from_cookie>
Cookie: __Host-RT=<refresh_token>
```

**Response (Success - 200 OK):**
```http
HTTP/1.1 200 OK
Content-Type: application/json
Set-Cookie: __Host-RT=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0
Set-Cookie: __Host-XSRF-TOKEN=; Secure; SameSite=Strict; Path=/; Max-Age=0

{
  "success": true,
  "message": "Logged out successfully"
}
```

**Response (Failure - 401 Unauthorized):**
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Unauthorized",
  "message": "Invalid or expired access token"
}
```

**Response (Failure - 403 Forbidden):**
```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "error": "CSRF token mismatch",
  "message": "Invalid CSRF token"
}
```

**Notes:**
- This endpoint DOES require `Authorization` header with access token
- This endpoint DOES require `X-CSRF-Token` header
- Backend should revoke refresh token from whitelist/database
- Backend should clear refresh token and CSRF token cookies
- Even if tokens are invalid, cookies should still be cleared
- Frontend will clear access token from memory regardless

---

## Security Requirements

### Cookie Configuration
All cookies must be set with these flags:
```
__Host-RT (Refresh Token):
- httpOnly: true       (prevents JavaScript access)
- secure: true         (HTTPS only)
- sameSite: 'strict'   (prevents CSRF, or 'none' if cross-origin)
- path: '/'
- maxAge: 604800       (7 days in seconds)

__Host-XSRF-TOKEN (CSRF Token):
- httpOnly: false      (must be readable by JavaScript)
- secure: true         (HTTPS only)
- sameSite: 'strict'   (or 'none' if cross-origin)
- path: '/'
- maxAge: 604800       (7 days)
```

**Note on SameSite:**
- Use `strict` if frontend and backend are on same domain
- Use `none` if frontend and backend are on different domains (requires `secure: true`)

### JWT Access Token
```
Claims (minimum):
{
  "sub": "449",                    // User ID (userid)
  "username": "Junhyung.Kim",      // Username
  "iat": 1705689092,               // Issued at
  "exp": 1705689992                // Expires at (15 min from iat)
}

Additional claims (optional):
{
  "email": "junhyung.kim@parks.nyc.gov",
  "role": "Editor",
  "permissions": ["form_generate", "form_batch_process"]
}
```

### Refresh Token
- Should be cryptographically random (e.g., 32 bytes, base64 encoded)
- Should be stored in database/whitelist with:
  - Token hash (don't store plain token)
  - User ID
  - Issued at timestamp
  - Expires at timestamp (7 days)
  - Last used timestamp (for audit)
- Should be ONE-TIME USE (rotate on every refresh)
- Should be REVOKED on logout

### CSRF Token
- Should match the refresh token (e.g., HMAC of RT)
- Should be validated on all state-changing operations
- Should be rotated when RT is rotated

### Password Validation (LDAP)
- Validate against Active Directory / LDAP
- Log all login attempts (success and failure)
- Implement rate limiting (e.g., 5 attempts per minute)
- Consider implementing account lockout after N failed attempts

---

## CORS Configuration

Backend must allow:
```
Access-Control-Allow-Origin: http://localhost:3000 (or production domain)
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, X-CSRF-Token
Access-Control-Max-Age: 86400
```

For production, replace `http://localhost:3000` with actual frontend domain.

---

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Continue |
| 401 | Unauthorized - invalid/expired token | Attempt token refresh, then re-login |
| 403 | Forbidden - CSRF mismatch | Re-login |
| 429 | Too many requests | Wait and retry |
| 500 | Server error | Show error message |

---

## Testing Checklist

### Login Endpoint
- [ ] Returns correct JSON structure
- [ ] Sets both cookies (`__Host-RT` and `__Host-XSRF-TOKEN`)
- [ ] `__Host-RT` is httpOnly
- [ ] `__Host-XSRF-TOKEN` is NOT httpOnly
- [ ] Access token is valid JWT
- [ ] Invalid credentials return 401
- [ ] CORS headers present

### Refresh Endpoint
- [ ] Accepts RT from cookie
- [ ] Validates CSRF token from header
- [ ] Returns new access token
- [ ] Rotates refresh token (sets new cookie)
- [ ] Revokes old refresh token
- [ ] Invalid RT returns 401
- [ ] Missing CSRF token returns 403

### Logout Endpoint
- [ ] Accepts access token from header
- [ ] Validates CSRF token from header
- [ ] Clears both cookies (Max-Age=0)
- [ ] Revokes refresh token in database
- [ ] Returns success even if tokens invalid

### Integration Test
- [ ] Login → access protected resource → success
- [ ] Login → wait for AT expiry → auto-refresh → success
- [ ] Login → logout → access protected resource → fail (401)
- [ ] Multiple concurrent requests don't cause refresh race condition

---

## Example Implementations

### Node.js/Express Example

```javascript
// Login endpoint
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Validate against LDAP
  const user = await validateLDAP(username, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  const csrfToken = generateCSRFToken(refreshToken);
  
  // Store refresh token
  await storeRefreshToken(user.userid, refreshToken);
  
  // Set cookies
  res.cookie('__Host-RT', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  
  res.cookie('__Host-XSRF-TOKEN', csrfToken, {
    httpOnly: false,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  
  // Return response
  res.json({
    access: accessToken,
    profile: {
      userid: user.userid,
      username: user.username,
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email
    },
    xsrfHeader: 'X-CSRF-Token'
  });
});
```

---

## Frontend Integration

The frontend automatically handles:
- ✅ Storing access token in memory
- ✅ Reading refresh token from cookie (automatic via `credentials: 'include'`)
- ✅ Reading CSRF token from cookie
- ✅ Including `Authorization: Bearer {AT}` header on all authenticated requests
- ✅ Including `X-CSRF-Token: {XSRF}` header on all state-changing requests
- ✅ Automatically refreshing token on 401 errors
- ✅ Retrying original request after token refresh
- ✅ Clearing tokens on logout

Backend only needs to implement the 3 endpoints above according to this spec.

---

**Status:** Ready for backend implementation

**Questions?** Check `AUTH_FLOW.md` for detailed flow diagrams and `AUTH_QUICKSTART.md` for quick setup guide.
