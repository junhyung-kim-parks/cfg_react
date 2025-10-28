# Authentication Implementation Changes

## Summary

프론트엔드 코드를 JWT + CSRF + LDAP 기반 백엔드 인증 시스템에 맞게 수정했습니다.

## 주요 변경사항

### 1. 새로운 파일 생성

#### `/utils/csrf.ts`
- XSRF 토큰을 쿠키에서 읽는 유틸리티 함수
- `getXsrfToken()`: `__Host-XSRF-TOKEN` 또는 `XSRF-TOKEN` 쿠키 읽기
- `hasXsrfToken()`: XSRF 토큰 존재 여부 확인

#### `/public/mock/auth_refresh.json`
- 토큰 리프레시 API의 mock 응답
- 새로운 access token 반환

#### 문서 파일
- `/AUTH_FLOW.md`: 인증 플로우 완전한 문서 (단계별 설명)
- `/AUTH_QUICKSTART.md`: 개발자용 빠른 시작 가이드
- `/CHANGES_AUTH_IMPLEMENTATION.md`: 이 파일

### 2. 수정된 파일

#### `/services/api/http.ts`
**주요 변경:**
- Access Token을 메모리에 저장하는 변수 추가
- `setAccessToken()`, `getAccessToken()` 함수 추가
- `buildHeaders()`: Authorization 및 CSRF 헤더 자동 추가
- `httpGet()`, `httpPost()`: 
  - `credentials: 'include'` 추가 (쿠키 전송)
  - 401 응답 시 자동 리프레시 시도
  - 리프레시 성공 시 원래 요청 재시도
- `attemptTokenRefresh()`: 토큰 리프레시 로직
  - 동시 리프레시 방지 (Promise 재사용)
  - XSRF 토큰 검증
  - 새로운 AT 저장

**변경 전:**
```typescript
export async function httpGet<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
}
```

**변경 후:**
```typescript
export async function httpGet<T>(path: string, init: RequestInit = {}, skipAuth = false): Promise<T> {
  const headers = buildHeaders(init);  // Auto-inject Authorization + CSRF
  const res = await fetch(url, {
    method: 'GET',
    headers,
    credentials: 'include',  // Send cookies
  });
  
  // Auto-refresh on 401
  if (res.status === 401 && accessToken) {
    const refreshed = await attemptTokenRefresh();
    if (refreshed) return httpGet<T>(path, init);
  }
}
```

#### `/services/api/auth.ts`
**주요 변경:**
- `LoginResponse` 인터페이스 변경:
  - `token` → `access` (JWT access token)
  - `user` → `profile` (User profile)
  - `xsrfHeader` 추가 (CSRF 헤더 이름)
- `RefreshResponse` 인터페이스 추가
- `login()`: 
  - `/authenticate` → `/auth/login`
  - `skipAuth`, `skipCsrf` 파라미터 사용
  - 응답에서 AT 추출하여 메모리에 저장
- `logout()`:
  - Authorization + CSRF 헤더 전송
  - AT 메모리에서 제거
- `refresh()`: 새로운 메소드 추가
  - CSRF 필요, Authorization 불필요 (RT 쿠키 사용)
  - 새로운 AT 저장
- `validateSession()`: 새로운 메소드 추가
  - 페이지 로드 시 세션 복원용

**변경 전:**
```typescript
export interface LoginResponse {
  user: User;
  token?: string;
}

async login(credentials: LoginRequest): Promise<LoginResponse> {
  return await httpPost<LoginResponse>('/authenticate', credentials);
}
```

**변경 후:**
```typescript
export interface LoginResponse {
  access: string;           // JWT access token
  profile: User;           // User profile
  xsrfHeader?: string;     // CSRF header name
}

async login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await httpPost<LoginResponse>(
    '/auth/login', 
    credentials,
    {},
    true,  // skipAuth
    true   // skipCsrf
  );
  
  setAccessToken(response.access);  // Store in memory
  return response;
}
```

#### `/contexts/AuthContext.tsx`
**주요 변경:**
- `isLoading` 상태 추가
- `restoreSession()`: 마운트 시 세션 복원 시도
  - RT 쿠키가 있으면 자동 리프레시
- `login()`:
  - 응답 구조 변경 (`user` → `profile`)
  - AT 저장 로그 추가
  - Embedded 모드에서도 mock AT 설정
