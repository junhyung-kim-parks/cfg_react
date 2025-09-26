[REQUEST] React + Vite + TypeScript — Root-Level (No /src), Tailwind, Runtime API Switching

Create a production-ready scaffold with the folder tree and per-folder action guidelines below.
Do NOT output file contents except where explicitly required.

==================================================
FOLDER TREE (CREATE EXACTLY)
==================================================
{{PROJECT_NAME}}/
├─ public/                  # 브라우저에서 직접 접근되는 정적 자산
│  └─ mock/                 # ✅ 모든 샘플 데이터 .json (users.json, formCatalog.json 등)
├─ pages/                   # 라우트 단위 페이지
│  ├─ HomePage.tsx
│  ├─ FormsPage.tsx
│  └─ styles/               # ✅ 페이지 전용 CSS (파일명 = 페이지명)
│     ├─ HomePage.css
│     └─ FormsPage.css
├─ components/              # 재사용 UI (Figma 생성물 및 공통 UI)
│  ├─ layout/               # 레이아웃/헤더 등
│  │  ├─ TopHeader.tsx
│  │  ├─ TopHeader.module.css
│  │  └─ TopHeader.test.tsx
│  ├─ figma/                # Figma Make가 내보낸 컴포넌트
│  └─ ui/                   # Button/Input/Card 등 프리미티브
├─ features/                           # Domain-oriented code (self-contained)
│  └─ forms/
│     ├─ components/
│     │  └─ FormCard.tsx
│     ├─ hooks/
│     │  └─ useFormSearch.ts           # filter/sort/pagination state (URL-sync ready)
│     ├─ services/
│     │  └─ forms.service.ts           # list(): httpGet('/formCatalog')
│     └─ types.ts                      # Form types (re-export from models if needed)
├─ assets/                  # 이미지/폰트/아이콘
│  ├─ images/
│  └─ icons/
├─ services/                # API & 외부 서비스
│  ├─ api/
│  │  ├─ runtime.ts         # /app-config.json 로드 (초기 렌더 전)
│  │  └─ http.ts            # ✅ 아래 "MANDATORY FILE CONTENT" 적용
│  └─ mocks/                # (선택) MSW 핸들러/워커
├─ models/                  # 전역 타입/스키마 (Zod 등)
├─ contexts/                # 전역 Context(최소화)
├─ styles/                  # 전역 스타일/토큰
│  ├─ tokens.css            # CSS 변수(컬러/타이포/스페이싱/라운드/섀도)
│  └─ globals.css           # @tailwind base/components/utilities + .btn/.input/.card/.badge
├─ constants/               # 상수 (헤더/타임아웃 등)
├─ hooks/                   # 재사용 훅
├─ utils/                   # 공용 유틸(formatDate 등)
├─ tests/                   # 테스트 셋업/통합 테스트
│  └─ setupTests.ts
├─ app-config.json          # 런타임 설정 {"API_BASE": ""} => mock 모드
├─ App.tsx                  # ✅ 루트 (앱 셸)
├─ routes.tsx               # ✅ 루트 (라우팅 정의)
├─ main.tsx                 # ✅ 루트 (엔트리; runtime 로드 → 렌더)
├─ index.html               # `<script type="module" src="/main.tsx">`
├─ tailwind.config.ts
├─ postcss.config.js
├─ vite.config.ts           # alias '@' -> project root('.'), publicDir: 'public'
├─ tsconfig.json            # "paths": { "@/*": ["*"] }
├─ .env.example
├─ eslint.config.mjs
├─ vitest.config.ts
├─ .prettierrc
└─ README.md

