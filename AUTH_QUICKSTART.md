# Authentication Quick Start Guide

## TL;DR

The app now uses JWT + CSRF + LDAP authentication. **Access tokens are stored in memory (not localStorage)**, refresh tokens in HttpOnly cookies, and automatic token refresh on 401 errors.

## For Frontend Developers

### Making API Calls

**✅ DO:**
```typescript
import { httpGet, httpPost } from './services/api/http';

// GET request
const data = await httpGet<MyType>('/api/endpoint');

// POST request
const result = await httpPost<MyType>('/api/endpoint', { body: 'data' });

// Authorization and CSRF headers are added automatically
// Token refresh happens automatically on 401
```

**❌ DON'T:**
```typescript
// Don't manually add Authorization headers
fetch('/api/endpoint', {
  headers: { 'Authorization': `Bearer ${token}` }  // ❌ Wrong
});

// Don't store tokens in localStorage
localStorage.setItem('token', token);  // ❌ Wrong

// Don't use plain fetch for authenticated requests
fetch('/api/endpoint');  // ❌ Wrong
```

### Login Flow

```typescript
import { useAuth } from './contexts/AuthContext';

function LoginComponent() {
  const { login, isLoggedIn, user } = useAuth();
  
  const handleLogin = async () => {
    const success = await login('john.doe', 'password123');
    
    if (success) {
      console.log('Logged in as:', user?.name);
      // Access token is now in memory
      // Refresh token is in HttpOnly cookie
      // Ready to make API calls
    }
  };
  
  return (
    <button onClick={handleLogin}>Login</button>
  );
}
```

### Logout Flow

```typescript
import { useAuth } from './contexts/AuthContext';

function LogoutButton() {
  const { logout } = useAuth();
  
  const handleLogout = async () => {
    await logout();
    // Access token cleared from memory
    // Refresh token revoked on server
    // User redirected to home page
  };
  
  return (
    <button onClick={handleLogout}>Logout</button>
  );
}
```

### Protected Routes

```typescript
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function App() {
  return (
    <ProtectedRoute>
      <MyProtectedPage />
    </ProtectedRoute>
  );
}
```

## For Backend Developers

### Endpoints to Implement

```typescript
// 1. Login - No auth required
POST /auth/login
Body: { username: string, password: string }
Response: { access: string, profile: User, xsrfHeader: string }
Cookies: refresh_token (HttpOnly), __Host-XSRF-TOKEN

// 2. Refresh - CSRF required
POST /auth/refresh
Headers: X-CSRF-Token
Response: { access: string }
Cookies: new refresh_token, new __Host-XSRF-TOKEN

// 3. Logout - Auth + CSRF required
POST /auth/logout
Headers: Authorization, X-CSRF-Token
Response: 204 No Content
Cookies: cleared

// 4. Protected endpoints - Auth + CSRF required
ANY /api/*
Headers: Authorization, X-CSRF-Token
Response: API data
```

### NestJS Implementation Example