- `logout()`:
  - 서버 로그아웃 실패해도 로컬 상태 정리
  - AT는 `authService.logout()`에서 제거됨
- 로딩 중 스피너 표시

**변경 전:**
```typescript
const [user, setUser] = useState<UserWithInitials | null>(null);

const login = async (username: string, password: string) => {
  const response = await authService.login({ username, password });
  if (response.user) {
    setUser({ ...response.user, initials: getInitials(response.user.name) });
  }
};
```

**변경 후:**
```typescript
const [user, setUser] = useState<UserWithInitials | null>(null);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  restoreSession();  // Try to restore session on mount
}, []);

const restoreSession = async () => {
  try {
    await authService.refresh();  // Use RT cookie
  } catch (error) {
    setUser(null);
  } finally {
    setIsLoading(false);
  }
};

const login = async (username: string, password: string) => {
  const response = await authService.login({ username, password });
  if (response.profile) {
    setUser({ ...response.profile, initials: getInitials(response.profile.name) });
  }
};
```

#### `/public/mock/auth_login.json`
**변경 전:**
```json
{
  "user": { ... },
  "token": "mock-jwt-token-12345",
  "message": "Login successful"
}
```

**변경 후:**
```json
{
  "access": "eyJhbGci...",  // JWT format
  "profile": { ... },
  "xsrfHeader": "X-CSRF-Token"
}
```

#### `/guidelines/Guidelines.md`
- "PROTECTED ROUTES & AUTHENTICATION" 섹션 업데이트
- JWT + CSRF + LDAP 시스템 설명 추가
- AUTH_FLOW.md 참조 추가

#### `/API_Documentation.md`
- 인증 API 엔드포인트 문서 추가:
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `POST /auth/logout`

## 인증 플로우 비교

### 이전 방식
```
1. Login → 토큰을 응답으로 받음
2. 토큰을 어딘가에 저장 (명시되지 않음)
3. API 호출 시 수동으로 Authorization 헤더 추가
4. 토큰 만료 시 수동 처리
```

### 새로운 방식
```
1. Login → AT (메모리) + RT (HttpOnly 쿠키) + XSRF (쿠키)
2. API 호출 → Authorization + CSRF 헤더 자동 추가
3. 401 에러 → 자동 리프레시 (RT 쿠키 사용)
4. 리프레시 성공 → 원래 요청 재시도
5. Logout → AT 메모리 삭제 + RT 서버에서 폐기
```

## 보안 개선사항

### 1. XSS 공격 방어
- **이전**: 토큰 저장 위치 불명확 (localStorage 사용 시 위험)
- **새로운**: AT는 메모리, RT는 HttpOnly 쿠키 (JavaScript 접근 불가)

### 2. CSRF 공격 방어
- **이전**: CSRF 보호 없음
- **새로운**: Double-submit cookie 패턴 (XSRF 토큰)

### 3. 토큰 탈취 방어
- **이전**: 토큰이 탈취되면 만료까지 사용 가능
- **새로운**: 
  - 짧은 AT 수명 (15분)
  - RT 회전 (일회용)
  - JTI 화이트리스트 (즉시 폐기 가능)

### 4. 재생 공격 방어
- **이전**: 방어 없음
- **새로운**: RT 회전으로 재사용 불가능

## API 호출 방식 변경

### 개발자가 해야 할 것

**이전:**
```typescript
// 수동으로 토큰 관리
const token = getTokenFromSomewhere();
fetch('/api/data', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**새로운:**
```typescript
// 자동으로 처리됨
import { httpGet } from './services/api/http';
const data = await httpGet('/api/data');
// Authorization, CSRF 헤더 자동 추가
// 401 시 자동 리프레시
```

## 백엔드 요구사항

### 구현해야 할 엔드포인트
1. `POST /auth/login` - LDAP 인증 + JWT 발급
2. `POST /auth/refresh` - RT로 AT 갱신 (CSRF 필요)
3. `POST /auth/logout` - RT 폐기 (Auth + CSRF 필요)

### 필요한 인프라
1. Redis 또는 메모리 저장소 (JTI 화이트리스트)
2. LDAP 서버 연결
3. JWT 서명 키
4. CORS 설정 (credentials 허용)

### 쿠키 설정
1. `refresh_token`: HttpOnly, Secure, SameSite=Strict
2. `__Host-XSRF-TOKEN`: Secure, SameSite=Strict, httpOnly=false

## 테스트 방법

### 프론트엔드 테스트
```bash
# 1. Mock 모드로 테스트 (app-config.json의 API_BASE를 빈 문자열로)
npm run dev

