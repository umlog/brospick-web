This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Netlify

This project is configured for deployment on Netlify with automatic deployments.

### ✅ 자동 배포 설정 완료!

Netlify가 GitHub 저장소와 연결되어 있으면, **코드를 푸시할 때마다 자동으로 배포**됩니다.

### 📝 업데이트 배포 방법 (매우 간단!)

소스코드를 수정한 후 다음 명령어만 실행하면 자동으로 배포됩니다:

```bash
# 1. 변경사항 추가
git add .

# 2. 커밋 (변경사항 설명 작성)
git commit -m "Update: 변경사항 설명"

# 3. GitHub에 푸시 → Netlify가 자동으로 배포 시작! 🚀
git push
```

**끝!** 2-3분 후 Netlify 대시보드에서 배포 상태를 확인할 수 있습니다.

### 🔍 배포 상태 확인

1. **Netlify 대시보드**: https://app.netlify.com
   - 배포 진행 상황 실시간 확인
   - 빌드 로그 확인
   - 배포 완료 알림

2. **GitHub에서도 확인 가능**
   - GitHub 저장소 → Actions 탭 (있다면)
   - 또는 Netlify 배지가 README에 표시됨

### ⚙️ 초기 설정 (이미 완료했다면 스킵)

1. **Netlify에 연결** (처음 한 번만)
   - [Netlify.com](https://netlify.com) 접속
   - "New site from Git" 클릭
   - GitHub 저장소 선택 (`brospick-web`)
   - 빌드 설정 자동 감지:
     - Build command: `npm run build`
     - Publish directory: `.next`
   - "Deploy" 클릭

2. **자동 배포 설정 확인**
   - Netlify 대시보드 → Site settings → Build & deploy
   - "Continuous Deployment"가 활성화되어 있는지 확인
   - Branch: `main` (또는 `master`)

### 📋 배포 전 체크리스트 (최초 1회):

- [x] `netlify.toml` 파일 확인
- [x] `.gitignore`에 `.env*`, `node_modules`, `.next` 포함 확인
- [x] Netlify에 저장소 연결 완료
- [ ] 로컬에서 `npm run build` 성공 확인 (권장)

### ✅ 배포 후 확인:

- [ ] 배포된 사이트 URL 접속 가능
- [ ] 모든 페이지 정상 작동
- [ ] 이미지 및 스타일 로드 확인
- [ ] 자동 배포 작동 확인 (테스트 푸시)

---

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
