#!/usr/bin/env bash
# 한 방에 배포 — 버전 올리기 + 서버(horangbot.co.kr) + 깃허브, 한 번에.
# 사용법:  bash publish.sh ["커밋 메시지"]   (메시지 생략하면 자동)
set -e
cd "$(dirname "$0")"

# ── ① 캐시 버전 자동 +1 (예: 20260831.31 → .32) ──
CUR=$(tr -d '[:space:]' < version.txt)
BASE="${CUR%.*}"; NUM="${CUR##*.}"; NEW="$BASE.$((NUM+1))"
sed -i "s/?v=$CUR/?v=$NEW/g" *.html
printf '%s' "$NEW" > version.txt
echo "① 버전 $CUR → $NEW"

MSG="${1:-사이트 업데이트 ($NEW)}"

# ── ② 서버 배포 ──
echo ""; echo "② 서버(horangbot.co.kr) 배포…"
bash deploy.sh

# ── ③ 깃허브 push ──
echo ""; echo "③ 깃허브 push…"
git add -A
if git diff --cached --quiet; then
  echo "   변경 없음 — 커밋 스킵"
else
  git commit -q -m "$MSG"
  git push
  echo "   ✅ 깃허브 push 완료"
fi

echo ""
echo "🎉 완료 — 서버 + 깃허브 둘 다 반영됨 ($NEW)"
