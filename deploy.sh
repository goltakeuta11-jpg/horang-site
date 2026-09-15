#!/usr/bin/env bash
# 호랑봇 안내소 → 서버(horangbot.co.kr) 배포 스크립트
# 사용법:  bash deploy.sh
# 공개 파일(*.html, version.txt, assets/)만 올림. apps-script/·문서·스샷은 제외.
set -e

SERVER="horang@167.172.87.148"
KEY="$HOME/.ssh/id_ed25519"
WEBROOT="/var/www/horangbot"
STAGING="~/site-staging"

cd "$(dirname "$0")"   # 스크립트 위치(=패치업로드)로 이동

echo "① 서버 스테이징 폴더 초기화..."
ssh -i "$KEY" "$SERVER" "rm -rf $STAGING && mkdir -p $STAGING/assets"

echo "② 파일 업로드 (html + version + assets)..."
scp -i "$KEY" -q *.html version.txt "$SERVER:$STAGING/"
scp -i "$KEY" -q assets/* "$SERVER:$STAGING/assets/"

echo "③ 웹 루트로 반영 (기존 정리 후 교체)..."
ssh -i "$KEY" "$SERVER" "
  sudo rm -rf $WEBROOT/*
  sudo cp -r $STAGING/* $WEBROOT/
  sudo chown -R www-data:www-data $WEBROOT
"

echo "④ 검증..."
LIVE_VER=$(ssh -i "$KEY" "$SERVER" "curl -s https://horangbot.co.kr/version.txt")
LOCAL_VER=$(cat version.txt)
echo "   로컬 version.txt : $LOCAL_VER"
echo "   서버 version.txt : $LIVE_VER"
if [ "$LIVE_VER" = "$LOCAL_VER" ]; then
  echo "✅ 배포 완료 — https://horangbot.co.kr ($LIVE_VER)"
else
  echo "⚠️ 버전 불일치 — 확인 필요"
fi
