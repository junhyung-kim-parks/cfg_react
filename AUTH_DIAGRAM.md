# Authentication Flow Diagrams

## 1. Login Flow

```
┌──────────┐                 ┌──────────┐                 ┌──────────┐                 ┌──────────┐
│          │                 │          │                 │          │                 │          │
│  Browser │                 │ Frontend │                 │ Backend  │                 │   LDAP   │
│          │                 │          │                 │          │                 │          │
└────┬─────┘                 └────┬─────┘                 └────┬─────┘                 └────┬─────┘
     │                            │                            │                            │
     │  1. Enter credentials      │                            │                            │
     ├───────────────────────────>│                            │                            │
     │                            │                            │                            │
     │                            │  2. POST /auth/login       │                            │
     │                            │  { username, password }    │                            │
     │                            ├───────────────────────────>│                            │
     │                            │                            │                            │
     │                            │                            │  3. LDAP bind              │
     │                            │                            │  nycdpr\username           │
     │                            │                            ├───────────────────────────>│
     │                            │                            │                            │
     │                            │                            │  4. bind success           │
     │                            │                            │<───────────────────────────┤
     │                            │                            │                            │
     │                            │                            │  5. Query user profile     │
     │                            │                            │  (DB: view_web_role...)    │
     │                            │                            ├────────┐                   │
     │                            │                            │        │                   │
     │                            │                            │<───────┘                   │
     │                            │                            │                            │
     │                            │                            │  6. Generate AT (15m)      │
     │                            │                            │  Generate RT (7d) + JTI    │
     │                            │                            │  Register JTI whitelist    │
     │                            │                            │  Generate XSRF token       │
     │                            │                            ├────────┐                   │
     │                            │                            │        │                   │
     │                            │                            │<───────┘                   │
     │                            │                            │                            │
     │                            │  7. Response:              │                            │
     │                            │  { access, profile }       │                            │
     │                            │  Set-Cookie: refresh_token │                            │
     │                            │  Set-Cookie: XSRF-TOKEN    │                            │
     │                            │<───────────────────────────┤                            │
     │                            │                            │                            │
     │                            │  8. Store AT in memory     │                            │
     │                            │  Store user in context     │                            │
     │                            ├────────┐                   │                            │
     │                            │        │                   │                            │
     │                            │<───────┘                   │                            │
     │                            │                            │                            │
     │  9. Login success          │                            │                            │
     │<───────────────────────────┤                            │                            │
     │  (Navigate to dashboard)   │                            │                            │
     │                            │                            │                            │

Cookies stored in browser:
- refresh_token (HttpOnly, Secure, SameSite=Strict)
- __Host-XSRF-TOKEN (Secure, SameSite=Strict, httpOnly=false)

Memory stored in frontend:
- accessToken (JavaScript variable)
- user profile (React state)
```

## 2. Protected API Call Flow

```
┌──────────┐                 ┌──────────┐                 ┌──────────┐
│          │                 │          │                 │          │
│  Browser │                 │ Frontend │                 │ Backend  │
│          │                 │          │                 │          │
└────┬─────┘                 └────┬─────┘                 └────┬─────┘
     │                            │                            │
     │  1. Request protected data │                            │
     ├───────────────────────────>│                            │
     │                            │                            │
     │                            │  2. Read tokens:           │
     │                            │  - AT from memory          │
     │                            │  - XSRF from cookie        │
     │                            ├────────┐                   │
     │                            │        │                   │
     │                            │<───────┘                   │
     │                            │                            │
     │                            │  3. GET /api/projects      │
     │                            │  Authorization: Bearer AT  │
     │                            │  X-CSRF-Token: XSRF        │
     │                            │  Cookie: refresh_token     │
     │                            ├───────────────────────────>│
     │                            │                            │
     │                            │                            │  4. Validate AT signature
     │                            │                            │  Check AT expiry
     │                            │                            │  Validate XSRF
     │                            │                            ├────────┐
     │                            │                            │        │
     │                            │                            │<───────┘
     │                            │                            │
     │                            │  5. Response: { data }     │
     │                            │<───────────────────────────┤
     │                            │                            │
     │  6. Display data           │                            │
     │<───────────────────────────┤                            │
     │                            │                            │
```

## 3. Token Refresh Flow (Auto on 401)

