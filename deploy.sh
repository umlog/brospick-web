#!/bin/bash
# 사용법:
#   ./deploy.sh              → 타임스탬프로 커밋
#   ./deploy.sh "메시지"     → 직접 입력한 메시지로 커밋

MSG=${1:-"deploy: $(date '+%Y-%m-%d %H:%M')"}

git add .
git commit -m "$MSG"
git push origin main

echo ""
echo "✅ 배포 완료! Netlify가 자동으로 빌드를 시작합니다."
