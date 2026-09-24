/* ============================================================
   app.js — 관리자 판별 + 공통 헤더 + 유틸
   ============================================================ */

(function () {
  const SESSION = "horang.admin";

  /* ============================================================
     자동 업데이트 감지 — 캐시된 옛 버전이면 "새로고침" 배너를 띄웁니다.
       · 이 스크립트가 로드된 ?v= 값(=이 페이지 버전)을
         항상 최신인 version.txt(캐시 무시 fetch)와 비교.
       · 다르면 = 새 버전 배포됨 → 배너. (사용자가 눌러 강제 새로고침)
     ============================================================ */
  (function autoUpdate() {
    // 새로고침 후 URL에 남은 캐시버스터(_r) 정리
    try {
      var u0 = new URL(location.href);
      if (u0.searchParams.has("_r")) { u0.searchParams.delete("_r"); history.replaceState(null, "", u0.toString()); }
    } catch (e) {}

    // 이 app.js 를 불러온 ?v= (= 이 페이지가 로드한 버전)
    var src = (document.currentScript && document.currentScript.src) || "";
    var mv = src.match(/[?&]v=([^&]+)/);
    var pageV = mv ? decodeURIComponent(mv[1]) : "";
    if (!pageV) return;   // 버전 쿼리 없으면 감지 안 함

    fetch("version.txt?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (txt) {
        if (!txt) return;
        var latest = txt.trim();
        if (latest && latest !== pageV) showUpdateBanner();
      })
      .catch(function () {});

    function showUpdateBanner() {
      if (document.querySelector("[data-update-banner]")) return;
      if (document.querySelector("[data-inapp-banner]")) return;  // 카톡 탈출 배너가 떠 있으면 양보(중복 방지)
      var run = function () {
        var b = document.createElement("div");
        b.setAttribute("data-update-banner", "");
        b.style.cssText = "position:fixed;left:0;right:0;top:0;z-index:99999;background:#FF5C7A;color:#17070C;"
          + "font:700 14px/1.5 -apple-system,sans-serif;padding:11px 16px;text-align:center;cursor:pointer;"
          + "box-shadow:0 2px 14px rgba(0,0,0,.35)";
        b.textContent = "🔄 새 버전이 나왔어요! 여기를 눌러 새로고침하세요";
        b.onclick = function () {
          try {
            var u = new URL(location.href);
            u.searchParams.set("_r", Date.now());   // HTML 캐시까지 강제로 새로 받게
            location.href = u.toString();
          } catch (e) { location.reload(); }
        };
        document.body.appendChild(b);
        document.body.style.paddingTop = "44px";   // 배너에 내용 안 가리게
      };
      if (document.body) run(); else document.addEventListener("DOMContentLoaded", run);
    }
  })();

  /* config.js를 못 불러온 경우 — 화면이 백지로 뜨는 대신 원인을 알려줍니다. */
  if (typeof window.CONFIG === "undefined") {
    window.CONFIG = { ROOM_NAME: "설정 없음", BOT_NAME: "봇", ADMIN_KEY: "", SHEET_ID: "", SHEETS: {} };
    document.addEventListener("DOMContentLoaded", function () {
      const b = document.createElement("div");
      b.style.cssText = "position:fixed;inset:0 0 auto 0;z-index:99;background:#FF5C7A;color:#17070C;"
        + "font:600 14px/1.6 sans-serif;padding:12px 18px;text-align:center";
      b.textContent = "assets 폴더를 찾지 못했습니다. HTML 파일과 assets 폴더가 같은 위치에 있어야 합니다.";
      document.body.appendChild(b);
    });
  }

  /* 관리자 인증은 서버 로그인(홈 화면 비밀번호)으로만. URL ?key= 방식은 폐지.
     로그인 성공 시 서버가 준 '임시 토큰'을 horang.key 에 저장하고, 저장 요청에 함께 보냅니다. */
  function isAdmin() {
    try { return sessionStorage.getItem(SESSION) === "1" && !!sessionStorage.getItem("horang.key"); } catch (e) { return false; }
  }
  /* 서버가 발급한 관리자 토큰 (없으면 빈 문자열) — 저장 요청의 key 로 전송 */
  function key() {
    try { return sessionStorage.getItem("horang.key") || ""; } catch (e) { return ""; }
  }

  /* 관리자 상태는 sessionStorage(같은 출처)로 페이지 간 유지되므로 URL에 키를 붙이지 않습니다. */
  function link(page) { return page; }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* 자소서 간이 잠금용 해시. 시트엔 원문 대신 이 해시만 저장됨(훔쳐보기 방지). */
  async function sha256(str) {
    str = String(str == null ? "" : str);
    try {
      if (window.crypto && crypto.subtle && window.TextEncoder) {
        const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
      }
    } catch (e) { /* subtle 실패 → 순수 JS 폴백 */ }
    return sha256js(str);   // ★ crypto.subtle 없거나 실패한 환경(일부 인앱·구형 웹뷰)에서도 서버와 '동일한 진짜 SHA-256'
  }
  /* 순수 JS SHA-256 (UTF-8) — crypto.subtle·서버 Utilities.computeDigest 와 hex 완전 일치.
     이게 있어야 어떤 브라우저에서든 비번 검증이 동일하게 맞음(예전 약한 폴백은 절대 안 맞았음). */
  function sha256js(str) {
    function R(v, a) { return (v >>> a) | (v << (32 - a)); }
    var mp = Math.pow, mw = mp(2, 32), L = "length", i, j, out = "", words = [];
    var ascii = unescape(encodeURIComponent(String(str == null ? "" : str)));   // UTF-8 바이트열로
    var abl = ascii[L] * 8;
    var hash = sha256js.h = sha256js.h || [], k = sha256js.k = sha256js.k || [], pc = k[L], isC = {};
    for (var c = 2; pc < 64; c++) { if (!isC[c]) { for (i = 0; i < 313; i += c) isC[i] = c; hash[pc] = (mp(c, .5) * mw) | 0; k[pc++] = (mp(c, 1 / 3) * mw) | 0; } }
    ascii += "\x80"; while (ascii[L] % 64 - 56) ascii += "\x00";
    for (i = 0; i < ascii[L]; i++) { j = ascii.charCodeAt(i); if (j >> 8) return ""; words[i >> 2] |= j << ((3 - i) % 4) * 8; }
    words[words[L]] = (abl / mw) | 0; words[words[L]] = abl;
    for (j = 0; j < words[L];) {
      var w = words.slice(j, j += 16), oldHash = hash; hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2], a = hash[0], e = hash[4];
        var t1 = hash[7] + (R(e, 6) ^ R(e, 11) ^ R(e, 25)) + ((e & hash[5]) ^ ((~e) & hash[6])) + k[i]
          + (w[i] = (i < 16) ? w[i] : (w[i - 16] + (R(w15, 7) ^ R(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (R(w2, 17) ^ R(w2, 19) ^ (w2 >>> 10))) | 0);
        var t2 = (R(a, 2) ^ R(a, 13) ^ R(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(t1 + t2) | 0].concat(hash); hash[4] = (hash[4] + t1) | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
    }
    for (i = 0; i < 8; i++) for (j = 3; j + 1; j--) { var b = (hash[i] >> (j * 8)) & 255; out += ((b < 16) ? 0 : "") + b.toString(16); }
    return out;
  }

  function toast(msg, bad) {
    let t = document.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.toggle("is-bad", !!bad);
    t.classList.add("is-on");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("is-on"), 2600);
  }

  /* 페이지 조회 1건 기록 — 세션당 1회, 보내고 신경 끔(실패해도 화면 무관). */
  function trackHit(page) {
    const url = (window.CONFIG && CONFIG.SCRIPT_URL || "").trim();
    if (!url || !page) return;
    try {
      if (sessionStorage.getItem("hit." + page)) return;   // 이 방문에서 이미 셌으면 스킵
      sessionStorage.setItem("hit." + page, "1");
    } catch (e) {}
    try { fetch(url + "?action=hit&page=" + encodeURIComponent(page) + "&_=" + Date.now(), { cache: "no-store", mode: "no-cors" }).catch(function () {}); } catch (e) {}
  }

  /* 편집잠금 배너 (오목 상시 오픈이라 게임탭은 항상 노출 — nav 배열에 직접 넣음) */
  function siteFlags() {
    var url = (window.CONFIG && CONFIG.SCRIPT_URL || "").trim();
    if (!url) return;
    fetch(url + "?action=siteflags&_=" + Date.now(), { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.locked || document.querySelector("[data-maint-banner]")) return;
        var run = function () {
          var b = document.createElement("div");
          b.setAttribute("data-maint-banner", "");
          b.style.cssText = "position:fixed;left:0;right:0;top:0;z-index:99998;background:#FFAB40;color:#17070C;"
            + "font:700 14px/1.5 -apple-system,sans-serif;padding:11px 16px;text-align:center;"
            + "box-shadow:0 2px 14px rgba(0,0,0,.35)";
          b.textContent = "🔧 현재 데이터 업데이트 중입니다. 잠시 후에 이용 바랍니다.";
          document.body.appendChild(b);
          document.body.style.paddingTop = "44px";
        };
        if (document.body) run(); else document.addEventListener("DOMContentLoaded", run);
      })
      .catch(function () {});
  }

  function header(active) {
    siteFlags();   // 잠금 배너
    // 항상 보이는 탭 (홈은 좌측 로고가 대신함)
    const primary = [
      ["notices.html", "공지"],
      ["calendar.html", "캘린더"],
      ["donate.html", "후원"],
      ["members.html", "자소서"],
      ["psychtest.html", "심리테스트"],
      ["sticks.html", "작대기"],
      ["game.html", "🎮 게임"]
    ];
    // "더보기 ▾" 안에 접히는 탭 (자주 안 보는 것)
    const more = [
      ["commands.html", "명령어"],
      ["ranking.html", "게임랭킹"],
      ["outings.html", "외출"],
      ["patchnotes.html", "패치노트"]
    ];
    if (isAdmin()) more.push(["admin.html", "관리전용"]);   // 관리자 키일 때만 노출
    const all = primary.concat(more, [["index.html", "홈"]]);
    const hit = all.find(([h]) => h === active);   // 조회통계: 이 페이지 이름으로 1건 기록
    trackHit(hit ? hit[1] : active);
    const el = document.querySelector("[data-header]");
    if (!el) return;
    const moreActive = more.some(([h]) => h === active);   // 더보기 안 페이지에 있으면 버튼 강조
    const itemHtml = ([h, t]) => `<a href="${link(h)}" class="nav__item${h === active ? " is-on" : ""}">${t}</a>`;
    const sub = CONFIG.ROOM_NAME === CONFIG.BOT_NAME ? "허브" : CONFIG.BOT_NAME + " 허브";
    el.innerHTML = `
      <a class="brand" href="${link("index.html")}">
        <span class="brand__dot" aria-hidden="true"></span>
        <span class="brand__name">${esc(CONFIG.ROOM_NAME)}</span>
        <span class="brand__sub">${esc(sub)}</span>
      </a>
      <button class="nav-toggle" data-nav-toggle aria-label="메뉴 열기" aria-expanded="false">☰</button>
      <nav class="nav" data-nav>
        ${primary.map(itemHtml).join("")}
        <div class="nav__more" data-more>
          <button type="button" class="nav__item nav__more-btn${moreActive ? " is-on" : ""}"
            data-more-btn aria-haspopup="true" aria-expanded="false">더보기</button>
          <div class="nav__menu" data-more-menu>${more.map(itemHtml).join("")}</div>
        </div>
      </nav>
      <button class="btn btn--ghost btn--sm" data-theme-toggle title="화면 밝기 전환" aria-label="테마 전환">${
        (document.documentElement.getAttribute("data-theme") === "light") ? "☀️" : "🌙"
      }</button>
      <span class="badge ${isAdmin() ? "badge--admin" : "badge--guest"}">
        ${isAdmin() ? "관리자" : "보기 전용"}
      </span>
      ${isAdmin() ? '<button class="btn btn--ghost btn--sm" data-logout>나가기</button>' : ""}
    `;
    const navToggle = el.querySelector("[data-nav-toggle]");
    const navEl = el.querySelector("[data-nav]");
    if (navToggle && navEl) navToggle.onclick = () => {
      const open = navEl.classList.toggle("nav--open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.textContent = open ? "✕" : "☰";
    };
    // "더보기" 드롭다운 열고닫기 (+ 바깥 클릭 시 닫힘)
    const moreWrap = el.querySelector("[data-more]");
    const moreBtn = el.querySelector("[data-more-btn]");
    if (moreWrap && moreBtn) {
      moreBtn.onclick = (e) => {
        e.stopPropagation();
        const open = moreWrap.classList.toggle("is-open");
        moreBtn.setAttribute("aria-expanded", open ? "true" : "false");
      };
      document.addEventListener("click", (e) => {
        if (!moreWrap.contains(e.target)) {
          moreWrap.classList.remove("is-open");
          moreBtn.setAttribute("aria-expanded", "false");
        }
      });
    }
    const tt = el.querySelector("[data-theme-toggle]");
    if (tt) tt.onclick = () => {
      const now = (document.documentElement.getAttribute("data-theme") === "light") ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", now);
      try { localStorage.setItem("horang.theme", now); } catch (e) {}
      tt.textContent = (now === "light") ? "☀️" : "🌙";
    };
    const out = el.querySelector("[data-logout]");
    if (out) out.onclick = () => {
      try { sessionStorage.removeItem(SESSION); sessionStorage.removeItem("horang.key"); } catch (e) {}
      location.href = "index.html";
    };
  }

  /* 주소를 새로 만들어 이동하지 않고 그 자리에서 로그인합니다.
     파일을 직접 열어본 경우 주소 이동이 실패하는 일이 있어서입니다. */
  /* 서버에 비밀번호로 로그인 → 임시 토큰 발급받아 저장. 비동기(Promise) 반환. */
  async function signIn(password) {
    const url = (window.CONFIG && CONFIG.SCRIPT_URL || "").trim();
    if (!url) return "wrong";
    let j;
    try {
      const r = await fetch(url.replace(/\/api\/gs$/, "") + "/api/login", {
        method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ password: String(password || "") })
      });
      j = await r.json();
    } catch (e) { return "neterr"; }
    if (!j || !j.ok || !j.token) return "wrong";
    try {
      sessionStorage.setItem(SESSION, "1");
      sessionStorage.setItem("horang.key", j.token);
      return "ok";
    } catch (e) { return "nostorage"; }
  }

  /* 버전 오름차순 비교 — 숫자 단위로 비교해서 "1.10 < 1.2" 같은 문자열 오류 방지.
     "1.0" < "1.1" < "1.1.1" < "1.2" < "1.2.1" < "1.10". 버전 없으면 0 취급. */
  function verCmp(a, b) {
    const pa = String(a == null ? "" : a).split(/[^\d]+/).filter(Boolean).map(Number);
    const pb = String(b == null ? "" : b).split(/[^\d]+/).filter(Boolean).map(Number);
    const n = Math.max(pa.length, pb.length);
    for (var i = 0; i < n; i++) {
      var x = pa[i] || 0, y = pb[i] || 0;
      if (x !== y) return x - y;
    }
    return 0;
  }

  window.App = { isAdmin, key, link, esc, toast, header, signIn, verCmp, sha256 };
})();