```
┌──────────┐                 ┌──────────┐                 ┌──────────┐                 ┌──────────┐
│          │                 │          │                 │          │                 │  Redis/  │
│  Browser │                 │ Frontend │                 │ Backend  │                 │  Memory  │
│          │                 │          │                 │          │                 │          │
└────┬─────┘                 └────┬─────┘                 └────┬─────┘                 └────┬─────┘
     │                            │                            │                            │
     │  1. API call with expired AT                            │                            │
     ├───────────────────────────>│                            │                            │
     │                            │                            │                            │
     │                            │  2. GET /api/data          │                            │
     │                            │  Authorization: Bearer AT  │                            │
     │                            │  (expired)                 │                            │
     │                            ├───────────────────────────>│                            │
     │                            │                            │                            │
     │                            │                            │  3. Verify AT → EXPIRED    │
     │                            │                            ├────────┐                   │
     │                            │                            │        │                   │
     │                            │                            │<───────┘                   │
     │                            │                            │                            │
     │                            │  4. 401 Unauthorized       │                            │
     │                            │<───────────────────────────┤                            │
     │                            │                            │                            │
     │                            │  5. Auto-refresh triggered │                            │
     │                            │  POST /auth/refresh        │                            │
     │                            │  X-CSRF-Token: XSRF        │                            │
     │                            │  Cookie: refresh_token     │                            │
     │                            ├───────────────────────────>│                            │
     │                            │                            │                            │
     │                            │                            │  6. Verify XSRF (cookie vs header)
     │                            │                            │  Extract RT from cookie    │
     │                            │                            │  Verify RT signature       │
     │                            │                            ├────────┐                   │
     │                            │                            │        │                   │
     │                            │                            │<───────┘                   │
     │                            │                            │                            │
     │                            │                            │  7. Check JTI whitelist    │
     │                            │                            ├───────────────────────────>│
     │                            │                            │                            │
     │                            │                            │  8. JTI valid              │
     │                            │                            │<───────────────────────────┤
     │                            │                            │                            │
     │                            │                            │  9. Revoke old JTI         │
     │                            │                            ├───────────────────────────>│
     │                            │                            │                            │
     │                            │                            │  10. JTI deleted           │
     │                            │                            │<───────────────────────────┤
     │                            │                            │                            │
     │                            │                            │  11. Generate new AT       │
     │                            │                            │  Generate new RT + new JTI │
     │                            │                            │  Generate new XSRF         │
     │                            │                            ├────────┐                   │
     │                            │                            │        │                   │
     │                            │                            │<───────┘                   │
     │                            │                            │                            │
     │                            │                            │  12. Register new JTI      │
     │                            │                            ├───────────────────────────>│
     │                            │                            │                            │
     │                            │                            │  13. JTI registered        │
     │                            │                            │<───────────────────────────┤
     │                            │                            │                            │
     │                            │  14. Response: { access }  │                            │
     │                            │  Set-Cookie: new RT        │                            │
     │                            │  Set-Cookie: new XSRF      │                            │
     │                            │<───────────────────────────┤                            │
     │                            │                            │                            │
     │                            │  15. Update AT in memory   │                            │
     │                            ├────────┐                   │                            │
     │                            │        │                   │                            │
     │                            │<───────┘                   │                            │
     │                            │                            │                            │
     │                            │  16. RETRY original request│                            │
     │                            │  GET /api/data             │                            │
     │                            │  Authorization: Bearer new AT                            │
     │                            │  X-CSRF-Token: new XSRF    │                            │
     │                            ├───────────────────────────>│                            │
     │                            │                            │                            │
     │                            │  17. Response: { data }    │                            │
     │                            │<───────────────────────────┤                            │
     │                            │                            │                            │
     │  18. Display data          │                            │                            │
     │<───────────────────────────┤                            │                            │
     │  (User never sees error)   │                            │                            │
     │                            │                            │                            │
```

## 4. Logout Flow

