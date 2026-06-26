# Next.js 14 → 15 마이그레이션 가이드 (Claude Code 전달용)

## 개요

이 프로젝트는 **Next.js 14 App Router 기반**에서 **Next.js 15**로 업그레이드를 진행합니다.
Next.js 15는 2024년 10월 21일 stable 릴리즈되었으며, 다음 세 가지를 핵심으로 다루어야 합니다.[^1]

1. **Async Request API** — 가장 광범위한 Breaking Change
2. **캐싱 기본값 역전** — 렌더링 방식과 성능에 직접 영향
3. **React 19 + Hook 변경** — `useFormState` → `useActionState`

***

## Step 0: 패키지 업그레이드

```bash
# 방법 A: 공식 Codemod (권장 — 대부분의 코드 자동 변환)
npx @next/codemod@canary upgrade latest

# 방법 B: 수동 패키지 업그레이드
npm install next@latest react@latest react-dom@latest eslint-config-next@latest
```

공식 Codemod를 사용하면 `next-async-request-api`, `app-dir-runtime-config-experimental-edge` 등을 대화형으로 선택할 수 있습니다. Codemod 이후에도 `@next-codemod-error` 주석이 남아있는 곳은 수동 수정이 필요합니다.[^2][^3]

***

## 핵심 변경 1: Async Request APIs (Breaking Change)

### 무엇이 바뀌었나

`cookies()`, `headers()`, `draftMode()`, `params`, `searchParams`가 전부 **Promise를 반환**하도록 변경되었습니다. 이는 렌더 타임과 프리렌더 타임을 분리하기 위한 구조적 변화입니다.[^4]

**영향받는 파일 유형:**
- `layout.js`, `page.js`, `route.js`, `default.js`
- `generateMetadata`, `generateViewport`
- Server Actions, Middleware

### 코드 변경 패턴

**Server Component — params, searchParams:**

```typescript
// ❌ Next.js 14 (동기)
export default function Page({ params }: { params: { id: string } }) {
  const { id } = params;
  return <div>{id}</div>;
}

// ✅ Next.js 15 (비동기)
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <div>{id}</div>;
}
```

**cookies / headers:**

```typescript
// ❌ Next.js 14
import { cookies, headers } from 'next/headers';

export default function Page() {
  const cookieStore = cookies();
  const token = cookieStore.get('token');
  const headerList = headers();
  // ...
}

// ✅ Next.js 15
import { cookies, headers } from 'next/headers';

export default async function Page() {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  const token = cookieStore.get('token');
  // ...
}
```

**Route Handler:**

```typescript
// ❌ Next.js 14
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
}

// ✅ Next.js 15
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
}
```

**Client Component — `React.use()`로 unwrap:**

```typescript
// ✅ Client Component에서는 await 대신 React.use()
'use client';
import { use } from 'react';

export function ClientPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = use(searchParams);
  return <input defaultValue={q} />;
}
```

### 자동화 Codemod

```bash
npx @next/codemod@canary next-async-request-api .
```

대부분의 케이스를 자동 변환하지만, 추가 로직이 있는 복잡한 경우는 완벽히 처리하지 못할 수 있으므로 반드시 diff 검토 필요. 변환 불가 위치에는 `@next-codemod-error` 주석이 남으므로, 이를 grep으로 찾아 수동 처리.[^5][^3]

```bash
# Codemod 후 누락된 곳 찾기
grep -r "@next-codemod-error" .
```

***

## 핵심 변경 2: 캐싱 기본값 역전 (Breaking Change)

### 변경 요약

| 항목 | Next.js 14 | Next.js 15 |
|------|-----------|-----------|
| `fetch()` 기본값 | `cache: 'force-cache'` (캐시됨)[^6] | `cache: 'no-store'` (캐시 안됨)[^7][^8] |
| GET Route Handler | 기본 캐시됨[^9][^8] | 기본 캐시 안됨[^9][^8] |
| Client Router Cache staleTime | 비교적 긴 기본값[^10][^9] | 기본값 `0` (항상 최신)[^9] |

### 영향 범위

기존에 "자동으로 캐시되던" 모든 fetch 요청과 GET API 라우트가 **이제는 매 요청마다 새로 실행**됩니다. 이는 성능 저하로 이어질 수 있으므로, 기존처럼 캐싱을 원하면 명시적으로 설정해야 합니다.[^7][^11]

### 코드 변경 패턴

**fetch에 캐시 복원:**

```typescript
// 14와 동일하게 캐시 유지하려면
const data = await fetch('/api/data', { cache: 'force-cache' });

// 명시적 revalidate 설정
const data = await fetch('/api/data', { next: { revalidate: 60 } });
```

**GET Route Handler를 정적으로 캐시하려면:**

```typescript
// app/api/posts/route.ts
export const dynamic = 'force-static'; // 이 줄 추가

export async function GET() {
  const posts = await getPosts();
  return Response.json(posts);
}
```

**Client Router Cache 기존 동작 유지 (`next.config.ts`):**

