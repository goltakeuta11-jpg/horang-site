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

/* 한 종류 = 한 탭 (명령어·패치노트·외출). TABS 는 doPost 에서 "관리자만" 쓰기 가능. */
const TABS = {
  commands: "명령어",
  patchnotes: "패치노트",
  outings: "외출"
};

/* 자소서는 성별별로 탭 2개. 성별은 "탭"이 정합니다(열이 아니라). */
const MEMBER_TABS = { "남자": "남자 자소서", "여자": "여자 자소서" };

/* 작대기(매칭) — 이력 append 전용 탭. 한 사람의 "유효 작대기"는 그 사람의 마지막 행.
   받는사람 칸에 STICK_CANCEL 이 오면 = 취소(현재 유효 작대기 없음). 과거 행은 이력으로 보존. */
const STICK_TAB = "작대기";
const STICK_HEADER = ["보낸사람", "받는사람", "등록일"];
const STICK_CANCEL = "작대기 취소";

/* 탭을 새로 만들 때 넣을 제목 줄 */
const HEADERS = {
  commands: ["명령어", "설명", "분류", "관리자전용"],
  patchnotes: ["날짜", "분류", "버전", "내용"],
  outings: ["내용"]
};

/* 자소서 탭 헤더 — 성별 열은 없습니다(탭 이름이 성별)
   ★ "등록일"은 반드시 맨 끝에 둘 것. readTab 이 헤더 이름이 아니라 "위치"로 읽기 때문에,
     중간에 열을 끼워넣으면 기존 시트의 비번이 한 칸씩 밀려 통째로 어긋납니다. */
const MEMBER_HEADER = ["닉네임", "나이", "사는 곳", "키", "전공 or 직업", "쉬는 요일", "취미", "MBTI",
                       "본인의 매력", "이상형", "흡연유무 & 주량", "하고싶은 말", "연애유형", "비번", "등록일"];

/* 탭 행에서의 열 위치 (하드코딩 금지 — 헤더가 바뀌면 여기서 자동으로 따라감) */
const PW_IDX = MEMBER_HEADER.indexOf("비번");     // 13
const AT_IDX = MEMBER_HEADER.indexOf("등록일");   // 14

/* 등록 시각 도장 — 브라우저 시계는 못 믿으므로 서버가 찍습니다(KST 고정).
   ★ 형식을 바꾸려면 members.html 의 nowStamp() 도 같이 바꿔야 합니다(둘이 같은 꼴이어야 정렬이 맞음).
   ★ 자리수가 고정된 꼴이어야 문자열 비교 = 시간순이 성립합니다. 초(ss)를 빼면 같은 분에 등록한
     사람끼리 순서가 흐려지고, 초가 있는 값과 섞이면 비교가 어긋납니다. */
function stampNow() {
  return stampAt(new Date());
}
function stampAt(d) {
  return Utilities.formatDate(d, "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
}

/* 자소서 행을 "등록순 오름차순"으로 정렬 — 시트에 쓸 때 씁니다.
     · 등록일 빈칸(= 이 기능 이전부터 있던 사람)은 맨 위에, 자기들끼리는 기존 순서 그대로
     · 등록일이 있으면 오래된 것 → 최신 순
   웹 화면은 이 순서를 뒤집어 최신이 위로 오게 그립니다(members.html). */
function sortMembersAsc(rows) {
  return rows
    .map(function (r, i) { return { r: r, i: i }; })
    .sort(function (a, b) {
      var A = String(a.r[AT_IDX] || ""), B = String(b.r[AT_IDX] || "");
      if (A === B) return a.i - b.i;   // 같으면 원래 순서 유지(안정 정렬)
      if (!A) return -1;               // 빈칸 = 옛날 사람 → 위
      if (!B) return 1;
      return A < B ? -1 : 1;           // "yyyy-MM-dd HH:mm" 은 문자열 비교 = 시간순
    })
    .map(function (x) { return x.r; });
}

/* 자소서 비번용 SHA-256 hex — 브라우저 App.sha256(crypto.subtle)과 동일 결과(UTF-8, 소문자) */
function sha256hex(str) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(str == null ? "" : str), Utilities.Charset.UTF_8);
  var hex = "";
  for (var i = 0; i < bytes.length; i++) {
    var b = (bytes[i] + 256) % 256;            // 자바 byte는 부호형 → 0~255로 보정
    hex += (b < 16 ? "0" : "") + b.toString(16);
  }
  return hex;
}

