# 🚀 빠른 배포 가이드

## 소스코드 업데이트 후 배포하기

코드를 수정했다면 다음 3단계만 진행하면 자동으로 배포됩니다:

```bash
git add .
git commit -m "변경사항 설명"
git push
```

**끝!** Netlify가 자동으로 배포를 시작합니다. (2-3분 소요)

---

## 📌 자주 사용하는 Git 명령어

```bash
# 현재 변경사항 확인
git status

# 모든 변경사항 추가
git add .

# 특정 파일만 추가
git add app/page.tsx

# 커밋
git commit -m "Update: 페이지 수정"

# 푸시 (자동 배포 시작!)
git push

# 변경사항 확인 후 푸시 (한 번에)
git add . && git commit -m "Update" && git push
```

---

## 🔍 배포 상태 확인

### Netlify 대시보드
- https://app.netlify.com 접속
- 사이트 선택 → Deploys 탭
- 실시간 빌드 로그 확인
- 배포 완료 시 사이트 자동 업데이트

### 배포 실패 시
1. Netlify 대시보드에서 빌드 로그 확인
2. 로컬에서 `npm run build` 실행하여 에러 확인
3. 수정 후 다시 푸시

---

## 💡 Tips

- **커밋 메시지는 명확하게**: 나중에 변경 이력을 파악하기 쉽습니다
- **로컬 테스트 권장**: `npm run build`로 빌드 에러를 미리 확인하세요
- **빌드 시간**: 보통 2-3분 정도 소요됩니다
- **자동 HTTPS**: Netlify가 자동으로 HTTPS 인증서를 발급합니다

---

**자세한 내용은 README.md 참고**