```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    clientRouterCacheConfig: {
      default: {
        revalidate: false, // 14 방식으로 되돌리기
      },
    },
  },
};
export default nextConfig;
```

> **⚠️ 주의:** 프로덕션에서 14 → 15로 업그레이드 후 서버 부하가 증가하는 경우는 거의 대부분 이 캐싱 기본값 변경 때문입니다. fetch가 많은 페이지는 반드시 점검 필요.[^11]

***

## 핵심 변경 3: React 19 & Hook 변경

### `useFormState` → `useActionState`

`useFormState`는 React 19에서 deprecated되어 `useActionState`로 교체되었습니다. `useActionState`는 기존에 별도로 관리하던 `pending` 상태를 반환 튜플에 포함합니다.[^12][^13]

```typescript
// ❌ Next.js 14 / React 18
import { useFormState } from 'react-dom';

const [state, dispatch] = useFormState(action, initialState);

// ✅ Next.js 15 / React 19
import { useActionState } from 'react'; // 'react-dom'이 아닌 'react'에서 import

const [state, dispatch, isPending] = useActionState(action, initialState);
//                        ↑ pending 상태가 튜플에 포함됨
```

### `ssr: false` 제한

`next/dynamic`에서 `ssr: false` 옵션은 **Server Component 내에서 사용 불가**입니다. Client Component 안에서만 사용해야 합니다.[^14]

```typescript
// ❌ Server Component에서 사용 불가
const Chart = dynamic(() => import('./Chart'), { ssr: false });

// ✅ 'use client' 파일 내에서만 사용
'use client';
const Chart = dynamic(() => import('./Chart'), { ssr: false });
```

***

## 새로운 기능 활용 포인트

### `after()` — 응답 후 비동기 작업

응답 스트리밍이 완료된 **이후에** 실행되는 코드 블록으로, 로깅·분석·알림 등에 활용.[^15][^1]

```typescript
import { after } from 'next/server';

export async function POST(request: Request) {
  const data = await request.json();
  const result = await saveToDatabase(data);

  // 응답을 블로킹하지 않고 사후 처리
  after(async () => {
    await sendNotification(result.id);
    await logAnalytics('post_created', result.id);
  });

  return Response.json(result);
}
```

### `next.config.ts` TypeScript 지원

`next.config.js` → `next.config.ts`로 전환하면 `NextConfig` 타입으로 자동완성과 타입 안전성을 얻을 수 있습니다.[^16]

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 이제 타입 안전하게 설정 가능
};

export default nextConfig;
```

### Turbopack — 개발 서버 성능

```bash
# next.config 대신 CLI에서 활성화
next dev --turbo
```

Turbopack은 로컬 서버 시작 76.7% 단축, Fast Refresh 96.3% 단축, 초기 라우트 컴파일 45.8% 단축의 성능 향상을 제공합니다. 단, 프로덕션 빌드(`next build`)에는 아직 Webpack이 사용됩니다.[^17][^18]

### `<Form>` 컴포넌트

HTML `<form>` 대신 `next/form`의 `<Form>` 컴포넌트를 사용하면 prefetching, 클라이언트 사이드 네비게이션, Progressive Enhancement가 자동 적용됩니다.[^16]

```typescript
import Form from 'next/form';

export default function SearchForm() {
  return (
    <Form action="/search">
      <input name="q" />
      <button type="submit">검색</button>
    </Form>
  );
}
```

***

## 마이그레이션 실행 순서

```
1. 브랜치 생성 (git checkout -b feat/next15-migration)

2. 공식 Codemod 실행
   npx @next/codemod@canary upgrade latest
   → React 19 TypeScript types: Yes
   → Turbopack: 팀 결정에 따라 선택

3. @next-codemod-error 주석 수동 처리
   grep -r "@next-codemod-error" .

4. 캐싱 감사
   - fetch() 호출 목록 작성
   - GET Route Handler 목록 작성
   - 캐시가 필요한 곳에 명시적 cache 옵션 추가

5. useFormState → useActionState 교체
   - import 경로 'react-dom' → 'react' 변경
   - 반환 튜플에 isPending 추가

6. next.config.js → next.config.ts 전환 (선택)

7. npm run dev 실행 후 콘솔 경고 모두 처리

8. 빌드 테스트
   npm run build