/* 저장 시 비번 결정: 빈값이거나 기존 원문의 해시면 기존 원문 유지, 그 외(새 원문)는 그대로 저장 */
function resolvePw(incoming, existingPlain) {
  incoming = String(incoming == null ? "" : incoming);
  existingPlain = String(existingPlain == null ? "" : existingPlain);
  if (!incoming) return existingPlain;                                   // 안 바꿈(빈값)
  if (existingPlain && incoming === sha256hex(existingPlain)) return existingPlain; // 브라우저가 해시를 되돌려보냄=변경없음
  return incoming;                                                        // 새로 설정한 원문
}

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
   등록일 일괄 채우기 — 편집기에서 ▶ 한 번만 실행하세요.

   등록일이 비어 있는 기존 멤버에게 "지금 시각부터 1초씩" 순서대로 도장을 찍습니다.
   시트에 적힌 순서(= 등록순)를 그대로 시간 순서로 옮기는 것이라 정렬이 바뀌지 않습니다.
     · 이미 값이 있는 행은 절대 건드리지 않습니다 → 여러 번 실행해도 안전(두 번째부터는 0행 처리)
     · 남자 탭 먼저, 그다음 여자 탭 순으로 1초씩 증가
   ============================================================ */
function backfillDates() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var base = new Date().getTime();
    var n = 0, log = [];

    Object.keys(MEMBER_TABS).forEach(function (g) {
      var sh = getSheet(MEMBER_TABS[g], MEMBER_HEADER);
      var last = sh.getLastRow();
      if (last < 2) { log.push(MEMBER_TABS[g] + ": 데이터 없음"); return; }

      var rows = last - 1;
      var nicks = sh.getRange(2, 1, rows, 1).getDisplayValues();
      var atRng = sh.getRange(2, AT_IDX + 1, rows, 1);
      var at = atRng.getDisplayValues();

      var filled = 0, kept = 0;
      for (var i = 0; i < rows; i++) {
        if (!String(nicks[i][0] || "").trim()) { at[i][0] = ""; continue; }  // 빈 행
        if (String(at[i][0] || "").trim()) { kept++; continue; }             // 이미 있음 → 유지
        at[i][0] = stampAt(new Date(base + n * 1000));
        n++; filled++;
      }

      atRng.setNumberFormat("@");   // 날짜형 자동변환 방지 (값 넣기 전에 적용)
      atRng.setValues(at);
      log.push(MEMBER_TABS[g] + ": " + filled + "행 채움" + (kept ? " / " + kept + "행은 기존값 유지" : ""));
    });

    // 시트가 바뀌었으니 서버 캐시 비우기 (안 하면 최대 2분간 옛 값이 나감)
    try { CacheService.getScriptCache().remove(READ_CACHE_KEY); } catch (eC) {}

    var msg = "✅ 등록일 채우기 완료 — 총 " + n + "행\n" + log.join("\n");
    Logger.log(msg);
    return msg;
  } catch (err) {
    var e = "❌ 실패: " + err;
    Logger.log(e);
    return e;
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
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

/* PATCH_03 · 서버 캐시 — doGet 결과 JSON을 통째로 구워둠(기본 5분).
   대부분의 요청이 탭 5개 읽기 + 비번 해시 없이 즉시 응답. 편집(doPost) 시 무효화. */
var READ_CACHE_KEY = "sitedata_v1";
var READ_CACHE_SEC = 120;   // 2분 (시트 직접 수정 반영 빠르게. 짧으면 keepWarm 사이에 캐시 만료 구간 생겨 첫 로딩 가끔 느려짐)
function jsonRaw(str) {      // 이미 JSON 문자열인 걸 그대로 반환 (캐시된 응답용)
  return ContentService.createTextOutput(str).setMimeType(ContentService.MimeType.JSON);
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
  } else {
    // 헤더가 늘어났는데 시트 열이 모자라면 먼저 늘려줌 (안 하면 getRange 가 범위 초과로 죽음)
    if (sh.getMaxColumns() < header.length) sh.insertColumnsAfter(sh.getMaxColumns(), header.length - sh.getMaxColumns());
    // 헤더가 바뀌었으면(열 추가 등) 1행 헤더를 맞춰줌 — 기존 데이터 행은 건드리지 않음
    var cur = sh.getRange(1, 1, 1, header.length).getValues()[0], need = false;
    for (var i = 0; i < header.length; i++) if (("" + cur[i]).trim() !== header[i]) { need = true; break; }
    if (need) { sh.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight("bold"); }
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
  // 텍스트 형식 고정 (값 넣기 전에 적용해야 함)
  //   "비번"   → 0407 이 407 로 바뀌는 것 방지
  //   "등록일" → 구글시트가 날짜형으로 자동 변환해 "2026. 8. 17 오후 3:00" 처럼 보이는 것 방지.
  //             readTab 이 getDisplayValues() 로 읽기 때문에, 변환되면 저장된 문자열 자체가 바뀌어
  //             문자열 비교 정렬이 통째로 깨집니다.
  ["비번", "등록일"].forEach(function (h) {
    var idx = header.indexOf(h);
    if (idx >= 0) sh.getRange(1, idx + 1, sh.getMaxRows(), 1).setNumberFormat("@");
  });
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
    var p = (e && e.parameter) || {};
    if (p.action === "ping") return json({ ok: true, pong: true }); // 예열용: 시트 안 읽고 런타임만 깨움
    if (p.action === "hit") return recordHit(p.page);          // 페이지 조회 1건 기록(+1)
    if (p.action === "viewstats") return json({ ok: true, views: readViews() }); // 조회통계 반환

    // ★ PATCH_03: 서버 캐시 히트면 탭 안 읽고 즉시 반환 (?fresh=1 이면 무시하고 새로 빌드)
    var scache = CacheService.getScriptCache();
    if (p.fresh !== "1") {
      var cached = scache.get(READ_CACHE_KEY);
      if (cached) return jsonRaw(cached);
    }

    const data = {};
    Object.keys(TABS).forEach(function (k) {
      data[k] = readTab(TABS[k], HEADERS[k]);
    });

    // 자소서: 성별별 탭을 읽어 성별을 index 1에 주입해 하나의 members 로 합침
    //   탭행 [닉, 나이, 키, ...] (11) → [닉, 성별, 나이, 키, ...] (12)
    const members = [];
    const PWCOL = PW_IDX + 1;   // 합쳐진 행에서 비번 위치 (성별을 index 1 에 끼워서 +1 밀림)
    Object.keys(MEMBER_TABS).forEach(function (g) {
      readTab(MEMBER_TABS[g], MEMBER_HEADER).forEach(function (row) {
        var mem = [row[0], g].concat(row.slice(1));
        // 비번 원문은 브라우저로 내보내지 않음 → 해시로 변환해 전송 (원문은 시트에만)
        // ★ 이미 64자 hex 면 = 예전 버그로 '해시가 원문 열에 저장된' 값(그 값 자체가 sha256(진짜비번)).
        //   다시 해시하면 이중해시라 영영 안 맞음 → 그대로 통과시켜 자가복구.
        mem[PWCOL] = mem[PWCOL] ? (/^[0-9a-f]{64}$/.test(mem[PWCOL]) ? mem[PWCOL] : sha256hex(mem[PWCOL])) : "";
        members.push(mem);
      });
    });
    data.members = members;

    var out = JSON.stringify({ ok: true, data: data });
    try { scache.put(READ_CACHE_KEY, out, READ_CACHE_SEC); } catch (eC) { /* 100KB 초과 등 → 캐시 스킵 */ }
    return jsonRaw(out);
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/* ============================================================
   PATCH_02 예열(Warm-up) — 콜드스타트 방지.
   Apps Script 편집기 → ⏰트리거 → 트리거 추가 → 함수: keepWarm /
   이벤트: 시간 기반 → 분 단위 타이머 → 5분(또는 10분)마다 → 저장.
   그러면 웹앱이 5분마다 스스로를 가볍게(ping) 호출해 안 잠들게 함.
   ============================================================ */
function keepWarm() {
  try {
    var url = ScriptApp.getService().getUrl();      // 이 웹앱의 /exec 주소
    // read&fresh=1 로 서버 캐시(PATCH_03)를 5분마다 새로 구움 → 유저는 항상 데워진 캐시를 받음.
    if (url) UrlFetchApp.fetch(url + "?action=read&fresh=1", { muteHttpExceptions: true, followRedirects: true });
  } catch (e) { /* 실패해도 무시 (다음 타이머에 재시도) */ }
}

/* ★ 트리거 자동 등록 — 편집기에서 이 함수(setupWarmTrigger)를 한 번만 ▶ 실행하면
   5분마다 keepWarm 이 돌도록 트리거가 자동 생성됩니다. (수동 클릭 불필요) */
function setupWarmTrigger() {
  var triggers = ScriptApp.getProjectTriggers();          // 기존 keepWarm 트리거 제거(중복 방지)
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "keepWarm") ScriptApp.deleteTrigger(triggers[i]);
  }
  ScriptApp.newTrigger("keepWarm").timeBased().everyMinutes(5).create();  // 5분마다
  keepWarm();                                             // 지금 한 번 예열
  return "✅ keepWarm 트리거 등록 완료 (5분마다)";
}

