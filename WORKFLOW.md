# 브랜치 작업 방식 (patch / main)

호랑봇 안내소 사이트는 **GitHub Pages가 `main` 브랜치를 그대로 라이브로 서빙**합니다.
그래서 두 개의 "차선"으로 나눠 씁니다.

## 두 브랜치
- **`main`** = 라이브 (실제 사이트). **검증 끝난 것만** 올라갑니다.
- **`patch`** = 작업·실험. 여기서 마음껏 커밋해도 **라이브(main)는 안 바뀝니다.**

> ⚠️ GitHub Pages 무료 요금제는 `main` 하나만 서빙합니다. `patch` 브랜치 내용은
> 사이트에 안 뜹니다. 라이브로 보려면 `main`에 병합해야 합니다.

## 언제 어느 차선?
| 상황 | 브랜치 |
|---|---|
| 작은 수정 (문구·버그 하나) | `main` 바로 (지금까지처럼 — 빠름) |
| 큰 개편 / 위험한 실험 / 여러 커밋 묶음 | `patch`에서 작업 → 검증 후 `main` 병합 |

## patch 차선 흐름
1. `patch`에서 작업·커밋 (여러 번 OK)
2. `git push origin patch` — 원격에 백업 (main/라이브 안 건드림)
3. 로컬 미리보기로 확인 (Pages엔 아직 안 뜸)
4. 좋으면 → `main`에 병합:
   ```
   git checkout main
   git merge patch
   git push          # ← 이때 라이브 반영 (Pages 재빌드)
   ```

## 메모
- push는 사용자가 `!git ... push`로 실행 (클로드는 로컬 커밋·병합까지).
- 병합 후 두 브랜치를 맞추려면: `git branch -f patch main` (patch를 main 위치로).