```typescript
// auth.controller.ts
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private csrfService: CsrfService
  ) {}

  @Post('login')
  @SkipCsrf()  // Login is exempt from CSRF
  async login(
    @Body() credentials: LoginDto,
    @Res({ passthrough: true }) response: Response
  ) {
    // 1. Validate LDAP
    const ldapUser = await this.authService.validateLdap(credentials);
    
    // 2. Get user profile from DB
    const profile = await this.authService.getUserProfile(ldapUser.username);
    
    // 3. Generate tokens
    const accessToken = this.authService.generateAccessToken(profile);
    const refreshToken = this.authService.generateRefreshToken(profile);
    
    // 4. Register JTI in whitelist
    await this.authService.registerJti(refreshToken.jti, profile.id);
    
    // 5. Set cookies
    response.cookie('refresh_token', refreshToken.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
    });
    
    // 6. Set CSRF token
    const xsrfToken = this.csrfService.generateToken();
    response.cookie('__Host-XSRF-TOKEN', xsrfToken, {
      httpOnly: false,  // Frontend needs to read this
      secure: true,
      sameSite: 'strict'
    });
    
    return {
      access: accessToken,
      profile,
      xsrfHeader: 'X-CSRF-Token'
    };
  }

  @Post('refresh')
  @UseCsrf()  // Validate CSRF token
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    // 1. Get RT from cookie
    const oldRefreshToken = request.cookies.refresh_token;
    const decoded = this.authService.verifyRefreshToken(oldRefreshToken);
    
    // 2. Check JTI whitelist
    const valid = await this.authService.isJtiValid(decoded.jti);
    if (!valid) throw new UnauthorizedException('Token revoked');
    
    // 3. Revoke old JTI (rotation)
    await this.authService.revokeJti(decoded.jti);
    
    // 4. Generate new tokens
    const newAccessToken = this.authService.generateAccessToken(decoded);
    const newRefreshToken = this.authService.generateRefreshToken(decoded);
    
    // 5. Register new JTI
    await this.authService.registerJti(newRefreshToken.jti, decoded.id);
    
    // 6. Set new cookies
    response.cookie('refresh_token', newRefreshToken.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    const xsrfToken = this.csrfService.generateToken();
    response.cookie('__Host-XSRF-TOKEN', xsrfToken, {
      httpOnly: false,
      secure: true,
      sameSite: 'strict'
    });
    
    return { access: newAccessToken };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    // 1. Get RT from cookie
    const refreshToken = request.cookies.refresh_token;
    const decoded = this.authService.verifyRefreshToken(refreshToken);
    
    // 2. Revoke JTI
    await this.authService.revokeJti(decoded.jti);
    
    // 3. Clear cookies
    response.clearCookie('refresh_token');
    response.clearCookie('__Host-XSRF-TOKEN');
    
    return { statusCode: 204 };
  }
}

// Protected controller example
@Controller('api')
@UseGuards(JwtAuthGuard, CsrfGuard)
export class ApiController {
  @Get('projects')
  async getProjects(@Request() req) {
    // req.user is populated by JwtAuthGuard
    return this.projectService.findAll(req.user.id);
  }
  
  @Post('projects')
  async createProject(@Request() req, @Body() data: CreateProjectDto) {
    // Both JWT and CSRF validated automatically
    return this.projectService.create(req.user.id, data);
  }
}
```

### JWT Token Structure

**Access Token (AT):**
```json
{
  "sub": "user-001",
  "username": "john.doe",
  "role": "Admin",
  "iat": 1705413822,
  "exp": 1705414722,  // 15 minutes from iat
  "typ": "access"
}
```

**Refresh Token (RT):**
```json
{
  "sub": "user-001",
  "username": "john.doe",
  "iat": 1705413822,
  "exp": 1706018622,  // 7 days from iat
  "jti": "550e8400-e29b-41d4-a716-446655440000",
  "typ": "refresh"
}
```

### Redis JTI Store

```typescript
// Store JTI on login/refresh
await redis.setex(
  `jti:${jti}`,
  604800,  // 7 days in seconds
  userId
);

// Check JTI on refresh
const userId = await redis.get(`jti:${jti}`);
if (!userId) throw new UnauthorizedException('Token revoked');

// Revoke JTI on logout/refresh
await redis.del(`jti:${jti}`);
```

## Configuration

### Frontend Configuration

```json
// app-config.json
{
  "API_BASE": ""  // Empty = mock mode
}

// For production
{
  "API_BASE": "https://api.example.com"
}
```

### Backend Configuration

```bash
# .env
JWT_SECRET=your-super-secret-key-here-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

LDAP_URL=ldap://your-ldap-server.com
LDAP_DOMAIN=nycdpr

REDIS_HOST=localhost
REDIS_PORT=6379
USE_REDIS=true  # false = in-memory store
```