/* 트리거를 없애고 싶을 때 실행 */
function removeWarmTrigger() {
  var triggers = ScriptApp.getProjectTriggers(), n = 0;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "keepWarm") { ScriptApp.deleteTrigger(triggers[i]); n++; }
  }
  return "🗑️ keepWarm 트리거 " + n + "개 삭제";
}

/* ============================================================
   조회통계 — "조회통계" 탭 (날짜 · 페이지 · 횟수).
   페이지 열릴 때 (날짜,페이지) 카운트를 +1. 명령어·자소서와 완전 분리 + Lock 이라 충돌 없음.
   ============================================================ */
function viewSheet() {
  const ss = book();
  let sh = ss.getSheetByName("조회통계");
  if (!sh) { sh = ss.insertSheet("조회통계"); sh.appendRow(["날짜", "페이지", "횟수", "일수"]); sh.setFrozenRows(1); }
  if (sh.getLastRow() === 0) sh.appendRow(["날짜", "페이지", "횟수", "일수"]);
  else if (String(sh.getRange(1, 4).getValue()).trim() !== "일수") sh.getRange(1, 4).setValue("일수"); // 일수 열 마이그레이션(기존 3열→4열)
  sh.getRange("A:A").setNumberFormat("@"); // ★ 날짜 열 텍스트 고정 → "2026-08-05"가 Date로 자동변환되는 것 방지
  return sh;
}
function kstToday() {
  return Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd");
}
// 셀 값이 Date(자동변환됨)여도 "yyyy-MM-dd" 문자열로 정규화 (요약된 "yyyy-MM"·일반문자열은 그대로)
function vdate(v) {
  if (v instanceof Date) return Utilities.formatDate(v, "Asia/Seoul", "yyyy-MM-dd");
  var s = String(v == null ? "" : v).trim();
  if (/^[A-Za-z]{3}\s+[A-Za-z]{3}\s+\d{1,2}\s+\d{4}/.test(s)) {   // "Wed Aug 05 2026 ..." 형태면 파싱
    try { return Utilities.formatDate(new Date(s), "Asia/Seoul", "yyyy-MM-dd"); } catch (e) {}
  }
  return s;
}
function recordHit(page) {
  page = String(page == null ? "" : page).trim();
  if (!page) return json({ ok: false, error: "no page" });
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);                       // 동시 조회여도 카운트 안 섞이게
    const sh = viewSheet();
    const today = kstToday();
    const rows = sh.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (vdate(rows[i][0]) === today && String(rows[i][1]).trim() === page) {
        sh.getRange(i + 1, 3).setValue((Number(rows[i][2]) || 0) + 1);
        return json({ ok: true });
      }
    }
    sh.appendRow([today, page, 1, 1]);          // 그 날 첫 조회 → 새 줄 (일수=1)
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: String(e) });
  } finally {
    try { lock.releaseLock(); } catch (ig) {}
  }
}
function readViews() {
  const sh = viewSheet();
  const rows = sh.getDataRange().getValues();
  const out = [];
  for (var i = 1; i < rows.length; i++) {
    const d = vdate(rows[i][0]), pg = String(rows[i][1]).trim();
    if (!d || !pg) continue;
    out.push({ date: d, page: pg, count: Number(rows[i][2]) || 0, days: Number(rows[i][3]) || 1 });
  }
  return out;
}