```
┌──────────┐                 ┌──────────┐                 ┌──────────┐                 ┌──────────┐
│          │                 │          │                 │          │                 │  Redis/  │
│  Browser │                 │ Frontend │                 │ Backend  │                 │  Memory  │
│          │                 │          │                 │          │                 │          │
└────┬─────┘                 └────┬─────┘                 └────┬─────┘                 └────┬─────┘
     │                            │                            │                            │
     │  1. Click logout           │                            │                            │
     ├───────────────────────────>│                            │                            │
     │                            │                            │                            │
     │                            │  2. Read tokens:           │                            │
     │                            │  - AT from memory          │                            │
     │                            │  - XSRF from cookie        │                            │
     │                            ├────────┐                   │                            │
     │                            │        │                   │                            │
     │                            │<───────┘                   │                            │
     │                            │                            │                            │
     │                            │  3. POST /auth/logout      │                            │
     │                            │  Authorization: Bearer AT  │                            │
     │                            │  X-CSRF-Token: XSRF        │                            │
     │                            │  Cookie: refresh_token     │                            │
     │                            ├───────────────────────────>│                            │
     │                            │                            │                            │
     │                            │                            │  4. Validate XSRF          │
     │                            │                            │  Extract RT from cookie    │
     │                            │                            │  Decode JTI from RT        │
     │                            │                            ├────────┐                   │
     │                            │                            │        │                   │
     │                            │                            │<───────┘                   │
     │                            │                            │                            │
     │                            │                            │  5. Revoke JTI             │
     │                            │                            ├───────────────────────────>│
     │                            │                            │                            │
     │                            │                            │  6. JTI deleted            │
     │                            │                            │<───────────────────────────┤
     │                            │                            │                            │
     │                            │  7. 204 No Content         │                            │
     │                            │  Clear-Cookie: refresh_token                            │
     │                            │  Clear-Cookie: XSRF-TOKEN  │                            │
     │                            │<───────────────────────────┤                            │
     │                            │                            │                            │
     │                            │  8. Clear AT from memory   │                            │
     │                            │  Clear user from context   │                            │
     │                            ├────────┐                   │                            │
     │                            │        │                   │                            │
     │                            │<───────┘                   │                            │
     │                            │                            │                            │
     │  9. Redirect to home page  │                            │                            │
     │<───────────────────────────┤                            │                            │
     │                            │                            │                            │

Browser state after logout:
- No refresh_token cookie
- No XSRF-TOKEN cookie
- No accessToken in memory
- No user in context
```

## 5. Token Storage Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           BROWSER                                   │
│                                                                     │
│  ┌────────────────────┐                  ┌────────────────────┐    │
│  │   JavaScript       │                  │      Cookies       │    │
│  │   Memory           │                  │                    │    │
│  │                    │                  │  ┌──────────────┐  │    │
│  │  ┌──────────────┐  │                  │  │ refresh_token│  │    │
│  │  │ accessToken  │  │                  │  │ (HttpOnly)   │  │    │
│  │  │ (15 min)     │  │                  │  │ (7 days)     │  │    │
│  │  └──────────────┘  │                  │  └──────────────┘  │    │
│  │                    │                  │                    │    │
│  │  ┌──────────────┐  │                  │  ┌──────────────┐  │    │
│  │  │ user profile │  │                  │  │ XSRF-TOKEN   │  │    │
│  │  │ (React state)│  │                  │  │ (readable)   │  │    │
│  │  └──────────────┘  │                  │  └──────────────┘  │    │
│  │                    │                  │                    │    │
│  └────────────────────┘                  └────────────────────┘    │
│                                                                     │
│  ✅ XSS Protection:                                                 │
│  - AT lost on XSS, but short-lived (15 min)                        │
│  - RT safe (HttpOnly - JavaScript cannot access)                   │
│  - XSRF readable but useless without RT                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                           BACKEND                                   │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              JTI Whitelist (Redis/Memory)                  │    │
│  │                                                            │    │
│  │  Key: jti:{uuid}                                          │    │
│  │  Value: userId                                            │    │
│  │  TTL: 7 days                                              │    │
│  │                                                            │    │
│  │  Example:                                                 │    │
│  │  ┌──────────────────────────────────────────────┐        │    │
│  │  │ jti:550e8400-e29b-41d4-a716-446655440000     │        │    │
│  │  │ → "user-001"                                 │        │    │
│  │  │ TTL: 604800 seconds                          │        │    │
│  │  └──────────────────────────────────────────────┘        │    │
│  │                                                            │    │
│  │  On refresh: Old JTI deleted, new JTI added              │    │
│  │  On logout: JTI deleted immediately                       │    │
│  │                                                            │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ✅ Token Revocation:                                               │
│  - Any RT can be instantly revoked by deleting JTI                 │
│  - Compromised token cannot be used after revocation               │
│  - Automatic cleanup after 7 days (Redis TTL)                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 6. Request Headers Visualization

