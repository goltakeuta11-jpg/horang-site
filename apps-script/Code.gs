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

/* 탭을 새로 만들 때 넣을 제목 줄 */
const HEADERS = {
  commands: ["명령어", "설명", "분류", "관리자전용"],
  patchnotes: ["날짜", "분류", "버전", "내용"],
  outings: ["내용"]
};

/* 자소서 탭 헤더 — 성별 열은 없습니다(탭 이름이 성별) */
const MEMBER_HEADER = ["닉네임", "나이", "사는 곳", "키", "전공 or 직업", "쉬는 요일", "취미", "MBTI",
                       "본인의 매력", "이상형", "흡연유무 & 주량", "하고싶은 말", "연애유형", "비번"];

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
var READ_CACHE_SEC = 360;   // 6분 (keepWarm 5분 간격보다 길게 → 항상 데워진 캐시 유지)
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
  // "비번" 열은 텍스트 형식 고정 → 0407 이 407 로 바뀌는 것 방지 (값 넣기 전에 적용해야 함)
  var pwIdx = header.indexOf("비번");
  if (pwIdx >= 0) sh.getRange(1, pwIdx + 1, sh.getMaxRows(), 1).setNumberFormat("@");
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
    const PWCOL = MEMBER_HEADER.length;   // 합쳐진 행에서 비번 위치 (성별 주입으로 +1 밀림)
    Object.keys(MEMBER_TABS).forEach(function (g) {
      readTab(MEMBER_TABS[g], MEMBER_HEADER).forEach(function (row) {
        var mem = [row[0], g].concat(row.slice(1));
        // 비번 원문은 브라우저로 내보내지 않음 → 해시로 변환해 전송 (원문은 시트에만)
        mem[PWCOL] = mem[PWCOL] ? sha256hex(mem[PWCOL]) : "";
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
  return sh;
}
function kstToday() {
  return Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd");
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
      if (String(rows[i][0]).trim() === today && String(rows[i][1]).trim() === page) {
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
    const d = String(rows[i][0]).trim(), pg = String(rows[i][1]).trim();
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
      var d = String(rows[i][0]).trim(), pg = String(rows[i][1]).trim();
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
    sh.getRange(1, 1, out.length, 4).setValues(out);
    return "✅ 요약 완료: 월별 " + summ.length + "행 + 최근(이번 달) " + keep.length + "행";
  } finally { try { lock.releaseLock(); } catch (e) {} }
}

/* 매월 1일 새벽 자동 요약 트리거 등록 (편집기에서 한 번만 ▶ 실행) */
function setupSummaryTrigger() {
  var trs = ScriptApp.getProjectTriggers();
  for (var i = 0; i < trs.length; i++) if (trs[i].getHandlerFunction() === "summarizeViews") ScriptApp.deleteTrigger(trs[i]);
  ScriptApp.newTrigger("summarizeViews").timeBased().onMonthDay(1).atHour(4).create();
  return "✅ 매월 1일 04시 자동 요약 트리거 등록 완료";
}

/* ============================================================
   쓰기 — 관리자가 사이트에서 저장할 때
   ============================================================ */

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);   // 두 사람이 동시에 저장해도 섞이지 않도록

    const body = JSON.parse(e.postData.contents);
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
      // 기존 비번 원문 (성별→닉→원문) — 보존 판별용
      const existPw = { "남자": {}, "여자": {} };
      Object.keys(MEMBER_TABS).forEach(function (g) {
        readTab(MEMBER_TABS[g], MEMBER_HEADER).forEach(function (row) {
          existPw[g][row[0]] = row[MEMBER_HEADER.length - 1] || "";   // 마지막 열 = 비번 원문
        });
      });
      incoming.members.forEach(function (r) {
        const g = (String(r[1] || "").indexOf("여") >= 0) ? "여자" : "남자";
        const row = [r[0] == null ? "" : r[0]];
        for (var i = 2; i < MEMBER_HEADER.length + 1; i++) row.push(r[i] == null ? "" : r[i]);
        // 비번(마지막 열): 빈값이거나 기존 원문의 해시면 → 원문 유지, 새 원문이 오면 → 교체
        var pwi = row.length - 1;
        row[pwi] = resolvePw(row[pwi], existPw[g][row[0]]);
        incByG[g].push(row);
      });

      Object.keys(MEMBER_TABS).forEach(function (g) {
        if (isAdmin) {
          // 관리자: 전체 다시쓰기 (삭제 가능)
          writeTab(MEMBER_TABS[g], MEMBER_HEADER, incByG[g]);
        } else {
          // 비관리자: 병합 — 기존 유지 + 닉 같으면 수정 + 새 닉이면 등록. 삭제 불가.
          var byNick = {}, order = [];
          readTab(MEMBER_TABS[g], MEMBER_HEADER).forEach(function (row) {
            var n = row[0]; if (!(n in byNick)) order.push(n); byNick[n] = row;
          });
          incByG[g].forEach(function (row) {
            var n = row[0]; if (!n) return; if (!(n in byNick)) order.push(n); byNick[n] = row;
          });
          writeTab(MEMBER_TABS[g], MEMBER_HEADER, order.map(function (n) { return byNick[n]; }));
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
