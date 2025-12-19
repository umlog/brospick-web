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

This project is configured for deployment on Netlify.

### Quick Deploy Steps:

1. **GitHub에 코드 푸시**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Netlify에 연결**
   - [Netlify.com](https://netlify.com) 접속
   - "Sign up" → GitHub 계정으로 로그인
   - "New site from Git" 클릭
   - GitHub 저장소 선택 (`brospick-web`)
   - 빌드 설정이 자동으로 감지됩니다:
     - Build command: `npm run build`
     - Publish directory: `.next`
   - "Deploy" 클릭

3. **배포 완료!**
   - Netlify가 자동으로 배포합니다 (2-3분 소요)
   - 이후 GitHub에 푸시할 때마다 자동 재배포됩니다

### 배포 전 체크리스트:

- [ ] `netlify.toml` 파일 확인
- [ ] `.gitignore`에 `.env*`, `node_modules`, `.next` 포함 확인
- [ ] 로컬에서 `npm run build` 성공 확인
- [ ] GitHub 저장소에 코드 푸시 완료

### 배포 후 확인:

- [ ] 배포된 사이트 URL 접속 가능
- [ ] 모든 페이지 정상 작동
- [ ] 이미지 및 스타일 로드 확인

---

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