### Login Request (No auth/CSRF needed)
```
POST /auth/login HTTP/1.1
Host: api.example.com
Content-Type: application/json

{
  "username": "john.doe",
  "password": "password123"
}
```

### Protected API Request
```
GET /api/projects HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGci...  ← Access Token (from memory)
X-CSRF-Token: csrf-token-value    ← XSRF Token (from cookie)
Cookie: refresh_token=eyJhbGci...; __Host-XSRF-TOKEN=csrf-token-value
```

### Refresh Request
```
POST /auth/refresh HTTP/1.1
Host: api.example.com
X-CSRF-Token: csrf-token-value    ← Required for CSRF protection
Cookie: refresh_token=eyJhbGci...; __Host-XSRF-TOKEN=csrf-token-value
                                  ↑ Backend reads RT from here
```

### Logout Request
```
POST /auth/logout HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGci...  ← Access Token
X-CSRF-Token: csrf-token-value    ← XSRF Token
Cookie: refresh_token=eyJhbGci...; __Host-XSRF-TOKEN=csrf-token-value
```

## 7. Error Handling Flow

```
┌──────────┐                 ┌──────────┐                 ┌──────────┐
│ Frontend │                 │ Backend  │                 │  Action  │
└────┬─────┘                 └────┬─────┘                 └────┬─────┘
     │                            │                            │
     │  GET /api/data             │                            │
     │  (AT expired)              │                            │
     ├───────────────────────────>│                            │
     │                            │                            │
     │  401 Unauthorized          │                            │
     │<───────────────────────────┤                            │
     │                            │                            │
     ├────────────────────────────┼───────────────────────────>│ Trigger auto-refresh
     │                            │                            │
     │  POST /auth/refresh        │                            │
     ├───────────────────────────>│                            │
     │                            │                            │
     │                            ├──┐ RT valid?              │
     │                            │  │                         │
     │                            │<─┘                         │
     │                            │                            │
     │  ┌─────────────────────────┤                            │
     │  │ If RT valid:            │                            │
     │  │ { access: "new_token" } │                            │
     │  │<────────────────────────┤                            │
     │  │                         │                            │
     │  │ RETRY /api/data         │                            │
     │  ├────────────────────────>│                            │
     │  │                         │                            │
     │  │ { data }                │                            │
     │  │<────────────────────────┤                            │
     │  │                         │                            │
     │  └────────────────────────>│                            │ ✅ Success
     │                            │                            │
     │  ┌─────────────────────────┤                            │
     │  │ If RT invalid:          │                            │
     │  │ 401/403                 │                            │
     │  │<────────────────────────┤                            │
     │  │                         │                            │
     │  └────────────────────────>│                            │ ❌ Logout & redirect to login
     │                            │                            │
```

## Legend

- `→` : HTTP Request
- `←` : HTTP Response
- `┌─┐` : Decision/Process
- `✅` : Success
- `❌` : Error
- `⚠️` : Warning

## Key Concepts

### Double-Submit Cookie Pattern
```
Frontend                          Backend
   │                                 │
   │  1. Read cookie:                │
   │     __Host-XSRF-TOKEN           │
   │                                 │
   │  2. Send request with:          │
   │     Cookie: __Host-XSRF-TOKEN   │
   │     Header: X-CSRF-Token        │
   ├────────────────────────────────>│
   │                                 │
   │                                 │  3. Compare:
   │                                 │     cookie value === header value?
   │                                 │
   │     ✅ Match → Allow            │
   │     ❌ No match → 401           │
```

### Token Rotation (One-Time Use)
```
Refresh #1:
  RT_1 (JTI_1) → Check whitelist → Valid
  ↓
  Delete JTI_1 from whitelist
  ↓
  Generate RT_2 (JTI_2), register JTI_2
  ↓
  Return AT_2, RT_2 cookies

Refresh #2 (if RT_1 reused):
  RT_1 (JTI_1) → Check whitelist → Not found ❌
  ↓
  Return 401 (token revoked/reused)
  ↓
  Force re-login
```

---

**Note**: All diagrams use ASCII art for maximum compatibility. For production documentation, consider using tools like Mermaid, PlantUML, or draw.io for more polished diagrams.
