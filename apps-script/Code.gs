/* ============================================================
   호랑봇 안내소 — 구글 시트 연결 스크립트

   설치는 SHEETS.md 참고. 요약:
     시트 → 확장 프로그램 → Apps Script → 이 내용 전체 붙여넣기
     → ADMIN_KEY 바꾸기 → setup 실행 → 배포(웹 앱, 모든 사용자)
   ============================================================ */

/* 사이트 config.js 의 ADMIN_KEY 와 똑같이 맞추세요. */
const ADMIN_KEY = "tiger2026";

/* 시트 ID.
   시트에서 [확장 프로그램 → Apps Script] 로 만들었다면 비워둬도 됩니다.
   script.google.com 에서 따로 만들었다면 반드시 채워야 합니다. */
const SHEET_ID = "1aYSJxF7fICdud5SpTIXjQTCIlldru1trP-Hpf_bvrOU";

/* 한 종류 = 한 탭 (명령어·패치노트) */
const TABS = {
  commands: "명령어",
  patchnotes: "패치노트"
};

/* 자소서는 성별별로 탭 2개. 성별은 "탭"이 정합니다(열이 아니라). */
const MEMBER_TABS = { "남자": "남자 자소서", "여자": "여자 자소서" };

/* 탭을 새로 만들 때 넣을 제목 줄 */
const HEADERS = {
  commands: ["명령어", "설명", "분류", "관리자전용"],
  patchnotes: ["날짜", "분류", "버전", "내용"]
};

/* 자소서 탭 헤더 — 성별 열은 없습니다(탭 이름이 성별) */
const MEMBER_HEADER = ["닉네임", "나이", "키", "전공 or 직업", "쉬는 요일", "취미", "MBTI",
                       "본인의 매력", "이상형", "흡연유무 & 주량", "하고싶은 말"];

/* ============================================================
   설치 확인 — 편집기에서 이 함수를 실행하세요.
   탭들을 만들고, 결과를 아래 [실행 로그] 에 찍어줍니다.
   ============================================================ */
function setup() {
  const ss = book();
  Logger.log("연결된 시트: " + ss.getName());
  Logger.log("시트 주소: " + ss.getUrl());

  const made = [], already = [];
  Object.keys(TABS).forEach(function (k) {
    (ss.getSheetByName(TABS[k]) ? already : made).push(TABS[k]);
    getSheet(TABS[k], HEADERS[k]);
  });
  Object.keys(MEMBER_TABS).forEach(function (g) {
    (ss.getSheetByName(MEMBER_TABS[g]) ? already : made).push(MEMBER_TABS[g]);
    getSheet(MEMBER_TABS[g], MEMBER_HEADER);
  });

  Logger.log("새로 만든 탭: " + (made.length ? made.join(", ") : "없음"));
  Logger.log("이미 있던 탭: " + (already.length ? already.join(", ") : "없음"));
  Logger.log("현재 탭 전체: " + ss.getSheets().map(function (s) { return s.getName(); }).join(", "));
  Logger.log("--- 여기까지 보이면 성공입니다. 시트를 새로고침하세요. ---");

  return "완료 — 위 로그를 확인하세요.";
}

/* ============================================================
   공통
   ============================================================ */

function book() {
  let ss = null;
  try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) { /* 무시 */ }
  if (!ss && SHEET_ID) {
    try { ss = SpreadsheetApp.openById(SHEET_ID); } catch (e) {
      throw new Error("SHEET_ID 로 시트를 열지 못했습니다. ID가 맞는지, 이 계정에 권한이 있는지 확인하세요. (" + e + ")");
    }
  }
  if (!ss) {
    throw new Error("시트를 찾지 못했습니다. 이 스크립트가 시트에 연결돼 있지 않다면 위쪽 SHEET_ID 를 채우세요.");
  }
  return ss;
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* 이름+헤더로 탭 확보 (없으면 헤더 넣어 새로 만듦) */
function getSheet(name, header) {
  const ss = book();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(header);
    sh.getRange(1, 1, 1, header.length).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  return sh;
}

/* 탭 하나 읽기 → 데이터 행 배열 (헤더 제외, 빈 행 제외, 문자열 trim) */
function readTab(name, header) {
  const sh = getSheet(name, header);
  const last = sh.getLastRow();
  if (last < 2) return [];
  const values = sh.getRange(2, 1, last - 1, header.length).getDisplayValues();
  return values.filter(function (row) {
    return row.some(function (v) { return String(v).trim() !== ""; });
  }).map(function (row) {
    return row.map(function (v) { return String(v).trim(); });
  });
}

/* 탭 하나 다시쓰기 (헤더 유지, 2행부터 값 교체) */
function writeTab(name, header, rows) {
  const sh = getSheet(name, header);
  if (sh.getLastRow() > 1) {
    sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).clearContent();
  }
  sh.getRange(1, 1, 1, header.length).setValues([header]);
  if (rows.length) {
    sh.getRange(2, 1, rows.length, header.length).setValues(rows);
  }
}

/* ============================================================
   읽기 — 사이트가 화면을 그릴 때
   ============================================================ */

function doGet(e) {
  try {
    const data = {};
    Object.keys(TABS).forEach(function (k) {
      data[k] = readTab(TABS[k], HEADERS[k]);
    });

    // 자소서: 성별별 탭을 읽어 성별을 index 1에 주입해 하나의 members 로 합침
    //   탭행 [닉, 나이, 키, ...] (11) → [닉, 성별, 나이, 키, ...] (12)
    const members = [];
    Object.keys(MEMBER_TABS).forEach(function (g) {
      readTab(MEMBER_TABS[g], MEMBER_HEADER).forEach(function (row) {
        members.push([row[0], g].concat(row.slice(1)));
      });
    });
    data.members = members;

    return json({ ok: true, data: data });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/* ============================================================
   쓰기 — 관리자가 사이트에서 저장할 때
   ============================================================ */

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);   // 두 사람이 동시에 저장해도 섞이지 않도록

    const body = JSON.parse(e.postData.contents);

    if (body.key !== ADMIN_KEY) {
      return json({ ok: false, error: "관리자 키가 맞지 않습니다." });
    }

    const incoming = body.data || {};

    // 단순 탭 (명령어·패치노트)
    Object.keys(TABS).forEach(function (k) {
      if (!incoming[k]) return;          // 안 보낸 항목은 그대로 둡니다
      const head = HEADERS[k];
      const rows = incoming[k].map(function (r) {
        const row = [];
        for (var i = 0; i < head.length; i++) row.push(r[i] == null ? "" : r[i]);
        return row;
      });
      writeTab(TABS[k], head, rows);
    });

    // 자소서: 성별(index 1)로 갈라 각 탭에. 성별 열은 떼고 11칸으로 저장.
    //   들어온 행 [닉, 성별, 나이, 키, ...] (12) → 탭행 [닉, 나이, 키, ...] (11)
    if (incoming.members) {
      const byGender = { "남자": [], "여자": [] };
      incoming.members.forEach(function (r) {
        const g = (String(r[1] || "").indexOf("여") >= 0) ? "여자" : "남자";
        const row = [r[0] == null ? "" : r[0]];
        for (var i = 2; i < MEMBER_HEADER.length + 1; i++) row.push(r[i] == null ? "" : r[i]);
        byGender[g].push(row);
      });
      Object.keys(MEMBER_TABS).forEach(function (g) {
        writeTab(MEMBER_TABS[g], MEMBER_HEADER, byGender[g]);
      });
    }

    return json({ ok: true, savedAt: new Date().toISOString() });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}
