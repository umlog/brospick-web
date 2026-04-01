#!/bin/bash
# 사용법:
#   ./deploy.sh              → 타임스탬프로 커밋
#   ./deploy.sh "메시지"     → 직접 입력한 메시지로 커밋

set -e  # 에러 발생 시 즉시 중단

MSG=${1:-"deploy: $(date '+%Y-%m-%d %H:%M')"}

echo "🔍 빌드 사전 검증 중..."
echo ""

# 로컬 빌드로 타입 에러 및 컴파일 오류 사전 차단
if ! npm run build; then
  echo ""
  echo "❌ 빌드 실패 — 푸시를 중단합니다."
  echo "   위 에러를 수정한 후 다시 실행해주세요."
  exit 1
fi

echo ""
echo "✅ 빌드 성공 — 배포를 시작합니다."
echo ""

git add .
git commit -m "$MSG"
git push origin main

echo ""
echo "🚀 배포 완료! Netlify가 자동으로 빌드를 시작합니다."