/* ⭐ 월별 요약 — 지난 달들의 "일별 행"을 (달,페이지)당 1줄로 접음. 이번 달은 일별 유지.
   일수 열에 며칠치인지 저장 → 사이트의 "하루 평균"이 정확히 유지됨. 여러 번 실행해도 안전(멱등).
   편집기에서 이 함수를 ▶ 실행하거나, setupSummaryTrigger()로 매월 자동. */
function summarizeViews() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const sh = viewSheet();
    const rows = sh.getDataRange().getValues();
    const curMonth = kstToday().slice(0, 7);   // "yyyy-MM"
    const monthly = {};                         // "yyyy-MM|page" → count 합
    const monthDates = {};                      // "yyyy-MM" → {날짜:1} (그 달 전체 활동일, 페이지 무관)
    const keep = [];                            // 그대로 둘 행(이번 달 일별 + 이미 월요약된 행)
    for (var i = 1; i < rows.length; i++) {
      var d = vdate(rows[i][0]), pg = String(rows[i][1]).trim();
      if (!d || !pg) continue;
      var c = Number(rows[i][2]) || 0, dy = Number(rows[i][3]) || 1;
      var isDaily = (d.length === 10);          // yyyy-MM-DD = 일별
      if (isDaily && d.slice(0, 7) < curMonth) {// 지난 달의 일별 → 접기
        var mon = d.slice(0, 7), k = mon + "|" + pg;
        monthly[k] = (monthly[k] || 0) + c;
        if (!monthDates[mon]) monthDates[mon] = {};
        monthDates[mon][d] = 1;                  // 그 달 활동일 집계(페이지 상관없이 union)
      } else {
        keep.push([d, pg, c, dy]);              // 이번 달 일별 · 이미 월요약(yyyy-MM) 행은 유지
      }
    }
    var summ = [];
    for (var key in monthly) {
      var pr = key.split("|"), mon2 = pr[0];
      summ.push([mon2, pr[1], monthly[key], Object.keys(monthDates[mon2]).length]); // 일수=그 달 전체 활동일(모든 페이지 동일)
    }
    if (!summ.length) return "접을 지난 달 일별 기록이 없어요 (이미 요약됨).";
    var out = [["날짜", "페이지", "횟수", "일수"]].concat(summ).concat(keep);
    sh.clearContents();
    sh.getRange("A:A").setNumberFormat("@");
    sh.getRange(1, 1, out.length, 4).setValues(out);
    return "✅ 요약 완료: 월별 " + summ.length + "행 + 최근(이번 달) " + keep.length + "행";
  } finally { try { lock.releaseLock(); } catch (e) {} }
}

/* ⭐ 복구 — 날짜가 Date로 자동변환돼 (같은 날·페이지)가 중복 폭증한 걸 병합 + 날짜 텍스트 정규화.
   한 번만 ▶ repairViews 실행. 권장 순서: 재배포 → repairViews → (원하면) summarizeViews. */
