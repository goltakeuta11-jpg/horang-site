/* ============================================================
   inapp.js — 카카오톡 등 인앱 브라우저 대응
   앱 안에 갇힌 브라우저는 fetch·저장이 불안정해서 목록이 백지로 뜸.
   → 기본 브라우저(크롬/사파리)로 나가도록 안내 배너를 띄웁니다.
   다른 스크립트보다 먼저 실행되도록 <head> 에서 부릅니다.
   ============================================================ */

(function () {
  var ua = navigator.userAgent || "";

  var isKakao = /KAKAOTALK/i.test(ua);
  var isInApp = /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line|DaumApps|Snapchat|wv\)/i.test(ua);
  if (!isInApp) return;   // 일반 브라우저면 아무 것도 안 함

  var url = location.href;

  /* 카카오톡은 전용 스킴으로 바로 바깥 브라우저를 열 수 있습니다. */
  function openOutside() {
    if (!isKakao) return;
    location.href = "kakaotalk://web/openExternal?url=" + encodeURIComponent(url);
    setTimeout(function () {   // 안드로이드 크롬으로 강제 전환 보조
      if (/android/i.test(ua)) {
        location.href = "intent://" + url.replace(/^https?:\/\//, "") +
          "#Intent;scheme=https;package=com.android.chrome;end";
      }
    }, 400);
  }

  /* 주소 복사 (아이폰 등 자동 전환이 막힐 때 대비) */
  function copyUrl(done) {
    if (navigator.clipboard) { navigator.clipboard.writeText(url).then(done, fallback); }
    else fallback();
    function fallback() {
      var t = document.createElement("textarea");
      t.value = url; document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); done(); } catch (e) {}
      document.body.removeChild(t);
    }
  }

  var bar = document.createElement("div");
  bar.setAttribute("data-inapp-banner", "");   // app.js 업데이트배너가 중복으로 안 뜨게 표식
  bar.setAttribute("style",
    "position:fixed;left:0;right:0;top:0;z-index:99998;background:#FF5C7A;color:#17070C;" +
    "font:600 14px/1.5 -apple-system,'Malgun Gothic',sans-serif;padding:12px 16px;" +
    "box-shadow:0 4px 16px rgba(0,0,0,.3)");
  bar.innerHTML =
    '<div data-msg style="margin-bottom:8px">카카오톡 안에서는 화면이 잘 안 보일 수 있어요. 기본 브라우저로 열어주세요.</div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      (isKakao ? '<button data-open style="font:inherit;font-weight:700;padding:7px 14px;border:none;border-radius:8px;background:#17070C;color:#fff;cursor:pointer">브라우저로 열기</button>' : '') +
      '<button data-copy style="font:inherit;font-weight:700;padding:7px 14px;border:1px solid #17070C;border-radius:8px;background:transparent;color:#17070C;cursor:pointer">주소 복사</button>' +
      '<button data-close style="font:inherit;padding:7px 12px;border:none;border-radius:8px;background:transparent;color:#17070C;cursor:pointer;margin-left:auto">그냥 볼게요</button>' +
    '</div>';

  function mount() {
    document.body.appendChild(bar);
    document.body.style.paddingTop = bar.offsetHeight + "px";
    var ob = bar.querySelector("[data-open]");
    if (ob) ob.onclick = openOutside;
    bar.querySelector("[data-copy]").onclick = function () {
      copyUrl(function () { bar.querySelector("[data-msg]").textContent = "주소를 복사했어요. 사파리·크롬에 붙여넣어 열어주세요."; });
    };
    bar.querySelector("[data-close]").onclick = function () {
      bar.remove(); document.body.style.paddingTop = "";
    };
  }

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
