/* 오늘의 영단어 — 단어장 + 날짜별 선택/퀴즈 엔진 (전부 브라우저에서 계산, 서버 부담 X)
   window.VOCAB : 단어 배열 [{w:영단어, k:뜻(ko), pos:품사, cat:카테고리, lv:난이도}]
     pos : n(명사) v(동사) adj(형용사) adv(부사)
     cat : 일상 / 비즈니스 / 학술 / 시험
   window.VB : { CATS, POS_KO, dayIndex(), wordsForDay(d), todaySet([d]), makeQuestions(words,stats,n) }
   - 매일 새 단어 30개가 "날짜 시드"로 결정 → 모든 사람이 같은 날 같은 단어(순위표 공정).
   - 오늘 리스트 = 어제 30 + 오늘 30 = 60개 (런칭 첫날만 30개).
   - 오답 보기는 '같은 카테고리·같은 품사' 다른 단어의 뜻에서 뽑아 헷갈리게 = 난이도 ↑.
*/
(function () {
  "use strict";

  var VOCAB = [
    /* ───────── 일상 (daily) ───────── */
    { w: "errand", k: "심부름, 볼일", pos: "n", cat: "일상", lv: 2 },
    { w: "chore", k: "집안일, 허드렛일", pos: "n", cat: "일상", lv: 2 },
    { w: "commute", k: "통근하다", pos: "v", cat: "일상", lv: 2 },
    { w: "grocery", k: "식료품", pos: "n", cat: "일상", lv: 1 },
    { w: "leftover", k: "남은 음식", pos: "n", cat: "일상", lv: 2 },
    { w: "appointment", k: "약속, 예약", pos: "n", cat: "일상", lv: 1 },
    { w: "neighbor", k: "이웃", pos: "n", cat: "일상", lv: 1 },
    { w: "recipe", k: "조리법, 요리법", pos: "n", cat: "일상", lv: 1 },
    { w: "laundry", k: "빨래, 세탁물", pos: "n", cat: "일상", lv: 1 },
    { w: "wardrobe", k: "옷장", pos: "n", cat: "일상", lv: 2 },
    { w: "faucet", k: "수도꼭지", pos: "n", cat: "일상", lv: 2 },
    { w: "blanket", k: "담요", pos: "n", cat: "일상", lv: 1 },
    { w: "ceiling", k: "천장", pos: "n", cat: "일상", lv: 2 },
    { w: "basement", k: "지하실", pos: "n", cat: "일상", lv: 2 },
    { w: "hallway", k: "복도", pos: "n", cat: "일상", lv: 1 },
    { w: "fare", k: "(교통) 요금", pos: "n", cat: "일상", lv: 2 },
    { w: "refund", k: "환불", pos: "n", cat: "일상", lv: 2 },
    { w: "receipt", k: "영수증", pos: "n", cat: "일상", lv: 2 },
    { w: "bargain", k: "싸게 산 물건, 흥정", pos: "n", cat: "일상", lv: 2 },
    { w: "queue", k: "줄, 대기열", pos: "n", cat: "일상", lv: 2 },
    { w: "crosswalk", k: "횡단보도", pos: "n", cat: "일상", lv: 1 },
    { w: "sidewalk", k: "인도, 보도", pos: "n", cat: "일상", lv: 1 },
    { w: "litter", k: "쓰레기를 버리다, 어지르다", pos: "v", cat: "일상", lv: 2 },
    { w: "spill", k: "흘리다, 쏟다", pos: "v", cat: "일상", lv: 1 },
    { w: "wipe", k: "닦다, 훔치다", pos: "v", cat: "일상", lv: 1 },
    { w: "sweep", k: "쓸다, 청소하다", pos: "v", cat: "일상", lv: 1 },
    { w: "rinse", k: "헹구다, 씻어내다", pos: "v", cat: "일상", lv: 2 },
    { w: "chop", k: "썰다, 다지다", pos: "v", cat: "일상", lv: 2 },
    { w: "boil", k: "끓이다, 삶다", pos: "v", cat: "일상", lv: 1 },
    { w: "stir", k: "휘젓다, 섞다", pos: "v", cat: "일상", lv: 2 },
    { w: "soak", k: "담그다, 적시다", pos: "v", cat: "일상", lv: 2 },
    { w: "dizzy", k: "어지러운", pos: "adj", cat: "일상", lv: 2 },
    { w: "thirsty", k: "목마른", pos: "adj", cat: "일상", lv: 1 },
    { w: "stuffy", k: "(코가) 막힌, 답답한", pos: "adj", cat: "일상", lv: 2 },
    { w: "itchy", k: "가려운", pos: "adj", cat: "일상", lv: 2 },
    { w: "numb", k: "감각이 없는, 저린", pos: "adj", cat: "일상", lv: 2 },
    { w: "chilly", k: "쌀쌀한", pos: "adj", cat: "일상", lv: 2 },
    { w: "damp", k: "축축한", pos: "adj", cat: "일상", lv: 2 },
    { w: "crowded", k: "붐비는", pos: "adj", cat: "일상", lv: 1 },
    { w: "spacious", k: "널찍한", pos: "adj", cat: "일상", lv: 2 },
    { w: "cozy", k: "아늑한", pos: "adj", cat: "일상", lv: 2 },
    { w: "messy", k: "지저분한, 엉망인", pos: "adj", cat: "일상", lv: 1 },
    { w: "fancy", k: "화려한, 고급의", pos: "adj", cat: "일상", lv: 2 },
    { w: "plain", k: "수수한, 평범한", pos: "adj", cat: "일상", lv: 2 },
    { w: "handy", k: "편리한, 유용한", pos: "adj", cat: "일상", lv: 2 },
    { w: "stroll", k: "거닐다, 산책하다", pos: "v", cat: "일상", lv: 2 },
    { w: "wander", k: "거닐다, 헤매다", pos: "v", cat: "일상", lv: 2 },
    { w: "hum", k: "흥얼거리다", pos: "v", cat: "일상", lv: 2 },
    { w: "giggle", k: "킥킥 웃다", pos: "v", cat: "일상", lv: 2 },
    { w: "yawn", k: "하품하다", pos: "v", cat: "일상", lv: 1 },
    { w: "sneeze", k: "재채기하다", pos: "v", cat: "일상", lv: 2 },
    { w: "cough", k: "기침하다", pos: "v", cat: "일상", lv: 1 },
    { w: "scratch", k: "긁다, 할퀴다", pos: "v", cat: "일상", lv: 1 },
    { w: "whisper", k: "속삭이다", pos: "v", cat: "일상", lv: 2 },
    { w: "greet", k: "인사하다, 맞이하다", pos: "v", cat: "일상", lv: 1 },
    { w: "nod", k: "고개를 끄덕이다", pos: "v", cat: "일상", lv: 1 },
    { w: "blink", k: "눈을 깜빡이다", pos: "v", cat: "일상", lv: 2 },
    { w: "frown", k: "얼굴을 찡그리다", pos: "v", cat: "일상", lv: 2 },
    { w: "chuckle", k: "빙긋이 웃다", pos: "v", cat: "일상", lv: 2 },
    { w: "chew", k: "씹다", pos: "v", cat: "일상", lv: 1 },
    { w: "swallow", k: "삼키다", pos: "v", cat: "일상", lv: 2 },
    { w: "stumble", k: "발을 헛디디다, 비틀거리다", pos: "v", cat: "일상", lv: 2 },
    { w: "slip", k: "미끄러지다", pos: "v", cat: "일상", lv: 1 },
    { w: "grab", k: "움켜쥐다, 잡아채다", pos: "v", cat: "일상", lv: 1 },
    { w: "fold", k: "접다, 개다", pos: "v", cat: "일상", lv: 1 },
    { w: "lend", k: "빌려주다", pos: "v", cat: "일상", lv: 1 },
    { w: "borrow", k: "빌리다", pos: "v", cat: "일상", lv: 1 },
    { w: "tidy", k: "정돈하다, 치우다", pos: "v", cat: "일상", lv: 2 },
    { w: "spare", k: "(시간·돈을) 내주다, 아끼다", pos: "v", cat: "일상", lv: 2 },
    { w: "errand", k: "심부름", pos: "n", cat: "일상", lv: 2, _skip: true },
    { w: "nap", k: "낮잠", pos: "n", cat: "일상", lv: 1 },
    { w: "pillow", k: "베개", pos: "n", cat: "일상", lv: 1 },
    { w: "drawer", k: "서랍", pos: "n", cat: "일상", lv: 2 },
    { w: "shelf", k: "선반", pos: "n", cat: "일상", lv: 1 },
    { w: "cushion", k: "쿠션, 방석", pos: "n", cat: "일상", lv: 1 },
    { w: "kettle", k: "주전자", pos: "n", cat: "일상", lv: 2 },

    /* ───────── 비즈니스 (business / TOEIC) ───────── */
    { w: "invoice", k: "청구서, 송장", pos: "n", cat: "비즈니스", lv: 2 },
    { w: "negotiate", k: "협상하다", pos: "v", cat: "비즈니스", lv: 2 },
    { w: "merger", k: "합병", pos: "n", cat: "비즈니스", lv: 3 },
    { w: "acquisition", k: "인수, 획득", pos: "n", cat: "비즈니스", lv: 3 },
    { w: "revenue", k: "수익, 매출", pos: "n", cat: "비즈니스", lv: 2 },
    { w: "expenditure", k: "지출, 비용", pos: "n", cat: "비즈니스", lv: 3 },
    { w: "budget", k: "예산", pos: "n", cat: "비즈니스", lv: 1 },
    { w: "deadline", k: "마감일, 기한", pos: "n", cat: "비즈니스", lv: 1 },
    { w: "agenda", k: "안건, 의제", pos: "n", cat: "비즈니스", lv: 2 },
    { w: "quarterly", k: "분기별의", pos: "adj", cat: "비즈니스", lv: 2 },
    { w: "shareholder", k: "주주", pos: "n", cat: "비즈니스", lv: 2 },
    { w: "stakeholder", k: "이해관계자", pos: "n", cat: "비즈니스", lv: 3 },
    { w: "recruit", k: "모집하다, 채용하다", pos: "v", cat: "비즈니스", lv: 2 },
    { w: "resume", k: "이력서", pos: "n", cat: "비즈니스", lv: 2 },
    { w: "applicant", k: "지원자", pos: "n", cat: "비즈니스", lv: 2 },
    { w: "candidate", k: "후보자, 지원자", pos: "n", cat: "비즈니스", lv: 2 },
    { w: "promotion", k: "승진, 홍보", pos: "n", cat: "비즈니스", lv: 2 },
    { w: "retail", k: "소매", pos: "n", cat: "비즈니스", lv: 2 },
    { w: "wholesale", k: "도매", pos: "n", cat: "비즈니스", lv: 2 },
    { w: "inventory", k: "재고, 재고 목록", pos: "n", cat: "비즈니스", lv: 2 },
    { w: "warehouse", k: "창고", pos: "n", cat: "비즈니스", lv: 2 },
    { w: "shipment", k: "수송품, 선적", pos: "n", cat: "비즈니스", lv: 2 },
    { w: "logistics", k: "물류", pos: "n", cat: "비즈니스", lv: 3 },
    { w: "supplier", k: "공급업체", pos: "n", cat: "비즈니스", lv: 2 },
    { w: "vendor", k: "판매업체, 노점상", pos: "n", cat: "비즈니스", lv: 2 },
    { w: "subscription", k: "구독, 정기 구독", pos: "n", cat: "비즈니스", lv: 2 },
    { w: "installment", k: "할부금, 분할 납입", pos: "n", cat: "비즈니스", lv: 3 },
    { w: "refurbish", k: "개조하다, 재단장하다", pos: "v", cat: "비즈니스", lv: 3 },
    { w: "reimburse", k: "상환하다, 변제하다", pos: "v", cat: "비즈니스", lv: 3 },
    { w: "audit", k: "회계 감사(하다)", pos: "n", cat: "비즈니스", lv: 3 },
    { w: "compliance", k: "준수, 규정 준수", pos: "n", cat: "비즈니스", lv: 3 },
    { w: "liability", k: "책임, 부채", pos: "n", cat: "비즈니스", lv: 3 },
    { w: "asset", k: "자산", pos: "n", cat: "비즈니스", lv: 2 },
    { w: "dividend", k: "배당금", pos: "n", cat: "비즈니스", lv: 3 },
    { w: "forecast", k: "예측(하다)", pos: "n", cat: "비즈니스", lv: 2 },
    { w: "surplus", k: "흑자, 잉여", pos: "n", cat: "비즈니스", lv: 3 },
    { w: "deficit", k: "적자, 부족", pos: "n", cat: "비즈니스", lv: 3 },
    { w: "overhead", k: "간접비, 경상비", pos: "n", cat: "비즈니스", lv: 3 },
    { w: "endorse", k: "지지하다, 보증하다", pos: "v", cat: "비즈니스", lv: 3 },
    { w: "delegate", k: "위임하다, 위양하다", pos: "v", cat: "비즈니스", lv: 3 },
    { w: "outsource", k: "외주를 주다", pos: "v", cat: "비즈니스", lv: 2 },
    { w: "streamline", k: "간소화하다, 능률화하다", pos: "v", cat: "비즈니스", lv: 3 },
    { w: "expedite", k: "신속히 처리하다", pos: "v", cat: "비즈니스", lv: 3 },
    { w: "procurement", k: "조달, 구매", pos: "n", cat: "비즈니스", lv: 3 },
    { w: "tenant", k: "세입자, 임차인", pos: "n", cat: "비즈니스", lv: 2 },
    { w: "lease", k: "임대(하다), 임차", pos: "n", cat: "비즈니스", lv: 2 },
    { w: "premises", k: "부지, 구내", pos: "n", cat: "비즈니스", lv: 3 },
    { w: "venue", k: "장소, 개최지", pos: "n", cat: "비즈니스", lv: 2 },
    { w: "itinerary", k: "여행 일정(표)", pos: "n", cat: "비즈니스", lv: 3 },
    { w: "overtime", k: "초과 근무, 야근", pos: "n", cat: "비즈니스", lv: 2 },
    { w: "layoff", k: "해고, 정리 해고", pos: "n", cat: "비즈니스", lv: 2 },
    { w: "severance", k: "퇴직금, 해고 수당", pos: "n", cat: "비즈니스", lv: 3 },
    { w: "appraisal", k: "평가, 감정", pos: "n", cat: "비즈니스", lv: 3 },
    { w: "incentive", k: "장려책, 성과급", pos: "n", cat: "비즈니스", lv: 2 },
    { w: "turnover", k: "이직률, (총)매상고", pos: "n", cat: "비즈니스", lv: 3 },
    { w: "benchmark", k: "기준(점), 척도", pos: "n", cat: "비즈니스", lv: 2 },
    { w: "proposal", k: "제안(서)", pos: "n", cat: "비즈니스", lv: 2 },
    { w: "clause", k: "조항, 절", pos: "n", cat: "비즈니스", lv: 2 },
    { w: "breach", k: "위반, 불이행", pos: "n", cat: "비즈니스", lv: 3 },
    { w: "warranty", k: "품질 보증(서)", pos: "n", cat: "비즈니스", lv: 2 },
    { w: "defective", k: "결함 있는", pos: "adj", cat: "비즈니스", lv: 2 },
    { w: "durable", k: "내구성 있는, 오래가는", pos: "adj", cat: "비즈니스", lv: 2 },
    { w: "feasible", k: "실현 가능한", pos: "adj", cat: "비즈니스", lv: 3 },
    { w: "lucrative", k: "수익성이 좋은", pos: "adj", cat: "비즈니스", lv: 3 },
    { w: "tentative", k: "잠정적인, 머뭇거리는", pos: "adj", cat: "비즈니스", lv: 3 },
    { w: "mandatory", k: "의무적인, 강제의", pos: "adj", cat: "비즈니스", lv: 3 },
    { w: "redeem", k: "(상품권 등을) 교환하다, 상환하다", pos: "v", cat: "비즈니스", lv: 3 },
    { w: "pending", k: "미결의, 보류 중인", pos: "adj", cat: "비즈니스", lv: 2 },
    { w: "prospective", k: "장래의, 유망한", pos: "adj", cat: "비즈니스", lv: 3 },
    { w: "complimentary", k: "무료의, 칭찬하는", pos: "adj", cat: "비즈니스", lv: 3 },
    { w: "concession", k: "양보, 양허", pos: "n", cat: "비즈니스", lv: 3 },

    /* ───────── 학술 (academic / TOEFL) ───────── */
    { w: "hypothesis", k: "가설", pos: "n", cat: "학술", lv: 3 },
    { w: "empirical", k: "경험적인, 실증적인", pos: "adj", cat: "학술", lv: 3 },
    { w: "phenomenon", k: "현상", pos: "n", cat: "학술", lv: 2 },
    { w: "paradigm", k: "패러다임, 전형", pos: "n", cat: "학술", lv: 3 },
    { w: "correlation", k: "상관관계", pos: "n", cat: "학술", lv: 3 },
    { w: "variable", k: "변수", pos: "n", cat: "학술", lv: 2 },
    { w: "quantitative", k: "양적인, 정량적인", pos: "adj", cat: "학술", lv: 3 },
    { w: "qualitative", k: "질적인, 정성적인", pos: "adj", cat: "학술", lv: 3 },
    { w: "methodology", k: "방법론", pos: "n", cat: "학술", lv: 3 },
    { w: "synthesis", k: "종합, 합성", pos: "n", cat: "학술", lv: 3 },
    { w: "inference", k: "추론, 추리", pos: "n", cat: "학술", lv: 3 },
    { w: "premise", k: "전제", pos: "n", cat: "학술", lv: 3 },
    { w: "assumption", k: "가정, 추정", pos: "n", cat: "학술", lv: 2 },
    { w: "rationale", k: "근거, 이론적 해석", pos: "n", cat: "학술", lv: 3 },
    { w: "paradox", k: "역설, 모순", pos: "n", cat: "학술", lv: 3 },
    { w: "ambiguous", k: "모호한, 여러 뜻의", pos: "adj", cat: "학술", lv: 3 },
    { w: "coherent", k: "일관성 있는, 논리정연한", pos: "adj", cat: "학술", lv: 3 },
    { w: "comprehensive", k: "포괄적인, 종합적인", pos: "adj", cat: "학술", lv: 3 },
    { w: "subsequent", k: "그 다음의, 후속의", pos: "adj", cat: "학술", lv: 3 },
    { w: "preliminary", k: "예비의, 사전의", pos: "adj", cat: "학술", lv: 3 },
    { w: "underlying", k: "근본적인, 기저의", pos: "adj", cat: "학술", lv: 3 },
    { w: "prevalent", k: "널리 퍼진, 만연한", pos: "adj", cat: "학술", lv: 3 },
    { w: "conspicuous", k: "눈에 잘 띄는, 뚜렷한", pos: "adj", cat: "학술", lv: 3 },
    { w: "negligible", k: "무시해도 될 정도의", pos: "adj", cat: "학술", lv: 3 },
    { w: "substantial", k: "상당한, 실질적인", pos: "adj", cat: "학술", lv: 3 },
    { w: "inherent", k: "내재된, 본질적인", pos: "adj", cat: "학술", lv: 3 },
    { w: "arbitrary", k: "임의적인, 자의적인", pos: "adj", cat: "학술", lv: 3 },
    { w: "explicit", k: "명시적인, 분명한", pos: "adj", cat: "학술", lv: 3 },
    { w: "implicit", k: "암시적인, 내포된", pos: "adj", cat: "학술", lv: 3 },
    { w: "discrete", k: "별개의, 분리된", pos: "adj", cat: "학술", lv: 3 },
    { w: "finite", k: "유한한, 한정된", pos: "adj", cat: "학술", lv: 2 },
    { w: "magnitude", k: "규모, 크기", pos: "n", cat: "학술", lv: 3 },
    { w: "threshold", k: "문턱, 한계점", pos: "n", cat: "학술", lv: 3 },
    { w: "spectrum", k: "범위, 스펙트럼", pos: "n", cat: "학술", lv: 2 },
    { w: "equilibrium", k: "평형, 균형", pos: "n", cat: "학술", lv: 3 },
    { w: "catalyst", k: "촉매, 기폭제", pos: "n", cat: "학술", lv: 3 },
    { w: "derive", k: "끌어내다, 유래하다", pos: "v", cat: "학술", lv: 3 },
    { w: "constitute", k: "구성하다, ~이 되다", pos: "v", cat: "학술", lv: 3 },
    { w: "comprise", k: "구성하다, ~으로 이루어지다", pos: "v", cat: "학술", lv: 3 },
    { w: "exemplify", k: "예시하다, 전형적으로 보여주다", pos: "v", cat: "학술", lv: 3 },
    { w: "illustrate", k: "설명하다, 예증하다", pos: "v", cat: "학술", lv: 2 },
    { w: "denote", k: "나타내다, 의미하다", pos: "v", cat: "학술", lv: 3 },
    { w: "imply", k: "암시하다, 내포하다", pos: "v", cat: "학술", lv: 2 },
    { w: "constrain", k: "제약하다, 억제하다", pos: "v", cat: "학술", lv: 3 },
    { w: "facilitate", k: "용이하게 하다, 촉진하다", pos: "v", cat: "학술", lv: 3 },
    { w: "mitigate", k: "완화하다, 경감하다", pos: "v", cat: "학술", lv: 3 },
    { w: "exacerbate", k: "악화시키다", pos: "v", cat: "학술", lv: 3 },
    { w: "undermine", k: "약화시키다, 훼손하다", pos: "v", cat: "학술", lv: 3 },
    { w: "reinforce", k: "강화하다, 보강하다", pos: "v", cat: "학술", lv: 2 },
    { w: "fluctuate", k: "변동하다, 오르내리다", pos: "v", cat: "학술", lv: 3 },
    { w: "accumulate", k: "축적하다, 모으다", pos: "v", cat: "학술", lv: 2 },
    { w: "disseminate", k: "퍼뜨리다, 보급하다", pos: "v", cat: "학술", lv: 3 },
    { w: "scrutinize", k: "면밀히 조사하다", pos: "v", cat: "학술", lv: 3 },
    { w: "advocate", k: "옹호하다, 지지하다", pos: "v", cat: "학술", lv: 3 },
    { w: "refute", k: "반박하다, 논박하다", pos: "v", cat: "학술", lv: 3 },
    { w: "substantiate", k: "입증하다, 실증하다", pos: "v", cat: "학술", lv: 3 },
    { w: "attribute", k: "~의 탓으로 돌리다", pos: "v", cat: "학술", lv: 3 },
    { w: "correlate", k: "연관성이 있다", pos: "v", cat: "학술", lv: 3 },
    { w: "diverge", k: "갈라지다, 벗어나다", pos: "v", cat: "학술", lv: 3 },
    { w: "converge", k: "모여들다, 수렴하다", pos: "v", cat: "학술", lv: 3 },
    { w: "notion", k: "개념, 관념", pos: "n", cat: "학술", lv: 2 },
    { w: "criterion", k: "기준, 판단 기준", pos: "n", cat: "학술", lv: 3 },
    { w: "anomaly", k: "변칙, 이례", pos: "n", cat: "학술", lv: 3 },
    { w: "trait", k: "특성, 특징", pos: "n", cat: "학술", lv: 2 },

    /* ───────── 시험 빈출 (advanced / 공인시험) ───────── */
    { w: "abundant", k: "풍부한, 많은", pos: "adj", cat: "시험", lv: 3 },
    { w: "adverse", k: "불리한, 부정적인", pos: "adj", cat: "시험", lv: 3 },
    { w: "alleviate", k: "완화하다, 덜어주다", pos: "v", cat: "시험", lv: 3 },
    { w: "ambivalent", k: "상반된 감정의, 양면적인", pos: "adj", cat: "시험", lv: 3 },
    { w: "candid", k: "솔직한, 숨김없는", pos: "adj", cat: "시험", lv: 3 },
    { w: "coerce", k: "강요하다, 강압하다", pos: "v", cat: "시험", lv: 3 },
    { w: "concise", k: "간결한, 간명한", pos: "adj", cat: "시험", lv: 3 },
    { w: "condone", k: "용납하다, 눈감아 주다", pos: "v", cat: "시험", lv: 3 },
    { w: "cumbersome", k: "성가신, 다루기 힘든", pos: "adj", cat: "시험", lv: 3 },
    { w: "deter", k: "단념시키다, 저지하다", pos: "v", cat: "시험", lv: 3 },
    { w: "diligent", k: "근면한, 성실한", pos: "adj", cat: "시험", lv: 2 },
    { w: "diminish", k: "줄이다, 감소하다", pos: "v", cat: "시험", lv: 2 },
    { w: "discern", k: "식별하다, 알아차리다", pos: "v", cat: "시험", lv: 3 },
    { w: "dubious", k: "의심스러운, 수상쩍은", pos: "adj", cat: "시험", lv: 3 },
    { w: "eloquent", k: "웅변의, 설득력 있는", pos: "adj", cat: "시험", lv: 3 },
    { w: "endeavor", k: "노력하다, 애쓰다", pos: "v", cat: "시험", lv: 3 },
    { w: "enhance", k: "향상시키다, 높이다", pos: "v", cat: "시험", lv: 2 },
    { w: "frugal", k: "검소한, 절약하는", pos: "adj", cat: "시험", lv: 3 },
    { w: "futile", k: "헛된, 소용없는", pos: "adj", cat: "시험", lv: 3 },
    { w: "gregarious", k: "사교적인, 무리 짓는", pos: "adj", cat: "시험", lv: 3 },
    { w: "hinder", k: "방해하다, 못 하게 하다", pos: "v", cat: "시험", lv: 2 },
    { w: "imminent", k: "임박한, 절박한", pos: "adj", cat: "시험", lv: 3 },
    { w: "impede", k: "지연시키다, 방해하다", pos: "v", cat: "시험", lv: 3 },
    { w: "indifferent", k: "무관심한, 그저 그런", pos: "adj", cat: "시험", lv: 2 },
    { w: "ingenious", k: "기발한, 독창적인", pos: "adj", cat: "시험", lv: 3 },
    { w: "intricate", k: "복잡한, 뒤얽힌", pos: "adj", cat: "시험", lv: 3 },
    { w: "lenient", k: "관대한, 너그러운", pos: "adj", cat: "시험", lv: 3 },
    { w: "meticulous", k: "꼼꼼한, 세심한", pos: "adj", cat: "시험", lv: 3 },
    { w: "notorious", k: "악명 높은", pos: "adj", cat: "시험", lv: 3 },
    { w: "obsolete", k: "구식의, 쓸모없어진", pos: "adj", cat: "시험", lv: 3 },
    { w: "ominous", k: "불길한, 나쁜 징조의", pos: "adj", cat: "시험", lv: 3 },
    { w: "paramount", k: "가장 중요한, 최고의", pos: "adj", cat: "시험", lv: 3 },
    { w: "perpetual", k: "끊임없는, 영구적인", pos: "adj", cat: "시험", lv: 3 },
    { w: "plausible", k: "그럴듯한, 타당해 보이는", pos: "adj", cat: "시험", lv: 3 },
    { w: "pragmatic", k: "실용적인, 현실적인", pos: "adj", cat: "시험", lv: 3 },
    { w: "profound", k: "심오한, 깊은", pos: "adj", cat: "시험", lv: 3 },
    { w: "prudent", k: "신중한, 분별 있는", pos: "adj", cat: "시험", lv: 3 },
    { w: "redundant", k: "불필요한, 중복의", pos: "adj", cat: "시험", lv: 3 },
    { w: "relentless", k: "끈질긴, 가차없는", pos: "adj", cat: "시험", lv: 3 },
    { w: "resilient", k: "회복력 있는, 탄력 있는", pos: "adj", cat: "시험", lv: 3 },
    { w: "scarce", k: "부족한, 드문", pos: "adj", cat: "시험", lv: 2 },
    { w: "skeptical", k: "회의적인, 의심 많은", pos: "adj", cat: "시험", lv: 3 },
    { w: "sporadic", k: "산발적인, 이따금의", pos: "adj", cat: "시험", lv: 3 },
    { w: "superficial", k: "피상적인, 표면적인", pos: "adj", cat: "시험", lv: 3 },
    { w: "tedious", k: "지루한, 싫증나는", pos: "adj", cat: "시험", lv: 3 },
    { w: "tenacious", k: "집요한, 끈기 있는", pos: "adj", cat: "시험", lv: 3 },
    { w: "trivial", k: "사소한, 하찮은", pos: "adj", cat: "시험", lv: 2 },
    { w: "versatile", k: "다재다능한, 다용도의", pos: "adj", cat: "시험", lv: 3 },
    { w: "vigorous", k: "활기찬, 격렬한", pos: "adj", cat: "시험", lv: 2 },
    { w: "vulnerable", k: "취약한, 상처받기 쉬운", pos: "adj", cat: "시험", lv: 3 },
    { w: "wary", k: "조심하는, 경계하는", pos: "adj", cat: "시험", lv: 3 },
    { w: "abolish", k: "폐지하다", pos: "v", cat: "시험", lv: 3 },
    { w: "accommodate", k: "수용하다, 공간을 제공하다", pos: "v", cat: "시험", lv: 3 },
    { w: "compel", k: "강요하다, ~하게 만들다", pos: "v", cat: "시험", lv: 3 },
    { w: "comply", k: "따르다, 준수하다", pos: "v", cat: "시험", lv: 2 },
    { w: "contemplate", k: "심사숙고하다, 고려하다", pos: "v", cat: "시험", lv: 3 },
    { w: "curtail", k: "축소하다, 삭감하다", pos: "v", cat: "시험", lv: 3 },
    { w: "denounce", k: "비난하다, 고발하다", pos: "v", cat: "시험", lv: 3 },
    { w: "deprive", k: "박탈하다, 빼앗다", pos: "v", cat: "시험", lv: 3 },
    { w: "devise", k: "고안하다, 궁리하다", pos: "v", cat: "시험", lv: 3 },
    { w: "foster", k: "조성하다, 양육하다", pos: "v", cat: "시험", lv: 3 },
    { w: "jeopardize", k: "위태롭게 하다", pos: "v", cat: "시험", lv: 3 },
    { w: "linger", k: "남아 있다, 꾸물거리다", pos: "v", cat: "시험", lv: 3 },
    { w: "nurture", k: "양육하다, 키우다", pos: "v", cat: "시험", lv: 3 },
    { w: "overwhelm", k: "압도하다, 제압하다", pos: "v", cat: "시험", lv: 3 },
    { w: "persist", k: "지속하다, 고집하다", pos: "v", cat: "시험", lv: 2 },
    { w: "ponder", k: "숙고하다, 곰곰이 생각하다", pos: "v", cat: "시험", lv: 3 },
    { w: "replenish", k: "다시 채우다, 보충하다", pos: "v", cat: "시험", lv: 3 },
    { w: "suppress", k: "억누르다, 진압하다", pos: "v", cat: "시험", lv: 3 },
    { w: "yield", k: "산출하다, 양보하다", pos: "v", cat: "시험", lv: 2 },

    /* ───────── 수능 빈출 (CSAT) ───────── */
    { w: "acknowledge", k: "인정하다, 받아들이다", pos: "v", cat: "수능", lv: 3 },
    { w: "accomplish", k: "성취하다, 이루다", pos: "v", cat: "수능", lv: 2 },
    { w: "adapt", k: "적응하다, 개조하다", pos: "v", cat: "수능", lv: 2 },
    { w: "adequate", k: "적절한, 충분한", pos: "adj", cat: "수능", lv: 3 },
    { w: "anticipate", k: "예상하다, 기대하다", pos: "v", cat: "수능", lv: 3 },
    { w: "apparent", k: "명백한, 외관상의", pos: "adj", cat: "수능", lv: 2 },
    { w: "appropriate", k: "적절한, 알맞은", pos: "adj", cat: "수능", lv: 2 },
    { w: "aspect", k: "측면, 양상", pos: "n", cat: "수능", lv: 2 },
    { w: "assess", k: "평가하다, 가늠하다", pos: "v", cat: "수능", lv: 2 },
    { w: "associate", k: "연관 짓다, 어울리다", pos: "v", cat: "수능", lv: 2 },
    { w: "bias", k: "편견, 편향", pos: "n", cat: "수능", lv: 2 },
    { w: "cease", k: "중단되다, 그치다", pos: "v", cat: "수능", lv: 3 },
    { w: "circumstance", k: "상황, 환경", pos: "n", cat: "수능", lv: 2 },
    { w: "cognitive", k: "인지의, 인식의", pos: "adj", cat: "수능", lv: 3 },
    { w: "collapse", k: "붕괴하다, 무너지다", pos: "v", cat: "수능", lv: 2 },
    { w: "compensate", k: "보상하다, 보충하다", pos: "v", cat: "수능", lv: 3 },
    { w: "competent", k: "유능한, 능숙한", pos: "adj", cat: "수능", lv: 3 },
    { w: "component", k: "구성 요소, 부품", pos: "n", cat: "수능", lv: 2 },
    { w: "comprehend", k: "이해하다, 파악하다", pos: "v", cat: "수능", lv: 2 },
    { w: "conceal", k: "숨기다, 감추다", pos: "v", cat: "수능", lv: 3 },
    { w: "confront", k: "직면하다, 맞서다", pos: "v", cat: "수능", lv: 3 },
    { w: "consequence", k: "결과, 영향", pos: "n", cat: "수능", lv: 2 },
    { w: "consistent", k: "일관된, 한결같은", pos: "adj", cat: "수능", lv: 2 },
    { w: "contemporary", k: "현대의, 동시대의", pos: "adj", cat: "수능", lv: 3 },
    { w: "contradict", k: "모순되다, 반박하다", pos: "v", cat: "수능", lv: 3 },
    { w: "convey", k: "전달하다, 운반하다", pos: "v", cat: "수능", lv: 2 },
    { w: "cope", k: "대처하다, 대응하다", pos: "v", cat: "수능", lv: 2 },
    { w: "crucial", k: "결정적인, 중대한", pos: "adj", cat: "수능", lv: 2 },
    { w: "deliberate", k: "고의의, 신중한", pos: "adj", cat: "수능", lv: 3 },
    { w: "demonstrate", k: "입증하다, 보여주다", pos: "v", cat: "수능", lv: 2 },
    { w: "deserve", k: "~할 자격이 있다, 받을 만하다", pos: "v", cat: "수능", lv: 2 },
    { w: "determine", k: "결정하다, 밝혀내다", pos: "v", cat: "수능", lv: 2 },
    { w: "distinguish", k: "구별하다, 식별하다", pos: "v", cat: "수능", lv: 2 },
    { w: "distribute", k: "분배하다, 유통시키다", pos: "v", cat: "수능", lv: 2 },
    { w: "diverse", k: "다양한", pos: "adj", cat: "수능", lv: 2 },
    { w: "dominate", k: "지배하다, 우세하다", pos: "v", cat: "수능", lv: 2 },
    { w: "eliminate", k: "제거하다, 없애다", pos: "v", cat: "수능", lv: 2 },
    { w: "emerge", k: "나타나다, 드러나다", pos: "v", cat: "수능", lv: 2 },
    { w: "endure", k: "견디다, 참다", pos: "v", cat: "수능", lv: 3 },
    { w: "enormous", k: "거대한, 막대한", pos: "adj", cat: "수능", lv: 2 },
    { w: "ensure", k: "보장하다, 확실히 하다", pos: "v", cat: "수능", lv: 2 },
    { w: "essential", k: "필수적인, 본질적인", pos: "adj", cat: "수능", lv: 2 },
    { w: "evident", k: "분명한, 눈에 띄는", pos: "adj", cat: "수능", lv: 2 },
    { w: "evolve", k: "진화하다, 발전하다", pos: "v", cat: "수능", lv: 2 },
    { w: "exceed", k: "초과하다, 넘어서다", pos: "v", cat: "수능", lv: 3 },
    { w: "exploit", k: "이용하다, 착취하다", pos: "v", cat: "수능", lv: 3 },
    { w: "fascinate", k: "매혹하다, 마음을 사로잡다", pos: "v", cat: "수능", lv: 3 },
    { w: "fundamental", k: "근본적인, 기본적인", pos: "adj", cat: "수능", lv: 3 },
    { w: "generate", k: "발생시키다, 만들어내다", pos: "v", cat: "수능", lv: 2 },
    { w: "genuine", k: "진짜의, 진실한", pos: "adj", cat: "수능", lv: 3 },
    { w: "inevitable", k: "불가피한, 필연적인", pos: "adj", cat: "수능", lv: 3 },
    { w: "interpret", k: "해석하다, 통역하다", pos: "v", cat: "수능", lv: 2 },
    { w: "intervene", k: "개입하다, 중재하다", pos: "v", cat: "수능", lv: 3 },
    { w: "justify", k: "정당화하다, 옳음을 보이다", pos: "v", cat: "수능", lv: 3 },
    { w: "manipulate", k: "조종하다, 교묘히 다루다", pos: "v", cat: "수능", lv: 3 },
    { w: "mutual", k: "상호의, 서로의", pos: "adj", cat: "수능", lv: 3 },
    { w: "neglect", k: "소홀히 하다, 방치하다", pos: "v", cat: "수능", lv: 3 },
    { w: "obstacle", k: "장애물, 방해물", pos: "n", cat: "수능", lv: 2 },
    { w: "obtain", k: "얻다, 획득하다", pos: "v", cat: "수능", lv: 2 },
    { w: "perceive", k: "인지하다, 감지하다", pos: "v", cat: "수능", lv: 3 },
    { w: "permanent", k: "영구적인, 영속적인", pos: "adj", cat: "수능", lv: 2 },
    { w: "persuade", k: "설득하다", pos: "v", cat: "수능", lv: 2 },
    { w: "potential", k: "잠재적인, 가능성 있는", pos: "adj", cat: "수능", lv: 2 },
    { w: "precise", k: "정확한, 정밀한", pos: "adj", cat: "수능", lv: 3 },
    { w: "principle", k: "원리, 원칙", pos: "n", cat: "수능", lv: 2 },
    { w: "pursue", k: "추구하다, 뒤쫓다", pos: "v", cat: "수능", lv: 2 },
    { w: "reluctant", k: "꺼리는, 마지못한", pos: "adj", cat: "수능", lv: 3 },
    { w: "remarkable", k: "주목할 만한, 놀라운", pos: "adj", cat: "수능", lv: 3 },
    { w: "restore", k: "회복시키다, 복원하다", pos: "v", cat: "수능", lv: 3 },
    { w: "restrict", k: "제한하다, 한정하다", pos: "v", cat: "수능", lv: 3 },
    { w: "reveal", k: "드러내다, 폭로하다", pos: "v", cat: "수능", lv: 2 },
    { w: "significant", k: "중요한, 상당한", pos: "adj", cat: "수능", lv: 2 },
    { w: "strategy", k: "전략, 계획", pos: "n", cat: "수능", lv: 2 },
    { w: "sufficient", k: "충분한", pos: "adj", cat: "수능", lv: 3 },
    { w: "tendency", k: "경향, 성향", pos: "n", cat: "수능", lv: 2 },
    { w: "tremendous", k: "엄청난, 굉장한", pos: "adj", cat: "수능", lv: 3 },
    { w: "urge", k: "촉구하다, 강력히 권하다", pos: "v", cat: "수능", lv: 3 },
    { w: "vivid", k: "생생한, 선명한", pos: "adj", cat: "수능", lv: 2 },
    { w: "welfare", k: "복지, 안녕", pos: "n", cat: "수능", lv: 3 },
    { w: "widespread", k: "널리 퍼진, 광범위한", pos: "adj", cat: "수능", lv: 3 }
  ].filter(function (e) { return !e._skip; });

  var CATS = ["일상", "비즈니스", "학술", "시험", "수능"];
  var POS_KO = { n: "명사", v: "동사", adj: "형용사", adv: "부사" };
  var N = VOCAB.length;
  var DAY_MS = 86400000;
  // 런칭 기준일(KST 2026-10-17) = day 0. 모든 사람이 같은 날 같은 단어.
  var EPOCH = Math.floor((Date.UTC(2026, 9, 17, 0, 0, 0) + 9 * 3600000) / DAY_MS);

  function kstDayIndex(ms) { return Math.floor((ms + 9 * 3600000) / DAY_MS); }
  function dayIndex() { return Math.max(0, kstDayIndex(Date.now()) - EPOCH); }

  // 시드 기반 난수(mulberry32) — 모든 브라우저에서 동일 결과
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function seededPerm(seed) {
    var idx = []; for (var i = 0; i < N; i++) idx.push(i);
    var rnd = mulberry32((seed * 2654435761) ^ 0x9e3779b9);
    for (var j = N - 1; j > 0; j--) { var k = Math.floor(rnd() * (j + 1)); var tmp = idx[j]; idx[j] = idx[k]; idx[k] = tmp; }
    return idx;
  }
  // d일차의 '새 단어 30개' 인덱스(결정적)
  function wordsForDay(d) {
    if (d < 0) return [];
    var cycle = Math.floor((d * 30) / N);
    var perm = seededPerm(cycle);
    var start = (d * 30) % N;
    var out = [];
    for (var i = 0; i < 30; i++) out.push(perm[(start + i) % N]);
    return out;
  }
  // 오늘 학습 세트 = (어제 30 + 오늘 30), 중복 제거. 첫날(d=0)은 30개.
  function todaySet(d) {
    if (typeof d !== "number") d = dayIndex();
    var ids = wordsForDay(d);
    if (d >= 1) ids = wordsForDay(d - 1).concat(ids);
    var seen = {}, out = [];
    ids.forEach(function (i) { if (!(i in seen)) { seen[i] = 1; out.push(VOCAB[i]); } });
    return out;
  }

  // 퀴즈 문항 생성: words(학습세트) 중 n개, 각 5지선다. 오답은 같은 cat·pos에서 우선 추출(난이도↑).
  //   stats: {단어:{c,w}} — 이전에 틀린 단어에 가중치(복습 유도). rngSeed로 날짜별 고정 가능.
  function makeQuestions(words, stats, n, rngSeed) {
    stats = stats || {};
    var rnd = mulberry32((typeof rngSeed === "number" ? rngSeed : Math.floor(Math.random() * 1e9)) ^ 0x51ed270b);
    // 가중치: 기본 1, 틀린 적 있으면 오답률 비례해 ↑ (최대 4배)
    var pool = words.slice();
    var weighted = [];
    pool.forEach(function (e) {
      var s = stats[e.w] || { c: 0, w: 0 };
      var tot = s.c + s.w;
      var wrongRate = tot ? s.w / tot : 0;
      var weight = 1 + Math.round(wrongRate * 3) + (tot === 0 ? 0 : 0);
      for (var i = 0; i < weight; i++) weighted.push(e);
    });
    // 가중 풀에서 중복 없이 n개 뽑기
    var picked = [], usedW = {};
    var guard = 0;
    while (picked.length < Math.min(n, pool.length) && guard < 5000) {
      guard++;
      var e = weighted.length ? weighted[Math.floor(rnd() * weighted.length)] : pool[Math.floor(rnd() * pool.length)];
      if (usedW[e.w]) continue;
      usedW[e.w] = 1; picked.push(e);
    }
    // 혹시 부족하면 남은 단어로 채움
    pool.forEach(function (e) { if (picked.length < Math.min(n, pool.length) && !usedW[e.w]) { usedW[e.w] = 1; picked.push(e); } });

    return picked.map(function (ans) {
      // 오답 후보: 뜻이 다른 단어들. 같은 cat&pos > 같은 cat > 같은 pos > 전체 순으로 우선.
      var others = VOCAB.filter(function (x) { return x.w !== ans.w && x.k !== ans.k; });
      function tier(x) {
        if (x.cat === ans.cat && x.pos === ans.pos) return 0;
        if (x.cat === ans.cat) return 1;
        if (x.pos === ans.pos) return 2;
        return 3;
      }
      others.sort(function (a, b) { return tier(a) - tier(b) || rnd() - 0.5; });
      var distract = [], usedK = {}; usedK[ans.k] = 1;
      for (var i = 0; i < others.length && distract.length < 4; i++) {
        if (usedK[others[i].k]) continue;
        usedK[others[i].k] = 1; distract.push(others[i].k);
      }
      var choices = distract.concat([ans.k]);
      // 셔플
      for (var j = choices.length - 1; j > 0; j--) { var k = Math.floor(rnd() * (j + 1)); var t = choices[j]; choices[j] = choices[k]; choices[k] = t; }
      return { w: ans.w, k: ans.k, pos: ans.pos, cat: ans.cat, choices: choices, answer: choices.indexOf(ans.k) };
    });
  }

  window.VOCAB = VOCAB;
  window.VB = {
    CATS: CATS, POS_KO: POS_KO, size: N,
    dayIndex: dayIndex, wordsForDay: wordsForDay, todaySet: todaySet, makeQuestions: makeQuestions
  };
})();