function repairViews() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const sh = viewSheet();
    const rows = sh.getDataRange().getValues();
    const agg = {}, order = [];
    for (var i = 1; i < rows.length; i++) {
      var d = vdate(rows[i][0]), pg = String(rows[i][1]).trim();
      if (!d || !pg) continue;
      var c = Number(rows[i][2]) || 0, dy = Number(rows[i][3]) || 1;
      var k = d + "|" + pg;
      if (!agg[k]) { agg[k] = { count: 0, days: dy }; order.push(k); }
      agg[k].count += c;
      if (dy > agg[k].days) agg[k].days = dy;
    }
    var out = [["날짜", "페이지", "횟수", "일수"]];
    for (var j = 0; j < order.length; j++) { var p = order[j].split("|"); out.push([p[0], p[1], agg[order[j]].count, agg[order[j]].days]); }
    sh.clearContents();
    sh.getRange("A:A").setNumberFormat("@");
    sh.getRange(1, 1, out.length, 4).setValues(out);
    return "✅ 복구 완료: " + (rows.length - 1) + "행 → " + (out.length - 1) + "행 (중복 병합·날짜 정규화)";
  } finally { try { lock.releaseLock(); } catch (e) {} }
}

/* ⭐ 가시성 — "조회통계"를 날짜별로 확실히 구분: 날짜 정렬 + 하루마다 배경색 번갈이 + 날짜 바뀔 때 구분선.
   (저번에 만든 헷갈리던 "조회요약" 탭·색농도는 자동 제거). ▶ styleViewsByDay 실행(새 기록 쌓이면 다시 실행해 갱신). */