# 2. 로그인 테스트
- 브라우저에서 로그인
- Console에서 "🔐" 이모지로 로그 확인
- DevTools Application 탭에서 쿠키 확인 (없을 것 - mock 모드)

# 3. 서버 모드로 테스트 (백엔드 구현 후)
# app-config.json 수정:
{
  "API_BASE": "http://localhost:3001"
}

# 4. 로그인 테스트
- 브라우저에서 로그인
- DevTools에서 쿠키 확인 (refresh_token, __Host-XSRF-TOKEN)
- Console에서 AT 저장 로그 확인

# 5. API 호출 테스트
- 보호된 페이지 접근
- Network 탭에서 Authorization, X-CSRF-Token 헤더 확인

# 6. 자동 리프레시 테스트
- AT 만료까지 대기 (15분) 또는 백엔드에서 401 강제
- API 호출 시 자동 리프레시 확인
- Console에서 "🔄 Retrying" 로그 확인

# 7. 로그아웃 테스트
- 로그아웃 버튼 클릭
- DevTools에서 쿠키 삭제 확인
- Console에서 AT cleared 로그 확인
```

### 백엔드 테스트
```bash
# 1. LDAP 연결 테스트
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test.user","password":"password"}'

# 2. 리프레시 테스트
curl -X POST http://localhost:3001/auth/refresh \
  -H "X-CSRF-Token: {token}" \
  -H "Cookie: refresh_token={rt}"

# 3. 보호된 API 테스트
curl -X GET http://localhost:3001/api/projects \
  -H "Authorization: Bearer {at}" \
  -H "X-CSRF-Token: {token}"

# 4. 로그아웃 테스트
curl -X POST http://localhost:3001/auth/logout \
  -H "Authorization: Bearer {at}" \
  -H "X-CSRF-Token: {token}" \
  -H "Cookie: refresh_token={rt}"
```

## 다음 단계

### 프론트엔드
1. ✅ 인증 시스템 구현 완료
2. ⏳ 백엔드 구현 대기
3. ⏳ 통합 테스트
4. ⏳ 에러 처리 개선 (사용자 친화적 메시지)
5. ⏳ 로딩 상태 UI 개선

### 백엔드
1. ⏳ NestJS 프로젝트 생성
2. ⏳ LDAP 모듈 구현
3. ⏳ JWT 전략 구현 (Access + Refresh)
4. ⏳ CSRF 미들웨어 구현
5. ⏳ Redis JTI 스토어 구현
6. ⏳ 인증 엔드포인트 구현
7. ⏳ 보호된 API 가드 적용
8. ⏳ CORS 설정 (credentials 허용)
9. ⏳ 에러 핸들링
10. ⏳ 로깅 시스템

## 문제 해결

### 자주 발생하는 이슈

1. **"CSRF token missing"**
   - 원인: 쿠키가 설정되지 않았거나 읽지 못함
   - 해결: DevTools에서 쿠키 확인, httpOnly=false 확인

2. **"401 on every request"**
   - 원인: AT가 저장되지 않았거나 헤더에 추가되지 않음
   - 해결: `getAccessToken()` 확인, buildHeaders() 로그 확인

3. **"Refresh loop"**
   - 원인: Refresh 엔드포인트도 401 반환
   - 해결: Refresh는 Authorization 헤더 불필요, CSRF만 필요

4. **"Session lost on reload"**
   - 원인: restoreSession() 실패
   - 해결: RT 쿠키 확인, refresh 엔드포인트 동작 확인

## 참고 문서

1. **AUTH_FLOW.md** - 완전한 인증 플로우 설명
2. **AUTH_QUICKSTART.md** - 개발자 빠른 시작 가이드
3. **API_Documentation.md** - API 엔드포인트 명세
4. **guidelines/Guidelines.md** - 프로젝트 가이드라인

## 변경 이력

- **2025-01-28**: 초기 JWT + CSRF + LDAP 인증 시스템 구현
  - Access Token 메모리 저장
  - Refresh Token HttpOnly 쿠키
  - CSRF Double-submit 패턴
  - 자동 토큰 리프레시
  - 세션 복원 로직

---

**마지막 업데이트**: 2025-01-28  
**작성자**: Construction Form Generator Team
