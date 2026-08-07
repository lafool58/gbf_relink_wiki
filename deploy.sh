#!/bin/bash
cd "$(dirname "$0")"

echo "=================================================="
echo "   GitHub Pages 배포 자동화 스크립트 (deploy.sh)"
echo "=================================================="

# 1. 깃 초기화 여부 확인
if [ ! -d ".git" ]; then
    echo "▶ Git 저장소를 초기화합니다..."
    git init
    git branch -M main
fi

# 2. 원격 저장소 설정 여부 확인
REMOTE_URL=$(git remote get-url origin 2>/dev/null)
if [ -z "$REMOTE_URL" ]; then
    echo "▶ GitHub Repository URL이 설정되지 않았습니다."
    read -p "보스의 깃허브 레포지토리 URL을 입력해주세요 (예: https://github.com/사용자명/레포이름.git): " USER_URL
    if [ -z "$USER_URL" ]; then
        echo "❌ 오류: URL 입력이 취소되었습니다. 배포를 중단합니다."
        exit 1
    fi
    git remote add origin "$USER_URL"
fi

# 3. 파일 추가 및 커밋
echo "▶ 변경 사항을 스테이징에 추가합니다..."
git add .

echo "▶ 커밋 메시지를 작성합니다..."
git commit -m "Deploy GBF Relink Complete Wiki Guide static site"

# 4. 푸시 및 GitHub Pages 안내
echo "▶ GitHub 원격 저장소(main)로 푸시합니다..."
git push -u origin main

echo "--------------------------------------------------"
echo "🎉 배포 요청 완료!"
echo "▶ 깃허브 설정(Settings) ➡️ Pages 메뉴로 이동하여"
echo "   Build and deployment source를 'Deploy from a branch'로 설정하고"
echo "   'main' 브라우저의 '/ (root)' 경로로 지정하면 배포가 완료됩니다."
echo "=================================================="