## Testing

### Frontend Tests

```typescript
// Test login
const { login } = useAuth();
const success = await login('test.user', 'password');
expect(success).toBe(true);
expect(getAccessToken()).toBeTruthy();

// Test protected API call
const data = await httpGet('/api/projects');
expect(data).toBeDefined();

// Test auto-refresh on 401
mockApiResponse(401);  // First call fails
const data = await httpGet('/api/projects');
expect(refreshCalled).toBe(true);  // Auto-refresh triggered
expect(data).toBeDefined();  // Retry succeeded

// Test logout
await logout();
expect(getAccessToken()).toBeNull();
```

### Backend Tests

```typescript
// Test login with valid LDAP
const response = await request(app)
  .post('/auth/login')
  .send({ username: 'test.user', password: 'valid' })
  .expect(200);

expect(response.body.access).toBeDefined();
expect(response.body.profile.email).toBe('test.user@parks.nyc.gov');
expect(response.headers['set-cookie']).toBeDefined();

// Test refresh with valid RT
const response = await request(app)
  .post('/auth/refresh')
  .set('Cookie', `refresh_token=${validRT}`)
  .set('X-CSRF-Token', csrfToken)
  .expect(200);

expect(response.body.access).toBeDefined();

// Test logout
await request(app)
  .post('/auth/logout')
  .set('Cookie', `refresh_token=${validRT}`)
  .set('Authorization', `Bearer ${validAT}`)
  .set('X-CSRF-Token', csrfToken)
  .expect(204);

// Verify JTI revoked
const jtiExists = await redis.exists(`jti:${jti}`);
expect(jtiExists).toBe(0);
```

## Troubleshooting

### "CSRF token missing"
- Check cookie `__Host-XSRF-TOKEN` exists in browser
- Verify `getXsrfToken()` is reading cookie correctly
- Ensure `credentials: 'include'` in fetch options

### "Token expired" errors
- Check AT expiry (should be 15 min)
- Verify auto-refresh is working (check console logs)
- Ensure RT cookie is being sent to backend

### "Refresh loop" (constant 401s)
- Check RT cookie is HttpOnly and valid
- Verify backend CORS allows credentials
- Check JTI exists in Redis/memory whitelist
- Ensure refresh endpoint doesn't require Authorization header

### Session lost on page reload
- Check `restoreSession()` is called in AuthContext
- Verify RT cookie persists across reloads
- Ensure refresh endpoint returns valid AT

## Migration Checklist

- [ ] Backend implements `/auth/login`, `/auth/refresh`, `/auth/logout`
- [ ] Backend uses Redis or memory store for JTI whitelist
- [ ] Backend sets HttpOnly cookies for RT
- [ ] Backend sets non-HttpOnly cookie for XSRF token
- [ ] Backend validates XSRF token on protected endpoints
- [ ] Backend implements token rotation on refresh
- [ ] Frontend uses `httpGet`/`httpPost` from `services/api/http.ts`
- [ ] Frontend stores AT in memory only (no localStorage)
- [ ] Frontend sends `credentials: 'include'` on all API calls
- [ ] Frontend handles 401 with automatic refresh
- [ ] Frontend reads XSRF token from cookie
- [ ] Test complete auth flow: login → API call → refresh → logout
- [ ] Test session restore on page reload
- [ ] Test concurrent requests during token refresh
- [ ] Configure CORS to allow credentials
- [ ] Set HTTPS in production (required for Secure cookies)

## Resources

- **Complete Documentation**: See `AUTH_FLOW.md`
- **API Endpoints**: See `API_Documentation.md`
- **Architecture Guidelines**: See `guidelines/Guidelines.md`
- **Code Examples**: See `services/api/auth.ts`, `contexts/AuthContext.tsx`

---

**Questions?** Check the console logs - authentication flow is heavily logged with emoji prefixes (🔐 🚀 ✅ ❌) for easy debugging.