function styleViewsByDay() {
  const ss = book();
  const s2 = ss.getSheetByName("조회요약"); if (s2) ss.deleteSheet(s2);   // 이전 요약 탭 정리
  const sh = viewSheet();
  sh.setConditionalFormatRules([]);                                       // 이전 색농도 규칙 제거
  const last = sh.getLastRow();
  if (last < 2) return "데이터가 없어요.";
  const nCol = 4, n = last - 1;
  // 날짜 오름차순 → 같은 페이지 순으로 정렬 (같은 날끼리 뭉침)
  sh.getRange(2, 1, n, sh.getLastColumn()).sort([{ column: 1, ascending: true }, { column: 2, ascending: true }]);
  // 정렬된 값 다시 읽어 날짜 그룹 계산
  const vals = sh.getRange(2, 1, n, nCol).getValues();
  const bg = [];
  const groupStarts = [];
  var curDate = null, tone = false;
  for (var i = 0; i < n; i++) {
    var d = vdate(vals[i][0]);
    if (d !== curDate) { tone = !tone; curDate = d; groupStarts.push(i); }  // 날짜 바뀜 → 색 토글 + 그룹 시작
    var color = tone ? "#eaf1fb" : "#ffffff";
    bg.push([color, color, color, color]);
  }
  const body = sh.getRange(2, 1, n, nCol);
  body.setBackgrounds(bg);
  body.setBorder(false, false, false, false, false, false);               // 안쪽 테두리 초기화
  for (var g = 0; g < groupStarts.length; g++) {                           // 날짜 그룹 첫 행 위에 굵은 구분선
    sh.getRange(2 + groupStarts[g], 1, 1, nCol)
      .setBorder(true, null, null, null, null, null, "#8fa3c0", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  }
  sh.getRange(1, 1, 1, nCol).setFontWeight("bold").setBackground("#dfe7f5"); // 헤더 강조
  return "✅ 일별 구분 적용: " + groupStarts.length + "일 · " + n + "행";
}

/* 매월 1일 새벽 자동 요약 트리거 등록 (편집기에서 한 번만 ▶ 실행) */
function setupSummaryTrigger() {
  var trs = ScriptApp.getProjectTriggers();
  for (var i = 0; i < trs.length; i++) if (trs[i].getHandlerFunction() === "summarizeViews") ScriptApp.deleteTrigger(trs[i]);
  ScriptApp.newTrigger("summarizeViews").timeBased().onMonthDay(1).atHour(4).create();
  return "✅ 매월 1일 04시 자동 요약 트리거 등록 완료";
}

/* ============================================================
   작대기(매칭) — 조회/등록/변경/취소. 전부 doPost 로 들어옴(doGet 캐시 안 탐).
   ============================================================ */

/* 자소서 명단에서 닉을 찾아 비번 해시를 검증 (doGet members 와 같은 해시 규칙).
   반환: "ok" | "no_member"(자소서 없음) | "no_pw"(비번 미설정) | "wrong_pw" */
function stickVerifyPw(nick, pwHash) {
  var found = null;
  Object.keys(MEMBER_TABS).forEach(function (g) {
    readTab(MEMBER_TABS[g], MEMBER_HEADER).forEach(function (row) {
      if (String(row[0]).trim() === nick) found = row;
    });
  });
  if (!found) return "no_member";
  var v = String(found[PW_IDX] || "");
  if (!v) return "no_pw";
  var expected = /^[0-9a-f]{64}$/.test(v) ? v : sha256hex(v);  // 오염(이중해시) 계정도 통과
  return (String(pwHash) === expected) ? "ok" : "wrong_pw";
}

/* 자소서 명단에 이 닉이 존재하나 (받는사람 검증용) */
function stickMemberExists(nick) {
  var yes = false;
  Object.keys(MEMBER_TABS).forEach(function (g) {
    readTab(MEMBER_TABS[g], MEMBER_HEADER).forEach(function (row) {
      if (String(row[0]).trim() === nick) yes = true;
    });
  });
  return yes;
}

/* 닉 → 성별 맵 { 닉: "남"|"여" } — 자소서가 남/여 탭으로 나뉘어 있으니 "어느 탭에 있나"로 판별. */
function stickGenders() {
  var map = {};
  Object.keys(MEMBER_TABS).forEach(function (g) {
    var short = (g === "남자") ? "남" : "여";
    readTab(MEMBER_TABS[g], MEMBER_HEADER).forEach(function (row) {
      var n = String(row[0]).trim();
      if (n) map[n] = short;
    });
  });
  return map;
}

/* ---- 작대기 탭: 행(가로) 구조 ----
   1행 = 라벨("닉네임" | "상대/변경일자"). 2행부터 사람 1명 = 행 1개.
   각 사람 행: A열 = 닉네임, B열부터 오른쪽으로 "상대/날짜" 또는 "작대기 취소/날짜"(이력).
   그 사람의 "유효 작대기" = 그 행의 마지막(가장 오른쪽) 항목. */
var STICK_DATA_COL = 2;   // 이력이 시작되는 열(B열=2 부터). A열은 닉네임.

function stickSheet() {
  var ss = book();
  var sh = ss.getSheetByName(STICK_TAB);
  if (!sh) {
    sh = ss.insertSheet(STICK_TAB);
    sh.getRange(1, 1).setValue("닉네임").setFontWeight("bold");
    sh.getRange(1, 2).setValue("상대/변경일자").setFontWeight("bold");
    sh.setFrozenRows(1);
    sh.setFrozenColumns(1);
  }
  return sh;
}

/* 오늘 날짜(KST, yyyy-MM-dd) — 셀에 붙이는 날짜 */
function stickDate() { return Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd"); }

/* 셀 문자열 "상대/날짜" → { to, date }.  "작대기 취소/날짜" 도 동일 파싱(to="작대기 취소"). */
function stickParseCell(s) {
  s = String(s == null ? "" : s).trim();
  var i = s.lastIndexOf("/");
  if (i < 0) return { to: s, date: "" };
  return { to: s.slice(0, i).trim(), date: s.slice(i + 1).trim() };
}

/* nick 의 행 번호(2행부터). 없으면 0. */
function stickRowOf(sh, nick) {
  var last = sh.getLastRow();
  if (last < 2) return 0;
  var col = sh.getRange(2, 1, last - 1, 1).getValues();  // A2부터
  for (var i = 0; i < col.length; i++) if (String(col[i][0]).trim() === nick) return i + 2;
  return 0;
}

/* 한 사람 행의 항목들(왼→오른=시간순) [{to,date}, ...] */
function stickReadRow(sh, row) {
  var lastCol = sh.getLastColumn();
  if (lastCol < STICK_DATA_COL) return [];
  var vals = sh.getRange(row, STICK_DATA_COL, 1, lastCol - STICK_DATA_COL + 1).getDisplayValues()[0];
  var out = [];
  for (var i = 0; i < vals.length; i++) {
    var c = String(vals[i]).trim();
    if (c) out.push(stickParseCell(c));
  }
  return out;
}

/* nick 행의 맨 오른쪽에 셀 추가(없으면 새 행 생성). 텍스트 형식 고정(날짜 자동변환 방지). */
function stickAppend(sh, nick, cellVal) {
  var row = stickRowOf(sh, nick);
  if (!row) {
    row = Math.max(2, sh.getLastRow() + 1);
    sh.getRange(row, 1).setValue(nick).setFontWeight("bold");
  }
  // 그 행에서 마지막으로 채워진 열 찾기(다른 행이 더 길 수 있으므로 이 행만 확인)
  var lastCol = sh.getLastColumn(), col = STICK_DATA_COL;
  if (lastCol >= STICK_DATA_COL) {
    var vals = sh.getRange(row, STICK_DATA_COL, 1, lastCol - STICK_DATA_COL + 1).getValues()[0];
    for (var i = 0; i < vals.length; i++) if (String(vals[i]).trim() !== "") col = STICK_DATA_COL + i + 1;
  }
  sh.getRange(row, col).setNumberFormat("@").setValue(cellVal);
}

/* 모든 사람 행 → { order:[닉...], by:{닉:[{to,date}...]} } */
function stickAll(sh) {
  var res = { order: [], by: {} };
  var last = sh.getLastRow();
  if (last < 2) return res;
  var nicks = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var r = 0; r < nicks.length; r++) {
    var nick = String(nicks[r][0]).trim();
    if (!nick) continue;
    res.order.push(nick);
    res.by[nick] = stickReadRow(sh, r + 2);
  }
  return res;
}

/* 작대기 요청 전체 처리 — doPost 의 lock 안에서 호출(동시성 보호). */
function handleStick(body) {
  var act = String(body.stickAction || "");
  var sh = stickSheet();

  // --- 관리자 전체 목록 → 프론트 호환 위해 [보낸사람,받는사람,날짜] 행배열로 변환(시간순) ---
  if (act === "list") {
    if (body.key !== ADMIN_KEY) return json({ ok: false, error: "권한이 없어요." });
    var all = stickAll(sh), out = [];
    all.order.forEach(function (f) {
      all.by[f].forEach(function (x) { out.push([f, x.to, x.date]); });
    });
    return json({ ok: true, sticks: out, genders: stickGenders() });
  }

  // --- 이하 전부 본인 인증 필요 ---
  var from = String(body.from || "").trim();
  var pwHash = String(body.pwHash || "").trim();
  if (!from) return json({ ok: false, error: "닉네임을 입력해주세요." });
  var vr = stickVerifyPw(from, pwHash);
  if (vr !== "ok") {
    var m = vr === "no_member" ? "자소서를 먼저 등록해야 작대기를 할 수 있어요." :
            vr === "no_pw"     ? "자소서에 비밀번호가 설정돼 있지 않아요. 자소서에서 비번을 먼저 설정해주세요." :
                                 "비밀번호가 틀렸어요.";
    return json({ ok: false, error: m, reason: vr });
  }

  var row = stickRowOf(sh, from);
  var items = row ? stickReadRow(sh, row) : [];
  var hasAny = items.length > 0;
  var last = hasAny ? items[items.length - 1] : null;
  var active = (last && last.to !== STICK_CANCEL) ? last.to : null; // 현재 유효 상대(없으면 null)

  // --- 본인 상태 조회 (버튼 분기 + 이력 표시용) ---
  if (act === "status") {
    var hist = items.map(function (x) { return [from, x.to, x.date]; });
    return json({ ok: true, active: active, hasAny: hasAny, history: hist, genders: stickGenders() });
  }

  // --- 취소 ---
  if (act === "cancel") {
    if (!active) return json({ ok: false, error: "취소할 작대기가 없어요." });
    stickAppend(sh, from, STICK_CANCEL + "/" + stickDate());
    return json({ ok: true, action: "cancel" });
  }

  // --- 등록 / 변경 (to 필요) ---
  if (act === "register" || act === "change") {
    var to = String(body.to || "").trim();
    if (!to) return json({ ok: false, error: "상대 닉네임을 입력해주세요." });
    if (to === from) return json({ ok: false, error: "자기 자신은 작대기 할 수 없어요." });
    if (!stickMemberExists(to)) return json({ ok: false, error: "'" + to + "' 님을 자소서 명단에서 찾을 수 없어요. 두 글자 닉을 확인해주세요." });
    if (act === "register" && hasAny)  return json({ ok: false, error: "이미 작대기 이력이 있어요. '작대기 변경'을 이용해주세요." });
    if (act === "change"   && !hasAny) return json({ ok: false, error: "등록된 작대기가 없어요. '작대기 등록'을 먼저 해주세요." });
    if (active === to) return json({ ok: false, error: "이미 '" + to + "' 님에게 작대기 중이에요." });
    stickAppend(sh, from, to + "/" + stickDate());
    return json({ ok: true, action: (hasAny ? "change" : "register") });
  }

  return json({ ok: false, error: "알 수 없는 요청이에요." });
}

/* ============================================================
   [일회성] 작대기 데이터 전치 — 열 단위(사람=열) → 행 단위(사람=행).
   Apps Script 편집기에서 이 함수를 한 번 ▶ 실행하세요. (재배포 후 1회)
   ============================================================ */
function transposeSticks() {
  var ss = book();
  var sh = ss.getSheetByName(STICK_TAB);
  if (!sh) return "작대기 탭이 없어요. 전치할 데이터가 없습니다.";
  if (String(sh.getRange(1, 2).getValue()).trim() === "상대/변경일자") return "이미 행 단위(전치됨) 구조예요. (전치 불필요)";

  // 현재 열 단위 읽기: 1행 B열+ = 닉, 각 열 2행+ = 이력 셀
  var lastCol = sh.getLastColumn(), lastRow = sh.getLastRow();
  var people = []; // { nick, items:["상대/날짜", ...] }
  if (lastCol >= 2 && lastRow >= 1) {
    var grid = sh.getRange(1, 1, lastRow, lastCol).getDisplayValues();
    for (var c = 1; c < lastCol; c++) {           // B열(idx 1)부터 = 사람
      var nick = String(grid[0][c]).trim();
      if (!nick) continue;
      var items = [];
      for (var r = 1; r < lastRow; r++) {          // 2행(idx 1)부터 = 이력
        var cell = String(grid[r][c]).trim();
        if (cell) items.push(cell);
      }
      people.push({ nick: nick, items: items });
    }
  }
  // 행 단위로 재작성: A열=닉, B열+=이력 가로
  sh.clear();
  sh.getRange(1, 1).setValue("닉네임").setFontWeight("bold");
  sh.getRange(1, 2).setValue("상대/변경일자").setFontWeight("bold");
  sh.setFrozenRows(1);
  sh.setFrozenColumns(1);
  var cnt = 0;
  for (var i = 0; i < people.length; i++) {
    var rowN = 2 + i, p = people[i];
    sh.getRange(rowN, 1).setValue(p.nick).setFontWeight("bold");
    if (p.items.length) {
      sh.getRange(rowN, 2, 1, p.items.length).setNumberFormat("@");
      sh.getRange(rowN, 2, 1, p.items.length).setValues([p.items]);
      cnt += p.items.length;
    }
  }
  return "완료: " + people.length + "명, " + cnt + "개 항목을 행 단위로 전치했어요.";
}

/* ============================================================
   쓰기 — 관리자가 사이트에서 저장할 때
   ============================================================ */

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);   // 두 사람이 동시에 저장해도 섞이지 않도록

    const body = JSON.parse(e.postData.contents);

    // ★ 작대기(매칭): 별도 흐름으로 처리하고 즉시 반환 (자소서/명령어 저장과 무관)
    if (body.stickAction) return handleStick(body);

    const isAdmin = (body.key === ADMIN_KEY);
    const incoming = body.data || {};

    // 명령어·패치노트: 관리자만 (전체 다시쓰기)
    if (isAdmin) {
      Object.keys(TABS).forEach(function (k) {
        if (!incoming[k]) return;
        const head = HEADERS[k];
        const rows = incoming[k].map(function (r) {
          const row = [];
          for (var i = 0; i < head.length; i++) row.push(r[i] == null ? "" : r[i]);
          return row;
        });
        writeTab(TABS[k], head, rows);
      });
    }

    // 자소서: 들어온 행 [닉, 성별, 나이, ...] (12) → 성별별 탭행 [닉, 나이, ...] (11)
    if (incoming.members) {
      const incByG = { "남자": [], "여자": [] };
      // 기존 행 (성별→닉→행) — 비번 원문 보존 + 등록일 보존 + "이미 있던 사람인지" 판별용
      const existRow = { "남자": {}, "여자": {} };
      Object.keys(MEMBER_TABS).forEach(function (g) {
        readTab(MEMBER_TABS[g], MEMBER_HEADER).forEach(function (row) {
          existRow[g][row[0]] = row;
        });
      });
      incoming.members.forEach(function (r) {
        const g = (String(r[1] || "").indexOf("여") >= 0) ? "여자" : "남자";
        const row = [r[0] == null ? "" : r[0]];
        for (var i = 2; i < MEMBER_HEADER.length + 1; i++) row.push(r[i] == null ? "" : r[i]);
        var prev = existRow[g][row[0]];
        // 비번: 빈값이거나 기존 원문의 해시면 → 원문 유지, 새 원문이 오면 → 교체
        row[PW_IDX] = resolvePw(row[PW_IDX], prev ? (prev[PW_IDX] || "") : "");
        // 등록일: 이미 있던 닉이면 시트 값 그대로(빈칸이면 빈칸 유지), 처음 보는 닉이면 지금 도장.
        //   브라우저가 보낸 값은 신뢰하지 않습니다(시계 조작·기기 편차).
        row[AT_IDX] = prev ? String(prev[AT_IDX] || "") : stampNow();
        incByG[g].push(row);
      });

      Object.keys(MEMBER_TABS).forEach(function (g) {
        if (isAdmin) {
          // 관리자: 전체 다시쓰기 (삭제 가능)
          writeTab(MEMBER_TABS[g], MEMBER_HEADER, sortMembersAsc(incByG[g]));
        } else {
          // 비관리자: 병합 — 기존 유지 + 닉 같으면 수정 + 새 닉이면 등록. 삭제 불가.
          var byNick = {}, order = [];
          readTab(MEMBER_TABS[g], MEMBER_HEADER).forEach(function (row) {
            var n = row[0]; if (!(n in byNick)) order.push(n); byNick[n] = row;
          });
          incByG[g].forEach(function (row) {
            var n = row[0]; if (!n) return; if (!(n in byNick)) order.push(n); byNick[n] = row;
          });
          writeTab(MEMBER_TABS[g], MEMBER_HEADER, sortMembersAsc(order.map(function (n) { return byNick[n]; })));
        }
      });
    }

    try { CacheService.getScriptCache().remove(READ_CACHE_KEY); } catch (eC) {} // ★ PATCH_03: 편집됐으니 서버 캐시 무효화
    return json({ ok: true, admin: isAdmin });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}
