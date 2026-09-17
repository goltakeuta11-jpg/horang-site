/* ============================================================
   config.js  —  여기만 고치면 사이트 설정이 바뀝니다.
   ============================================================ */

window.CONFIG = {
  /* 방 이름 / 봇 이름 */
  ROOM_NAME: "호랑봇",
  BOT_NAME: "호랑봇",

  /* 관리자 인증은 서버에서 처리합니다(비번은 서버에만 저장).
     홈 화면에서 비밀번호로 로그인 → 서버가 임시 토큰 발급 → 그 토큰으로 저장 권한 검증.
     ※ 여기(브라우저)에는 더 이상 관리자 비번이 들어있지 않습니다. */
  ADMIN_KEY: "",

  /* ============================================================
     구글 시트 연동 — 아래 두 가지 중 하나를 고르면 됩니다.

     [읽기 전용]  SHEET_ID 만 채움
        시트에 적으면 사이트에 나옵니다. 사이트에서는 수정 못 합니다.

     [읽기 + 쓰기]  SCRIPT_URL 까지 채움  ← 원하시는 방식
        사이트에서 관리자가 적으면 시트에 자동으로 저장됩니다.
        SHEETS.md 의 "Apps Script 붙이기" 를 먼저 하세요.
     ============================================================ */

  /* 시트 주소 가운데 부분 */
  SHEET_ID: "1aYSJxF7fICdud5SpTIXjQTCIlldru1trP-Hpf_bvrOU",

  /* Apps Script 주소.
     - horangbot.co.kr(자체 서버): 같은 출처 프록시(/api/gs) → 브라우저 CORS·리다이렉트·간헐 인터스티셜 회피
     - 그 외(GitHub Pages 등): Apps Script 직접 호출 */
  SCRIPT_URL: (typeof location !== "undefined" && location.hostname === "horangbot.co.kr")
    ? "/api/gs"
    : "https://script.google.com/macros/s/AKfycbyRlMLzUFwhUi8q7j969nH86iTWZNT-G8DWovAh40Jqya2grTuqugClRLU67BpIiK90/exec",

  /* 각 화면이 쓸 탭(시트) 이름 — 시트의 탭 이름과 정확히 같아야 합니다 */
  SHEETS: {
    commands: "명령어",
    members: "자소서",
    patchnotes: "패치노트",
    outings: "외출"
  }
};
