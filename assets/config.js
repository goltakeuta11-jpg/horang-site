/* ============================================================
   config.js  —  여기만 고치면 사이트 설정이 바뀝니다.
   ============================================================ */

window.CONFIG = {
  /* 방 이름 / 봇 이름 */
  ROOM_NAME: "호랑봇",
  BOT_NAME: "호랑봇",

  /* 관리자 인증 = 이 키를 Apps Script(Code.gs)의 ADMIN_KEY 와 대조.
     홈 화면에서 이 비밀번호로 로그인하면 이후 저장 요청에 key 로 실려 Apps Script가 검증.
     ※ 서버리스(Apps Script 직결)라 브라우저에 키가 들어있음 — Code.gs 의 ADMIN_KEY 와 반드시 동일하게 유지. */
  ADMIN_KEY: "tiger2026",

  /* ============================================================
     구글 시트 연동 — 아래 두 가지 중 하나를 고르면 됩니다.

     [읽기 전용]  SHEET_ID 만 채움
        시트에 적으면 사이트에 나옵니다. 사이트에서는 수정 못 합니다.

     [읽기 + 쓰기]  SCRIPT_URL 까지 채움  ← 원하시는 방식
        사이트에서 관리자가 적으면 시트에 자동으로 저장됩니다.
        SHEETS.md 의 "Apps Script 붙이기" 를 먼저 하세요.
     ============================================================ */

  /* 시트 주소 가운데 부분 (Bot_Web_v2 — 2026-11-02 새 파일 이전) */
  SHEET_ID: "1npwML2NhMYyLsn02xRvZ8zbGmpOJs1m27r95ke4IZBk",

  /* Apps Script 주소 — 서버리스(VPS 제거) 전환으로 어디서든 Apps Script 직결 고정.
     (예전엔 horangbot.co.kr에서 /api/gs 서버 프록시를 탔지만 서버를 없앴음) */
  SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyRlMLzUFwhUi8q7j969nH86iTWZNT-G8DWovAh40Jqya2grTuqugClRLU67BpIiK90/exec",

  /* 각 화면이 쓸 탭(시트) 이름 — 시트의 탭 이름과 정확히 같아야 합니다 */
  SHEETS: {
    commands: "명령어",
    members: "자소서",
    patchnotes: "패치노트",
    outings: "외출"
  }
};