==================================================
PER-FOLDER ACTION GUIDELINES
==================================================
- public/:
  - Put ALL mock JSON under public/mock/*.json. Never hardcode “/public” in code.

- pages/:
  - Keep pages thin (routing + simple composition). Page CSS lives in pages/styles and MUST match the page filename.
  - Prefer Tailwind utilities; add minimal page overrides in the CSS file.
- components/:
  - layout/TopHeader.tsx: site header + nav (use Tailwind; minimal CSS module for fine-grained overrides).
  - layout/TopHeader.module.css: optional, keep tiny; prefer utilities first.
  - layout/TopHeader.test.tsx: Vitest + Testing Library basic render test.
  - figma/: dump Figma-generated components here; normalize classNames to Tailwind where possible.
  - ui/: small primitives (Button, Input, Card, Badge, etc.); no inline styles, class-based only.
- features/forms/:
  - components/FormCard.tsx: compact card view for a form item (title, id, status badge, updatedAt).
  - hooks/useFormSearch.ts: debounced search (250ms), multi-filter state, pagination, sorting, URL-sync ready.
  - services/forms.service.ts: `list(): Promise<FormItem[]>` using `httpGet('/formCatalog')`.
  - types.ts: re-export or define FormItem types used by this feature.
- services/:
  - api/runtime.ts: load `/app-config.json` at boot (no-store); export `getRuntimeConfig()`.
  - api/http.ts: **use the exact implementation provided below**.
  - mocks/: optional MSW worker/handlers if you need richer mock behavior later.
- models/:
  - Central place for app-wide types/schemas (e.g., Zod). Keep minimal at start.
- styles/:
  - tokens.css defines CSS variables; globals.css is the single Tailwind entry and includes `.btn/.input/.card/.badge` via `@apply`.
- tests/:
  - Keep tests fast and minimal; configure Vitest + RTL in tests/setupTests.ts.
- Root files:
  - App.tsx: app shell (header + `<Outlet/>`); avoid heavy logic here.
  - routes.tsx: define routes for “/” (HomePage) and “/forms” (FormsPage), lazy-loaded if desired.
  - main.tsx: `await loadRuntimeConfig()` before render; import tokens.css and globals.css.

==================================================
GLOBAL CONSTRAINTS (NO FILE CONTENTS HERE)
==================================================
- Tailwind is required. Add its directives only in styles/globals.css; use utilities and @apply (no inline styles, no CSS-in-JS).
- Runtime config: /app-config.json (root level) with {"API_BASE": ""} for mock mode; set to real base URL for server mode (no rebuild).
- Vite/TS config rules:
  - vite.config.ts: resolve.alias { '@': project root '.' }, publicDir = 'public'.
  - tsconfig.json: "baseUrl": ".", "paths": { "@/*": ["*"] }.
  - index.html: `<script type="module" src="/main.tsx">`.
- main.tsx must call loadRuntimeConfig() BEFORE rendering App.
- **Refactoring & Removal Policy**: When refactoring, if a file or folder becomes unused, **do not delete immediately**. **Rename it by prefixing `Remove_`** (e.g., `Remove_TopHeaderOld.tsx`, `Remove_legacy/`) to signal deprecation and keep review diffs clear. Actual deletion can happen in a later cleanup PR.

==================================================
MANDATORY FILE CONTENT — services/api/http.ts
==================================================
# services/api/http.ts (write EXACTLY)
import { getRuntimeConfig } from './runtime';

function resolveUrl(path: string): string {
  const base = (getRuntimeConfig().API_BASE || import.meta.env.VITE_API_BASE || '').trim();

  // absolute URL → use as-is
  if (/^https?:\/\//i.test(path)) return path;

  // server mode: prepend base
  if (base) {
    const cleaned = path.replace(/^\//, '');
    return new URL((base.endsWith('/') ? base : base + '/') + cleaned).toString();
  }

  // mock mode: map logical paths to /mock/*.json
  let cleaned = path.replace(/^\//, '').replace(/^mock\//, '');
  const file = cleaned.endsWith('.json') ? cleaned : `${cleaned}.json`;
  return `/mock/${file}`;
}

export async function httpGet<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = resolveUrl(path);
  const res = await fetch(url, {
    ...init,
    method: 'GET',
    headers: { Accept: 'application/json', ...(init.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GET ${url} -> ${res.status} ${res.statusText} | body: ${text.slice(0, 180)}`);
  }
  return res.json() as Promise<T>;
}

==================================================
RUNTIME CONTRACT (NO CODE — JUST CONTRACT)
==================================================
- services/api/runtime.ts MUST export:
  - `type AppConfig = { API_BASE: string }`
  - `async function loadRuntimeConfig(): Promise<void>` that fetches `/app-config.json` with `{ cache: 'no-store' }` and stores it.
  - `function getRuntimeConfig(): AppConfig` that returns the stored object.
- main.tsx MUST:
  - `await loadRuntimeConfig();`
  - then render `<RouterProvider router={router} />` (or `<App />`) after importing `styles/tokens.css` and `styles/globals.css`.

==================================================
ACCEPTANCE CHECKS
==================================================
- `npm i && npm run dev` boots.
- Visiting `/app-config.json` and `/mock/*.json` returns JSON.
- With `API_BASE: ""`, requests hit `/mock/*.json`.
- With `API_BASE` set to a real URL, requests go to that base with no rebuild.
- `/` and `/forms` routes render; Tailwind utilities and tokens are applied.
- `features/forms/services/forms.service.ts` uses `httpGet('/formCatalog')`.
- `features/forms/hooks/useFormSearch.ts` centralizes search/filter/sort/pagination + URL-sync readiness.
- `components/layout/TopHeader.*` exists (TSX + CSS module + test).
- Any **unused** files/folders after refactors are renamed with the **`Remove_`** prefix.