```

***

## 버전별 최소 요구사항

| 항목 | Next.js 14 | Next.js 15 |
|------|-----------|-----------|
| React | 18 | **19** (App Router 필수)[^14][^6] |
| Node.js 최소 버전 | 18.17.0 | **18.18.0**[^6] |
| TypeScript config | `.js` only | `.ts` 지원[^16] |

***

## 자주 발생하는 에러와 해결법

| 에러 메시지 | 원인 | 해결법 |
|------------|------|--------|
| `Route used searchParams.X. searchParams should be awaited` | searchParams 동기 접근 | `await searchParams` 추가[^19] |
| `Cannot access Request information synchronously with cookies()` | cookies() 동기 호출 | `await cookies()` 변경[^3] |
| `useFormState is not a function` / `useActionState not found` | import 경로 오류 | `import { useActionState } from 'react'`[^20] |
| 빌드 후 성능 저하 / API 과호출 | 캐싱 기본값 역전 | fetch에 `cache: 'force-cache'` 또는 `revalidate` 명시[^7][^11] |
| `ssr: false in Server Component` | dynamic import 위치 오류 | Client Component로 이동[^14] |

---

## References

1. [Next.js 15 Stable Version Is Here : What's New?](https://dev.to/grenishrai/nextjs-15-stable-version-is-here-3hd2) - Next.js just dropped a game-changing bombshell, releasing the stable version of Next.js 15 before th...

2. [Migrate your Store Launchpads to Next.js 15 | Frontend Development](https://docs.commercetools.com/frontend-development/nextjs15-migration) - Development documentation for commercetools Frontend

3. [Cannot access Request information synchronously with `cookies ...](https://nextjs.org/docs/messages/next-prerender-sync-headers)

4. [Guide: Fixing breaking changes after v15.0.0-canary.171 #70899](https://github.com/vercel/next.js/issues/70899) - As of version v15.0.0-canary.171, we've introduced several breaking changes to the Next.js APIs in #...

5. [Next.js 15에서 Async Request APIs 전환하기: 간단한 마이그레이션 ...](https://reactnext-central.xyz/blog/nextjs/nextjs-15x-versionup-code) - Next.js 15로 올리면서 변경해야 하는 코드가 많다면, 공식 Codemod를 활용하는 것이 좋습니다. npx @next/codemod@canary next-async-requ...

6. [Next.js 15 Lançado - Estabilização do Turbopack e Suporte ao React 19 | Notícias | Miraigaku](https://www.mirai-gaku.com/pt/repository/news/nextjs-15-features/) - Explicação completa das novas funcionalidades do Next.js 15. Apresentamos as últimas mudanças, inclu...

7. [Next.js 15 Changed the Default Fetch Cache](https://realcoding.blog/en/2026/03/07/nextjs-15-fetch-cache-default-change/) - Next.js 15 changed fetch default caching to no-store. Here’s how to fix the performance hit.

8. [Next.js 15 - Codemancers](https://www.codemancers.com/blog/2024-next.js-15-optimizing-cache-for-better-performance) - Next.js 15's caching changes provide more control over caching behavior, enabling better SSR and SSG...

9. [Next.js 15 - What's New?](https://jhayer.tech/blog/web/next-15-changes) - An overview of the major changes and improvements in Next.js 15

10. [[Next.js 스터디] Next.js 14 -> 15 변경점](https://velog.io/@he0_077/Next.js-Next.js-14-15-%EB%B3%80%EA%B2%BD%EC%A0%90) - Next.js App Router 는 최상의 성능을 위해 기본적으로 캐시를 사용하고, 설정을 해제할 수 있었다. 15 버전에서는 GET Route Handler, Client Ro...

11. [Next.js 15 Caching Changes: Fixing Uncached GET ...](https://coldfusion-example.blogspot.com/2025/12/nextjs-15-caching-changes-fixing.html) - If you recently migrated a production application from Next.js 14 to Next.js 15, you likely noticed ...

12. [Upgrading: Version 15 - Next.js](https://nextjs.org/docs/app/guides/upgrading/version-15) - useFormState has been replaced by useActionState . The useFormState hook is still available in React...

13. [useFormState から useActionState に移行する](https://zenn.dev/zksytmkn/articles/cf2acb2faf7cd2)

14. [How should I adopt React 19 in Next.js 15? - PocketLantern](https://pocketlantern.dev/briefs/react-19-server-components-adoption-strategy-nextjs-15-remix-3) - React 19 is required by Next.js 15 App Router, and its server-first defaults introduce breaking chan...

15. [How to use the NEW after() function in Next.js 15](https://www.youtube.com/watch?v=ZamSnm3k2k8) - Next.js 15 introduces a new function called after() which allows you to schedule some code to run af...

16. [Next.js 15 arrives with faster bundler - InfoWorld](https://www.infoworld.com/article/3587112/next-js-15-arrives-with-faster-bundler.html) - High-performance Rust-based Turbopack bundler moves from beta to stable with the latest update of th...

17. [Next.js 15: Complete Guide to the Latest Release | Clynt - Clynt](https://clynt.com/blog/web-development/nextjs/nextjs-15) - Next.js 15: React 19 support, stable Turbopack, breaking caching changes, async request APIs, and mi...

18. [7.Migration Guide: From Next...](https://jishulabs.com/blog/nextjs-15-16-features-migration-guide-2026) - Master the latest Next.js features including Turbopack, React Server Components, Partial Prerenderin...

19. [Route used `searchParams.X`. `searchParams` should be awaited ...](https://deadends.dev/nextjs/searchparams-sync-access/) - Next.js 15 changed searchParams and params from synchronous objects to Promises. Code that accesses ...

20. [useActionState not found - React19/NextJS15 - Stack Overflow](https://stackoverflow.com/questions/79369235/useactionstate-not-found-react19-nextjs15) - useFormState has been renamed to React.useActionState. Please update UserForm to use React.useAction...

