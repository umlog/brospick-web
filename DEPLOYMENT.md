# 브로스픽 Next.js 프로젝트 Netlify 배포 가이드

이 가이드는 Next.js 프로젝트를 GitHub와 Netlify를 통해 배포하는 방법을 안내합니다.

---

## 1단계: GitHub 저장소 생성 및 초기 설정

### GitHub 저장소 만들기

1. GitHub.com 접속
2. 우측 상단 "+" → "New repository" 클릭
3. Repository 설정:
   - Repository name: `brospick-web` (또는 원하는 이름)
   - Description: "BrosPick Official Website"
   - Public 선택 (비용 없음)
   - "Add .gitignore" → "Node" 선택 (이미 있으면 스킵)
   - License: "MIT License" 선택 (선택사항)
4. "Create repository" 클릭

---

## 2단계: 로컬 프로젝트 Git 설정

### 명령어 실행 (터미널 또는 명령 프롬프트)

**Windows (Git Bash) 또는 Mac/Linux (터미널):**

```bash
# 1. 프로젝트 폴더로 이동
cd brospick-web

# 2. Git 초기화 (이미 되어 있으면 스킵)
git init

# 3. GitHub 저장소 연결 (아래 URL은 본인 저장소 URL로 변경)
git remote add origin https://github.com/[본인아이디]/brospick-web.git

# 4. 모든 파일 추가
git add .

# 5. 첫 커밋
git commit -m "Initial commit: BrosPick Next.js website"

# 6. 메인 브랜치 설정 및 푸시
git branch -M main
git push -u origin main
```

---

## 3단계: 필수 파일 확인

프로젝트에 다음 파일들이 있어야 합니다:

```
brospick-web/
├── app/                    # Next.js App Router
├── public/                 # 정적 파일
├── package.json            # ✅ 이미 있음
├── .gitignore             # ✅ 이미 있음
├── netlify.toml           # ✅ 생성됨
├── next.config.js         # ✅ 이미 있음
└── tsconfig.json          # ✅ 이미 있음
```

### netlify.toml 확인

프로젝트 루트에 `netlify.toml` 파일이 있는지 확인하세요. 이 파일은 Netlify 배포 설정을 포함합니다.

---

## 4단계: 로컬 빌드 테스트

배포 전에 로컬에서 빌드가 성공하는지 확인합니다:

```bash
# 1. 의존성 설치 (처음 한 번만)
npm install

# 2. 빌드 테스트
npm run build

# 3. 빌드 성공 확인
# ✅ .next 폴더가 생성되었는지 확인
# ✅ 에러가 없는지 확인

# 4. 로컬 서버 실행 (선택사항)
npm run start
# 브라우저에서 http://localhost:3000 접속하여 확인
```

---

## 5단계: GitHub에 푸시

```bash
# 모든 변경사항 추가
git add .

# 커밋 (의미있는 메시지 작성)
git commit -m "Add Netlify deployment configuration"

# GitHub에 푸시
git push
```

---

## 6단계: Netlify에 배포

### Netlify 배포 방법

1. **Netlify.com 접속**
   - https://netlify.com 접속
   - "Sign up" 클릭
   - GitHub 계정으로 로그인 권장

2. **새 사이트 생성**
   - 대시보드에서 "Add new site" → "Import an existing project" 클릭
   - "Deploy with GitHub" 선택

3. **GitHub 저장소 연결**
   - GitHub 인증 후 저장소 목록에서 `brospick-web` 선택
   - 필요시 권한 승인

4. **빌드 설정 확인**
   Netlify가 Next.js 프로젝트를 자동 감지합니다:
   - **Build command**: `npm run build` (자동 감지)
   - **Publish directory**: `.next` (netlify.toml에서 설정됨)
   - **Node version**: 자동 감지 (또는 `package.json`의 `engines.node`)

5. **고급 설정 (선택사항)**
   - Environment variables 추가 필요시 (예: API 키)
   - Branch to deploy: `main` (또는 원하는 브랜치)

6. **"Deploy site" 클릭**
   - 첫 배포는 2-5분 소요
   - 빌드 로그를 실시간으로 확인 가능

---

## 7단계: 배포 확인

### 배포 완료 후:

1. **사이트 URL 확인**
   - Netlify 대시보드에서 배포된 사이트 URL 확인
   - 형식: `https://[랜덤이름].netlify.app`
   - 커스텀 도메인 설정 가능 (설정 → Domain settings)

2. **사이트 테스트**
   - 모든 페이지 정상 작동 확인
   - 이미지 및 스타일 로드 확인
   - 반응형 디자인 확인 (모바일/태블릿)

3. **보안 헤더 확인**
   - DevTools (F12) → Network 탭
   - Response Headers에서 보안 헤더 확인:
     - `X-Content-Type-Options: nosniff`
     - `X-Frame-Options: DENY`
     - `X-XSS-Protection: 1; mode=block`

---

## 8단계: 이후 수정 및 재배포

### 자동 배포 (권장)

GitHub에 푸시하면 Netlify가 자동으로 재배포합니다:

```bash
# 1. 파일 수정

# 2. 변경사항 커밋
git add .
git commit -m "Update: 변경사항 설명"

# 3. GitHub에 푸시
git push

# 4. Netlify가 자동으로 재배포 시작 (2-3분)
# → Netlify 대시보드에서 배포 상태 확인
```

### 수동 배포 (선택사항)

Netlify 대시보드에서 "Trigger deploy" → "Clear cache and deploy site" 클릭

---

## 9단계: 환경 변수 설정 (필요시)

만약 API 키나 다른 비밀 정보가 필요하면:

1. Netlify 대시보드 → Site settings → Environment variables
2. "Add variable" 클릭
3. Key와 Value 입력
4. Scope 선택 (Production, Preview, Deploy preview)
5. 저장 후 재배포

### 로컬에서 환경 변수 사용

`.env.local` 파일 생성 (이미 `.gitignore`에 포함됨):

```
NEXT_PUBLIC_API_URL=https://api.example.com
```

---

## 10단계: 커스텀 도메인 설정 (선택사항)

1. Netlify 대시보드 → Domain settings
2. "Add custom domain" 클릭
3. 도메인 이름 입력 (예: `brospick.com`)
4. DNS 설정 안내에 따라 도메인 제공업체에서 DNS 레코드 추가
5. SSL 인증서 자동 발급 (Let's Encrypt)

---

## 문제 해결

### 빌드 실패 시

1. **로컬 빌드 테스트**
   ```bash
   npm run build
   ```
   로컬에서도 실패하면 코드 문제일 가능성

2. **Netlify 빌드 로그 확인**
   - Netlify 대시보드 → Deploys → 실패한 배포 클릭
   - 빌드 로그에서 에러 메시지 확인

3. **일반적인 문제**
   - Node 버전 불일치: `package.json`에 `"engines": { "node": "18.x" }` 추가
   - 의존성 문제: `package-lock.json` 삭제 후 `npm install` 재실행
   - TypeScript 에러: `tsconfig.json` 설정 확인

### 성능 최적화

1. **이미지 최적화**
   - `next/image` 컴포넌트 사용
   - `next.config.js`에서 이미지 최적화 설정 확인

2. **번들 크기 확인**
   ```bash
   npm run build
   # 빌드 출력에서 번들 크기 확인
   ```

---

## 최종 체크리스트

- [ ] GitHub 저장소 생성 완료
- [ ] 로컬에서 `git init` 완료
- [ ] `netlify.toml` 파일 생성 완료
- [ ] `.gitignore`에 `.env*`, `node_modules`, `.next` 포함 확인
- [ ] 로컬에서 `npm run build` 성공 확인
- [ ] GitHub에 첫 커밋 및 푸시 완료
- [ ] Netlify에 연결 및 배포 완료
- [ ] 배포된 사이트 정상 작동 확인
- [ ] 보안 헤더 확인 완료
- [ ] 자동 배포 작동 확인 (테스트 푸시)

---

## 참고 자료

- [Next.js 배포 문서](https://nextjs.org/docs/deployment)
- [Netlify Next.js 문서](https://docs.netlify.com/integrations/frameworks/next-js/)
- [Git 기본 명령어](https://git-scm.com/docs)

---

**완료 시 상태:**
- ✅ GitHub: 소스코드 안전 보관
- ✅ Netlify: 라이브 배포 (자동 HTTPS, CDN, 무료 티어로 충분)
- ✅ 보안: 보안 헤더 설정 완료
- ✅ 자동화: `git push`로 자동 배포

