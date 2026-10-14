"use strict";
/* ===== 사주 리포트: 분석 + 12단계 렌더 =====
   순서: 타고난 구조 → 인생 흐름 → 분야별 세부 → 시기별 정리 → 핵심 결론 */

/* ---------------- 관계 표 ---------------- */
const STEM_HAP = {"0-5":2,"1-6":3,"2-7":4,"3-8":0,"4-9":1};
const STEM_CHUNG = new Set(["0-6","1-7","2-8","3-9"]);
const BR_HAP = {"0-1":2,"2-11":0,"3-10":1,"4-9":3,"5-8":4,"6-7":1};
const BR_CHUNG = b => (b+6)%12;
const BR_HYEONG = new Set(["0-3","2-5","5-8","2-8","1-10","7-10","1-7"]);
const BR_WONJIN = new Set(["0-7","1-6","2-9","3-8","4-11","5-10"]);
const SELF_HYEONG = new Set([4,6,9,11]);
const SAMHAP = [[8,0,4,4],[2,6,10,1],[5,9,1,3],[11,3,7,0]];
const key2 = (a,b) => a<b ? a+"-"+b : b+"-"+a;
const frameOf = b => [8,0,4].includes(b)?0:[2,6,10].includes(b)?1:[5,9,1].includes(b)?2:3;   // 신자진 인오술 사유축 해묘미
const FRAME_SAENG = [8,2,5,11];
const DOHWA=[9,3,6,0], YEOKMA=[2,8,11,5], HWAGAE=[4,10,1,7];
const GWIN = [[1,7],[0,8],[11,9],[11,9],[1,7],[0,8],[1,7],[2,6],[5,3],[5,3]];
const MUNCHANG = [5,6,8,9,8,9,11,0,2,3];
const YANGIN = {0:3,2:6,4:6,6:9,8:0};
const SINSAL12 = ["겁살","재살","천살","지살","연살","월살","망신살","장성살","반안살","역마살","육해살","화개살"];
const SINSAL12_TXT = {
  겁살:"빼앗기고 빼앗는 기운 — 경쟁·손재 조심, 대신 승부욕",
  재살:"갇히는 기운 — 압박·구속감, 대신 집중력",
  천살:"하늘의 변수 — 내 힘으로 못 막는 일, 기도·준비가 약",
  지살:"출발의 기운 — 이사·이동·새 시작",
  연살:"도화(매력) — 인기·연애·꾸밈",
  월살:"메마른 기운 — 일이 막히고 지치기 쉬움, 쉬어 가기",
  망신살:"드러나는 기운 — 구설·노출, 대신 주목받음",
  장성살:"장수의 기운 — 리더십·권위",
  반안살:"말 안장 — 승진·안정·출세",
  역마살:"이동의 기운 — 해외·출장·변화",
  육해살:"잔병·지연 — 느리지만 끈기",
  화개살:"덮개 — 예술·종교·학문, 혼자 깊어지는 힘"};
const sinsal12 = (base,b) => SINSAL12[mod(b-(FRAME_SAENG[frameOf(base)]-3),12)];

/* ---------------- 용어 풀이(처음 나올 때만) ---------------- */
const GLOSS = {
  일간:"태어난 날의 천간, 즉 '나 자신'", 십성:"나와 다른 글자의 관계를 10가지 역할로 나눈 것",
  비겁:"나와 같은 기운 — 자존심·동료·경쟁자", 식상:"내가 만들어 내는 기운 — 말·재능·결과물",
  재성:"내가 다스리는 기운 — 돈·현실·성과", 관성:"나를 다스리는 기운 — 직장·규칙·명예",
  인성:"나를 도와주는 기운 — 공부·문서·어머니·보호",
  신강:"나를 돕는 기운이 많아 주관이 센 사주", 신약:"나를 돕는 기운이 적어 주변 영향을 많이 받는 사주",
  중화:"돕는 기운과 빼는 기운이 비슷한 균형 잡힌 사주",
  용신:"내 사주에 가장 필요한 기운, 일종의 '약'", 희신:"용신을 도와주는 기운",
  기신:"용신을 공격하는 기운 — 들어오면 일이 꼬이기 쉬움", 구신:"기신을 키워 주는 기운",
  격국:"태어난 달의 기운으로 정하는 사주의 '설계도' — 사회에서 쓰는 주무기",
  충:"두 글자가 정면으로 부딪히는 것 — 변화·이동·갈등", 합:"두 글자가 끌어당겨 묶이는 것 — 인연·협력·묶임",
  형:"서로 깎고 다듬는 관계 — 수술·법적 문제·인간관계 마찰", 원진:"이유 없이 서운해지고 미워지는 관계",
  대운:"10년마다 바뀌는 인생의 큰 계절", 세운:"매년 바뀌는 그 해의 운", 월운:"매달 바뀌는 운",
  득령:"태어난 달이 나를 돕는 계절인 것", 득지:"내가 앉은 자리(일지)가 나를 돕는 것", 득세:"주변 글자 중 나를 돕는 게 많은 것",
  "12운성":"그 자리에서 내 기운이 얼마나 센지를 생로병사 12단계로 본 것",
  "12신살":"띠를 기준으로 본 12가지 사건 패턴", 지장간:"지지 속에 숨은 천간 — 겉으로 안 보이는 속마음·잠재력",
  천을귀인:"위기 때 나타나는 귀인의 별", 도화:"사람을 끄는 매력·인기의 별", 역마:"이동·여행·해외의 별",
  배우자궁:"일지, 즉 내가 깔고 앉은 자리 — 배우자와 가정을 뜻함", 배우자성:"배우자를 뜻하는 십성 — 남자는 재성, 여자는 관성",
  자녀성:"자녀를 뜻하는 십성 — 남자는 관성, 여자는 식상",
  비견:"나와 같은 오행·같은 음양 — 동료·형제·경쟁자, 자존심과 독립심",
  겁재:"나와 같은 오행·다른 음양 — 라이벌·동업, 승부욕과 지출",
  식신:"내가 낳는 기운(순한 쪽) — 재능·표현·먹을 복, 꾸준한 생산",
  상관:"내가 낳는 기운(튀는 쪽) — 창의·끼·반항, 틀을 깨는 표현력",
  편재:"내가 다스리는 재물(큰 쪽) — 사업·투자·활동적인 돈, (남)연애",
  정재:"내가 다스리는 재물(고정) — 월급·저축·성실, (남)아내",
  편관:"나를 치는 기운(센 쪽) — 카리스마·압박·스트레스, 칠살이라고도 함",
  정관:"나를 다스리는 기운(바른 쪽) — 직장·명예·규칙, (여)남편",
  편인:"나를 돕는 기운(치우친 쪽) — 독특한 공부·직관·눈치, 효신이라고도 함",
  정인:"나를 돕는 기운(바른 쪽) — 정통 공부·문서·어머니의 보살핌",
  억부:"넘치는 기운은 덜고 모자란 기운은 채워 균형을 맞추는 용신 잡는 법",
  조후:"사주의 춥고 더움·마르고 습함을 따뜻하게·촉촉하게 맞추는 용신 잡는 법",
  삼합:"지지 셋이 모여 하나의 강한 오행으로 뭉치는 것 — 인생의 큰 테마",
  반합:"삼합 셋 중 둘만 모인 것 — 나머지 하나가 운에서 오면 살아남",
  육합:"지지 둘이 짝지어 묶이는 것 — 손발이 잘 맞는 인연·협력",
  천간합:"천간 둘이 끌어당겨 묶이는 것 — 겉으로 드러나는 협력·끌림",
  천간충:"천간 둘이 정면으로 부딪히는 것 — 생각·결정의 갈등",
  신살:"특정 글자 조합에서 생기는 길흉의 '별' — 복이 되는 귀인과 조심할 살",
  일주:"태어난 날의 두 글자(천간+지지) — 나와 배우자를 나타내는 핵심 기둥",
  월주:"태어난 달의 두 글자 — 부모·사회·직업의 터전",
  시주:"태어난 시의 두 글자 — 자녀·미래·말년",
  년주:"태어난 해의 두 글자 — 조상·뿌리·어린 시절"};
let _seen = new Set();
function term(k){ if(_seen.has(k)||!GLOSS[k]) return `<b>${k}</b>`; _seen.add(k); return `<b>${k}</b><span class="gl">(${GLOSS[k]})</span>`; }
const jEul = s=>s+(jongType(s)?"을":"를");
const jRo = s=>s+(jongType(s)===1?"으로":"로");
const careFirst = c => c.split(".")[0].trim()+".";
const jYa = s=>s+(jongType(s)?"이야":"야");
const jGa2 = s=>(jongType(s.replace(/<[^>]+>/g,""))?"이":"가");
const conf = l => `<span class="cf cf-${l}">${{high:"확신 높음",mid:"확신 중간",low:"확신 낮음"}[l]}</span>`;
const para = arr => arr.filter(Boolean).map(t=>`<p>${t}</p>`).join("");
const li = arr => `<ul class="clean">${arr.filter(Boolean).map(t=>`<li>${t}</li>`).join("")}</ul>`;

/* ---------------- 십성별 운의 발현 ---------------- */
const TG = {
 비견:{kw:["독립","자기주도","동료"],money:"수입은 내 힘으로 만들지만 나눠 쓸 일도 같이 생겨",career:"독립·이직·내 일 하고 싶은 마음이 커져",
   love:"친구 같은 편한 인연이 오는데, 경쟁자가 끼기도 해",health:"과로와 근육 뭉침을 조심해",rel:"동료·친구가 늘고 내 편이 생겨",
   ev:"독립, 동업 제안, 형제·친구 일로 돈이 나가는 일",up:"내 이름을 걸고 하는 일",good:"혼자 책임지는 구조를 만들기",bad:"동업·보증·돈 빌려주기"},
 겁재:{kw:["경쟁","승부","지출"],money:"큰 지출과 투자 손실 위험이 커져",career:"경쟁에서 이기면 자리를 따내",
   love:"삼각관계나 라이벌이 끼어들기 쉬워",health:"다툼이나 부상을 조심해",rel:"배신감이나 갈등을 겪기 쉬워",
   ev:"경쟁 PT·입찰, 돈 거래 사고, 파트너와의 분쟁",up:"경쟁 무대에서 실력으로 승부",good:"자금은 분리하고 계약서는 꼭 쓰기",bad:"충동 투자, 남의 돈으로 하는 승부"},
 식신:{kw:["재능","여유","생산"],money:"재능으로 꾸준히 버는 수입이 생겨",career:"전문성을 쌓고 결과물로 인정받아",
   love:"편안하고 다정한 연애가 이어져",health:"먹는 복이 과해서 체중·소화를 챙겨야 해",rel:"베푸는 만큼 사람이 모여",
   ev:"취미가 일이 되는 일, 자격 취득, (여성) 임신·출산",up:"한 분야를 깊게 파기",good:"꾸준한 생산 루틴 만들기",bad:"게으름·현실 안주"},
 상관:{kw:["표현","변화","반항"],money:"아이디어로 돈이 들어오지만 기복이 커",career:"이직·퇴사·독립 충동이 생기고 윗사람과 부딪혀",
   love:"표현은 늘지만 (여성은) 연인·남편과 마찰이 생기기 쉬워",health:"신경과민과 호흡기를 챙겨",rel:"말 한마디로 생기는 갈등",
   ev:"퇴사, 구설수, 창작물 히트, 소송",up:"콘텐츠·기획 결과물로 이름 알리기",good:"말 대신 결과물로 증명하기",bad:"감정적인 사표, 공개 저격"},
 편재:{kw:["기회","확장","활동"],money:"큰돈이 오가고 투자 기회가 생겨",career:"영업·사업 확장, 바깥 활동이 많아져",
   love:"(남성) 이성운이 활발해지고 활동적인 만남이 늘어",health:"무리한 일정과 과로를 조심해",rel:"인맥이 넓어져",
   ev:"사업 시작, 투자, 이사·출장, 아버지 관련 일",up:"판을 키우는 확장",good:"현금 흐름을 관리하면서 키우기",bad:"몰빵 투자, 무리한 대출"},
 정재:{kw:["안정","저축","성실"],money:"고정 수입이 늘고 저축이 쌓여",career:"안정된 직장, 연봉 상승",
   love:"(남성) 결혼운이 들어오고 현실적인 만남이 이어져",health:"규칙적인 생활 덕에 안정적이야",rel:"실속 있는 관계",
   ev:"취업, 연봉 협상, 결혼, 내 집 마련 준비",up:"자산 기반 다지기",good:"적금·장기 계획",bad:"지나치게 아끼다 기회를 놓치는 것"},
 편관:{kw:["압박","도전","권한"],money:"책임이 커지는 만큼 지출·벌금도 따라와",career:"힘든 프로젝트, 승진 시험대, 이직 압박",
   love:"(여성) 강렬한 이성이 나타나고, (남성) 직장 스트레스가 연애로 번져",health:"사고·수술·과로를 특히 조심해",rel:"권력자·라이벌과의 긴장",
   ev:"조직 개편, 법적 문제, 갑작스러운 사건",up:"위기를 넘기며 권한 획득",good:"규칙을 지키고 체력 관리",bad:"정면 충돌, 무리한 강행"},
 정관:{kw:["인정","자리","명예"],money:"월급과 직급이 올라",career:"승진·합격·공채에 유리해",
   love:"(여성) 결혼운, 진지한 만남이 들어와",health:"비교적 안정적이야",rel:"윗사람에게 인정받아",
   ev:"합격, 승진, 계약, 결혼",up:"공식 타이틀 얻기",good:"자격·시험에 도전",bad:"체면 때문에 기회를 포기하는 것"},
 편인:{kw:["전환","직관","공부"],money:"수입이 정체되고 생각만 많아지기 쉬워",career:"전공·분야 전환, 연구, 특수 기술",
   love:"외로움을 타거나 관계에 거리가 생겨",health:"불면·우울 같은 신경성 증상을 챙겨",rel:"고독, 소수와 깊은 관계",
   ev:"자격증, 유학, 진로 변경, 종교·철학에 관심",up:"특수 기술 습득",good:"새 기술 배우기",bad:"고립·잠수"},
 정인:{kw:["도움","문서","배움"],money:"문서(계약·부동산)로 이득을 봐",career:"학위·자격 취득, 윗사람의 후원",
   love:"보살핌 받는 연애",health:"몸이 회복되는 시기야",rel:"귀인을 만나고 어머니의 도움이 있어",
   ev:"합격, 계약, 이사, 부동산 문서",up:"자격·학위",good:"배움에 투자",bad:"의존하며 실행을 미루기"}};
const GROUPS5 = ["비겁","식상","재성","관성","인성"];
const GROUP_FIELD = {비겁:["독립·자기 일","돈 관리·협업"],식상:["표현·재능·창작","조직 생활·윗사람"],재성:["돈·활동·사업","공부·문서"],
  관성:["직장·명예·자리","자유·건강"],인성:["공부·자격·귀인","실행·표현"]};
const YOUTH = {비겁:"또래 관계가 중요해지고 고집이 생기는 시기",식상:"끼와 재능이 드러나는 시기 — 예체능·말하기에 두각",
  재성:"현실 감각이 일찍 트이고 집안 경제의 변화를 겪기 쉬운 시기",관성:"규칙·성적 압박이 크고 책임감이 일찍 생기는 시기",
  인성:"공부운과 부모의 보살핌이 좋은 시기"};
const EL_HEALTH = [
  {sys:"간·담·눈·근육·신경",stress:"두통·어깨 결림·눈 피로",pat:"피로가 쌓이면 짜증이 늘고 눈이 먼저 지쳐"},
  {sys:"심장·혈관·혈압·소장",stress:"가슴 두근거림·열감·불면",pat:"흥분했다 확 지치는 번아웃이 반복돼"},
  {sys:"위장·비장·소화기·당",stress:"소화불량·위염·폭식이나 입맛 상실",pat:"걱정이 많아지면 바로 위가 탈이 나"},
  {sys:"폐·기관지·대장·피부",stress:"피부 트러블·비염·변비나 장 트러블",pat:"참는 감정이 피부와 호흡기로 올라와"},
  {sys:"신장·방광·생식기·호르몬·귀",stress:"수면 패턴 붕괴·냉증·호르몬 불균형",pat:"지치면 무기력해지고 잠으로 도망가"}];
const EL_FIELD = ["교육·출판·패션·디자인·환경·의류","미디어·IT·뷰티·조명·에너지·엔터","부동산·건설·중개·농업·컨설팅·공공",
  "금융·법·기계·의료기기·IT 하드웨어·보안","무역·유통·물류·관광·연구·음료·수산"];
const EL_LOOK = ["키가 크고 마른 편, 단정하고 곧은 인상","밝고 표정이 풍부한, 눈에 띄는 인상","듬직하고 편안한, 믿음직한 인상",
  "이목구비가 또렷하고 깔끔한, 세련된 인상","부드럽고 감성적인, 차분한 인상"];
const GYEOK_TXT = {
  정관격:"원칙과 신뢰로 올라가는 설계도야. 조직 안에서 인정받고 자리를 잡는 게 인생의 정공법이고, 체면과 명예를 중요하게 여겨.",
  편관격:"압박을 이겨 내며 권한을 쥐는 설계도야. 위기에 강하고 카리스마가 있지만, 그만큼 인생에 시험대가 자주 찾아와.",
  정재격:"성실하게 쌓아 올리는 설계도야. 안정된 수입과 꼼꼼한 관리로 재산을 만들고, 현실 감각이 무기야.",
  편재격:"판을 크게 벌이는 설계도야. 사람과 돈을 굴리는 감각이 있어 사업·영업에 강하지만 기복도 커.",
  식신격:"재능으로 먹고사는 설계도야. 한 가지를 깊게 파서 전문가가 되면 돈과 여유가 함께 와.",
  상관격:"틀을 깨는 설계도야. 말·아이디어·창작으로 승부하고, 남이 만든 규칙보다 내 방식이 맞아.",
  정인격:"배움과 인정으로 크는 설계도야. 학문·자격·문서가 힘이 되고, 윗사람과 귀인의 도움을 잘 받아.",
  편인격:"남다른 직관과 특수 기술의 설계도야. 비주류·전문 분야에서 독보적인 자리를 만들 수 있어.",
  건록격:"자수성가의 설계도야. 물려받기보다 내 손으로 일구고, 독립심과 자기 관리가 무기야.",
  양인격:"칼을 쥔 장수의 설계도야. 승부욕과 결단력이 대단하고, 경쟁이 치열한 곳에서 오히려 빛나.",
  월겁격:"경쟁 속에서 크는 설계도야. 동료이자 라이벌이 많은 환경에서 버티며 실력을 키워."};

/* ---------------- 원국 분석 ---------------- */
function analyze(r, gender){
  const P = r.pillars, ds = P.day.s, de = STEM_EL(ds);
  const pos = ["hour","day","month","year"].filter(k=>P[k]);
  const chars = [];
  pos.forEach(k=>{ chars.push({k,kind:"s",v:P[k].s,el:STEM_EL(P[k].s)}); chars.push({k,kind:"b",v:P[k].b,el:BR_EL[P[k].b]}); });
  const cnt=[0,0,0,0,0]; chars.forEach(c=>cnt[c.el]++);
  const ten={}; pos.forEach(k=>{ ten[k]={ s:k==="day"?null:TEN[SAJU.tenGod(ds,P[k].s)], b:TEN[SAJU.tenGod(ds,BR_MAIN[P[k].b])] }; });
  const gcnt={비겁:0,식상:0,재성:0,관성:0,인성:0}, tcnt={};
  pos.forEach(k=>["s","b"].forEach(x=>{ const t=ten[k][x]; if(!t) return; gcnt[TEN_GROUP[TEN.indexOf(t)]]++; tcnt[t]=(tcnt[t]||0)+1; }));
  const T = t => tcnt[t]||0;
  // 강약: 득령·득지·득세
  const W={year:{s:1,b:1},month:{s:1,b:3},day:{s:0,b:1.5},hour:{s:1,b:1}};
  let sup=0,tot=0; const wcnt=[0,0,0,0,0];
  const isSup = e => e===de || e===(de+4)%5;
  pos.forEach(k=>[["s",STEM_EL(P[k].s)],["b",BR_EL[P[k].b]]].forEach(([x,e])=>{
    const w=W[k][x]; wcnt[e]+=(k==="day"&&x==="s")?1:w; if(!w) return; tot+=w; if(isSup(e)) sup+=w; }));
  const ratio=sup/tot;
  const strength = ratio>=0.62?"신강":ratio>=0.52?"약간 신강":ratio>0.42?"중화":ratio>0.3?"약간 신약":"신약";
  const strongSide = ratio>0.52, weakSide = ratio<=0.42;
  const deukryeong = isSup(BR_EL[P.month.b]), deukji = isSup(BR_EL[P.day.b]);
  let others=0, othersSup=0; pos.forEach(k=>["s","b"].forEach(x=>{ if((k==="day")||(k==="month"&&x==="b")) return; others++; if(isSup(x==="s"?STEM_EL(P[k].s):BR_EL[P[k].b])) othersSup++; }));
  const deukse = othersSup*2 >= others;
  // 용신·희신·기신·구신·한신
  const relEl = g => (de+GROUPS5.indexOf(g))%5;
  const mb=P.month.b, winter=[11,0,1].includes(mb), summer=[5,6,7].includes(mb);
  let yongG, reason;
  if(strongSide){
    yongG = ["식상","재성","관성"].sort((a,b)=>wcnt[relEl(a)]-wcnt[relEl(b)])[0];
    reason = `나를 돕는 기운이 ${Math.round(ratio*100)}%로 넉넉해서, 남는 힘을 밖으로 빼 줄 ${yongG} 쪽 기운이 필요해.`;
  } else if(weakSide){
    const heavy=["식상","재성","관성"].sort((a,b)=>wcnt[relEl(b)]-wcnt[relEl(a)])[0];
    yongG = heavy==="재성"?"비겁":"인성";
    reason = `나를 돕는 기운이 ${Math.round(ratio*100)}%로 적고 ${heavy} 쪽이 무거워서, 나를 받쳐 줄 ${yongG} 기운이 필요해.`;
  } else {
    const need = winter?1:summer?4:wcnt.indexOf(Math.min(...wcnt));
    yongG = GROUPS5[mod(need-de,5)];
    reason = winter?"균형은 잡혀 있는데 추운 계절에 태어나서, 데워 줄 화(火) 기운이 가장 반가워(조후).":
             summer?"균형은 잡혀 있는데 더운 계절에 태어나서, 식혀 줄 수(水) 기운이 가장 반가워(조후).":
             "기운이 고르게 잡혀 있어서, 가장 부족한 오행을 채우는 쪽이 약이 돼.";
  }
  const yongEl = relEl(yongG);
  const heeEl = mod(yongEl-1,5), giEl = mod(yongEl+3,5), guEl = mod(yongEl+2,5), hanEl = mod(yongEl+1,5);
  let johu=null;
  if(winter && cnt[1]===0 && yongEl!==1) johu="추운 계절생인데 원국에 화(火)가 없어서, 따뜻한 기운(햇볕·운동·붉은 색)을 보조로 꼭 챙겨.";
  if(summer && cnt[4]===0 && yongEl!==4) johu="더운 계절생인데 원국에 수(水)가 없어서, 식혀 주는 기운(물·휴식·검은 색)을 보조로 꼭 챙겨.";
  // 격국: 월지 지장간 중 천간에 투출된 것(정기>중기>여기), 없으면 정기
  const stemsShown = pos.filter(k=>k!=="day").map(k=>P[k].s);
  const jj = JIJANG[mb].slice().reverse();
  const tou = jj.find(s=>stemsShown.includes(s));
  const gStem = tou!=null?tou:BR_MAIN[mb];
  let gTen = TEN[SAJU.tenGod(ds,gStem)];
  let gyeok = gTen+"격";
  if(gTen==="비견") gyeok="건록격";
  if(gTen==="겁재") gyeok = ds%2===0 ? "양인격" : "월겁격";
  const gyeokWhy = tou!=null ? `월지 ${BR[mb]} 속 ${STEM[gStem]}(${STEMH[gStem]})${jongType(STEM[gStem])?"이":"가"} 천간에 드러나 있어서` : `월지 ${BR[mb]}의 본기(${STEM[gStem]})를 기준으로`;
  // 신살
  const sinsal={}; pos.forEach(k=>sinsal[k]=[]);
  const add=(k,n)=>{ if(!sinsal[k].includes(n)) sinsal[k].push(n); };
  pos.forEach(k=>{ const b=P[k].b;
    if(GWIN[ds].includes(b)) add(k,"천을귀인");
    if(MUNCHANG[ds]===b) add(k,"문창귀인");
    if(YANGIN[ds]===b) add(k,"양인");
    [P.year.b,P.day.b].forEach(bb=>{ const f=frameOf(bb); if(DOHWA[f]===b) add(k,"도화"); if(YEOKMA[f]===b) add(k,"역마"); if(HWAGAE[f]===b) add(k,"화개"); });
    if(["갑진","을미","병술","정축","무진","임술","계축"].includes(SAJU.gzName(P[k]))) add(k,"백호"); });
  if(["경진","경술","임진","임술","무술"].includes(SAJU.gzName(P.day))) add("day","괴강");
  const s12={}; pos.forEach(k=>s12[k]=sinsal12(P.year.b,P[k].b));
  const allSinsal=[...new Set(pos.flatMap(k=>sinsal[k]))];
  const has = n => allSinsal.includes(n);
  // 합충
  const rel=[];
  for(let i=0;i<pos.length;i++) for(let j=i+1;j<pos.length;j++){
    const a=pos[i], b=pos[j], A=P[a], B=P[b], sk=key2(A.s,B.s), bk=key2(A.b,B.b);
    if(STEM_HAP[sk]!=null) rel.push({t:"천간합",a,b,txt:`${STEM[A.s]}${STEM[B.s]}합`});
    if(STEM_CHUNG.has(sk)) rel.push({t:"천간충",a,b,txt:`${STEM[A.s]}${STEM[B.s]}충`});
    if(BR_HAP[bk]!=null) rel.push({t:"육합",a,b,txt:`${BR[A.b]}${BR[B.b]}합`});
    if(BR_CHUNG(A.b)===B.b) rel.push({t:"충",a,b,txt:`${BR[A.b]}${BR[B.b]}충`});
    if(BR_HYEONG.has(bk)) rel.push({t:"형",a,b,txt:`${BR[A.b]}${BR[B.b]}형`});
    if(A.b===B.b && SELF_HYEONG.has(A.b)) rel.push({t:"형",a,b,txt:`${BR[A.b]}${BR[B.b]} 자형`});
    if(BR_WONJIN.has(bk)) rel.push({t:"원진",a,b,txt:`${BR[A.b]}${BR[B.b]} 원진`});
  }
  const brs=pos.map(k=>P[k].b);
  SAMHAP.forEach(([s,w,g,e])=>{ const h=[s,w,g].map(x=>brs.includes(x));
    if(h.every(Boolean)) rel.push({t:"삼합",el:e,txt:`${BR[s]}${BR[w]}${BR[g]} ${EL[e]}국 삼합`});
    else if(h[1]&&(h[0]||h[2])) rel.push({t:"반합",el:e,txt:`${h[0]?BR[s]+BR[w]:BR[w]+BR[g]} 반합(${EL[e]})`}); });
  const relHit = (t,k) => rel.some(x=>x.t===t && (x.a===k||x.b===k));
  const male = gender==="m";
  const spouseG = male?"재성":"관성", childG = male?"관성":"식상";
  const spouseEl = relEl(spouseG);
  const spread = Math.max(...cnt)-Math.min(...cnt);
  return {P,pos,chars,cnt,wcnt,ten,gcnt,tcnt,T,ratio,strength,strongSide,weakSide,deukryeong,deukji,deukse,
    yongG,yongEl,heeEl,giEl,guEl,hanEl,reason,johu,gyeok,gyeokWhy,gTen,sinsal,s12,allSinsal,has,rel,relHit,
    ds,de,male,spouseG,childG,spouseEl,winter,summer,spread,relEl};
}

/* ---------------- 운 분석(대운·세운 공용) ---------------- */
function luck(A, g){
  const P=A.P, ds=A.ds;
  const ts=TEN[SAJU.tenGod(ds,g.s)], tb=TEN[SAJU.tenGod(ds,BR_MAIN[g.b])];
  const gs=TEN_GROUP[TEN.indexOf(ts)], gb=TEN_GROUP[TEN.indexOf(tb)];
  const se=STEM_EL(g.s), be=BR_EL[g.b];
  let score=3;
  const elScore = (e,w)=>{ if(e===A.yongEl) score+=w; else if(e===A.heeEl) score+=w*0.6; else if(e===A.giEl) score-=w; else if(e===A.guEl) score-=w*0.5; };
  elScore(se,0.7); elScore(be,1);
  const ev=[]; // {t:good|bad, k, d}
  const PN={hour:"시지",day:"일지",month:"월지",year:"년지"};
  const CH_TXT={day:"가까운 관계·집·몸에 변동 — 이사, 연애·결혼 생활의 변화, 건강 이슈로 나타나기 쉬워",
    month:"일터와 환경이 흔들려 — 부서 이동, 이직, 직업 변경으로 나타나기 쉬워",
    year:"집안·바깥 소속의 변동 — 부모님 일, 해외·먼 이동, 소속 변경으로 나타나기 쉬워",
    hour:"계획·자녀·아랫사람 쪽 변동 — 진로 계획 수정, 자녀 일, 부하 직원 문제로 나타나기 쉬워"};
  A.pos.forEach(k=>{ const b=P[k].b;
    if(BR_CHUNG(g.b)===b){ score-= k==="day"?0.7:k==="month"?0.5:0.25; ev.push({t:"bad",k:PN[k]+"충",d:`${PN[k]}와 충 — ${CH_TXT[k]}.`}); }
    if(BR_HAP[key2(g.b,b)]!=null && k==="day"){ score+=0.4; ev.push({t:"good",k:"일지합",d:"일지와 합 — 인연이 들어오고 관계가 깊어져. 연애·결혼·동업 같은 '묶임'이 생기기 쉬워."}); }
    if(BR_HYEONG.has(key2(g.b,b)) && (k==="day"||k==="month")){ score-=0.2; ev.push({t:"bad",k:PN[k]+"형",d:`${PN[k]}와 형 — 서류·법적 문제, 수술·시술, 인간관계 마찰을 조심해.`}); }
    if(BR_WONJIN.has(key2(g.b,b)) && k==="day") ev.push({t:"bad",k:"원진",d:"일지와 원진 — 가까운 사람과 이유 없는 서운함이 쌓이기 쉬워."});
  });
  if(STEM_HAP[key2(g.s,ds)]!=null) ev.push({t:"good",k:"일간합",d:"일간과 합 — 나를 끌어당기는 일이나 사람이 생겨. 묶이는 만큼 책임도 같이 와."});
  if(STEM_CHUNG.has(key2(g.s,ds))){ score-=0.25; ev.push({t:"bad",k:"일간충",d:"일간과 충 — 생각과 다른 상황에 정면으로 부딪히기 쉬워."}); }
  if(GWIN[ds].includes(g.b)){ score+=0.3; ev.push({t:"good",k:"천을귀인",d:"천을귀인이 들어와 — 막힐 때 도와주는 사람이 나타나."}); }
  const yf=[frameOf(P.year.b),frameOf(P.day.b)];
  const yeokma = yf.some(f=>YEOKMA[f]===g.b), dohwa = yf.some(f=>DOHWA[f]===g.b);
  if(yeokma) ev.push({t:"",k:"역마",d:"역마가 들어와 — 이사·출장·해외처럼 몸이 움직이는 일이 생겨."});
  if(dohwa) ev.push({t:"",k:"도화",d:"도화가 들어와 — 인기와 이성 인연이 늘어."});
  const favor = [se,be].filter(e=>e===A.yongEl||e===A.heeEl).length, unfavor=[se,be].filter(e=>e===A.giEl||e===A.guEl).length;
  score=Math.max(1,Math.min(5,Math.round(score*2)/2));
  const spouse = gs===A.spouseG||gb===A.spouseG;
  return {g,ts,tb,gs,gb,se,be,score,ev,favor,unfavor,yeokma,dohwa,spouse,
    chung:k=>BR_CHUNG(g.b)===P[k].b, hapDay:BR_HAP[key2(g.b,P.day.b)]!=null};
}
const starStr = s => "★".repeat(Math.floor(s))+(s%1?"☆":"")+"·".repeat(5-Math.ceil(s));
const moodOf = s => s>=4.5?"순풍이 강하게 부는":s>=3.5?"순풍이 부는":s>=2.5?"평탄하지만 변수가 있는":s>=1.5?"맞바람이 부는":"거센 역풍이 부는";
function dwAt(r, age){ let d=null; r.daewoon.list.forEach(x=>{ if(x.age<=age) d=x; }); return d; }

/* ---------------- 렌더 ---------------- */
function tileHTML(g,part,isMe){
  if(!g) return `<div class="tile none"><div class="h">?</div><div class="k">모름</div></div>`;
  const v=part==="s"?g.s:g.b, e=part==="s"?STEM_EL(v):BR_EL[v];
  const yy=part==="s"?(v%2?"음":"양"):(SAJU.BR_YANG[v]?"양":"음");
  return `<div class="tile e${e}${isMe?" me":""}"><div class="h">${part==="s"?STEMH[v]:BRH[v]}</div><div class="k">${part==="s"?STEM[v]:BR[v]} · ${yy}${EL[e]}</div></div>`;
}
function fmtDT(ms){ const d=new Date(ms+9*3600e3); return `${d.getUTCFullYear()}.${d.getUTCMonth()+1}.${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`; }
const elName = e => `${EL[e]}(${ELH[e]})`;
const STEPS = ["만세력 판독","원국 핵심 구조","평생 총운","금전운","직업운","연애운","결혼운","건강운","인간관계·가족운","대운 분석","세운 분석","현실 조언"];
const stepHead = (i,hj,sub) => `<section class="card step" id="s${i}"><div class="stepno">${i}단계</div><h2>${STEPS[i-1]} <span class="hj">${hj}</span></h2>${sub?`<p class="sub">${sub}</p>`:""}`;

function render(r, meta){
  _seen = new Set();
  const A = analyze(r, meta.g), P = A.P, dm = DAY[A.ds];
  const today=new Date(), thisYear=today.getFullYear(), birthY=meta.y;
  const kAge = y => y-birthY+1;
  const callName = meta.name ? esc(meta.name) : "너";
  const PN={hour:"시주",day:"일주",month:"월주",year:"년주"};
  const POSA={hour:"자녀·미래·말년",day:"나·배우자",month:"부모·사회·일터",year:"뿌리·조상·어린 시절"};
  const ORDER=["hour","day","month","year"];
  const gsorted = GROUPS5.slice().sort((a,b)=>A.gcnt[b]-A.gcnt[a]);
  const top=gsorted[0], most=A.cnt.indexOf(Math.max(...A.cnt));
  const missing=A.cnt.map((c,i)=>c===0?i:-1).filter(i=>i>=0);
  const many=A.cnt.map((c,i)=>c>=3&&c>=A.chars.length*0.375?i:-1).filter(i=>i>=0);
  const G=A.gcnt, T=A.T;
  // 연도별 운 (출생~+90)
  const years=[]; for(let y=birthY; y<=Math.max(birthY+90,thisYear+20); y++){ const age=kAge(y), d=dwAt(r,age);
    const L=luck(A,SAJU.yearGz(y)), D=d?luck(A,d.gz):null;
    const inter=[];
    if(d){ if(BR_CHUNG(L.g.b)===d.gz.b) inter.push("대운 지지와 세운 지지가 충돌해 변동이 두 배로 커져");
      if(L.g.i===d.gz.i) inter.push("대운과 같은 글자가 와서(복음) 그 대운의 성격이 극대화돼");
      if(STEM_HAP[key2(L.g.s,d.gz.s)]!=null) inter.push("대운 천간과 합해 흐름이 한쪽으로 묶여"); }
    const comb = D? Math.round((L.score*0.6+D.score*0.4)*2)/2 : L.score;
    years.push({y,age,d,L,D,comb,inter}); }
  const Y = y => years[y-birthY];
  const dwList = r.daewoon.list;
  const curDw = dwAt(r,kAge(thisYear));
  let h="";
  if(meta.shared) h+=`<div class="banner">🔗 친구가 보낸 사주 결과야. 내 사주도 궁금하면 맨 아래 <b>내 사주 보기</b>를 눌러 봐.</div>`;

  /* ===== 요약 히어로 + 목차 ===== */
  h+=`<section class="card"><div class="hero"><div class="big">${dm.e}</div><div>
    <p class="sub" style="margin:0">${callName==="너"?"너는":jNeun(callName)}</p>
    <h2>${ILJU[P.day.i][0]} <span class="hj">${SAJU.gzHan(P.day)}</span></h2>
    <p style="margin:4px 0 0">${STEM[A.ds]}${EL[A.de]} 일간 · ${A.gyeok} · ${dm.kw}</p>
    <div class="chips"><span class="chip red">${A.strength}</span><span class="chip">${elName(most)} 최다</span>
    ${missing.map(i=>`<span class="chip">${elName(i)} 없음</span>`).join("")}<span class="chip">용신 ${elName(A.yongEl)}</span></div></div></div>
    <nav class="toc">${STEPS.map((s,i)=>`<a href="#s${i+1}">${i+1}. ${s}</a>`).join("")}</nav>
    <p class="hint" style="margin-top:10px">순서: 타고난 구조(1~2) → 인생 흐름(3) → 분야별 풀이(4~9) → 시기별 정리(10~11) → 핵심 결론(12). 판단마다 확신 정도를 표시했어.</p></section>`;

  /* ===== 1. 만세력 판독 ===== */
  h+=stepHead(1,"命式",`${term("일간")}을 중심으로 본 여덟 글자와 그 속성`);
  h+=`<div class="who">${meta.name?`<span><b>${esc(meta.name)}</b></span>`:""}<span>${A.male?"남":"여"}</span><span>양력 <b>${meta.solarStr}</b></span><span>음력 ${meta.lunarStr}</span><span>${ZODIAC[P.year.b]}띠</span></div>`;
  h+=`<div class="pillars"><div></div>${ORDER.map(k=>`<div class="ch">${PN[k]}<small>${{hour:"時",day:"日 · 나",month:"月",year:"年"}[k]}</small></div>`).join("")}`;
  const row=(lab,f)=>`<div class="rh">${lab}</div>${ORDER.map(k=>P[k]?f(k):`<div class="cell">-</div>`).join("")}`;
  h+=row("십성",k=>`<div class="cell ten">${k==="day"?"<span style='color:var(--seal)'>나</span>":A.ten[k].s}</div>`);
  h+=`<div class="rh">천간</div>${ORDER.map(k=>tileHTML(P[k],"s",k==="day")).join("")}`;
  h+=`<div class="rh">지지</div>${ORDER.map(k=>tileHTML(P[k],"b",false)).join("")}`;
  h+=row("십성",k=>`<div class="cell ten">${A.ten[k].b}</div>`);
  h+=row("지장간",k=>`<div class="cell minihj">${JIJANG[P[k].b].map(s=>`<span class="e-c${STEM_EL(s)}">${STEMH[s]}</span>`).join(" ")}</div>`);
  h+=row("12운성",k=>`<div class="cell">${UNSEONG[SAJU.unseong(A.ds,P[k].b)]}</div>`);
  h+=row("12신살",k=>`<div class="cell">${A.s12[k]}</div>`);
  h+=row("귀인·살",k=>`<div class="cell">${A.sinsal[k].length?A.sinsal[k].map(s=>`<span class="tag ${SINSAL[s].t}">${s}</span>`).join(""):"-"}</div>`);
  h+=`</div>`;
  const shift=Math.round(r.solarShift);
  h+=`<table class="tbl"><tbody>
    <tr><th>출생</th><td>양력 ${meta.solarStr} / 음력 ${meta.lunarStr} · ${A.male?"남성":"여성"}</td></tr>
    <tr><th>시간 보정</th><td>${r.timeKnown?`입력 ${String(meta.hh).padStart(2,"0")}:${String(meta.mi).padStart(2,"0")}${r.offset.dst?" (서머타임 −1시간)":""} → 진태양시 ${String(r.solar.h).padStart(2,"0")}:${String(r.solar.mi).padStart(2,"0")} (${meta.city} 기준 ${shift>0?"+":""}${shift}분)`:"<b>출생 시각 모름</b> — 시주 누락, 자녀·말년·시주 관련 판단은 확신도를 낮춰서 봐"}</td></tr>
    <tr><th>절입 기준</th><td>${r.jie.prev.name} ${fmtDT(r.jie.prev.ms)} 이후 출생 (다음 ${r.jie.next.name} ${fmtDT(r.jie.next.ms)})</td></tr>
    <tr><th>오행 개수</th><td>${A.cnt.map((c,i)=>`<span class="e-c${i}"><b>${EL[i]}</b> ${c}</span>`).join(" · ")}</td></tr>
    <tr><th>대운</th><td>대운수 ${r.daewoon.start} (${r.daewoon.forward?"순행":"역행"}) · ${dwList.slice(0,9).map(d=>`${d.age}${SAJU.gzName(d.gz)}`).join(" ")}</td></tr>
    <tr><th>귀인·살</th><td>${A.allSinsal.length?A.allSinsal.join(", "):"두드러진 것 없음"}</td></tr>
    </tbody></table>
    <p class="hint">${term("십성")} · ${term("지장간")} · ${term("12운성")} · ${term("12신살")}(년지 ${BR[P.year.b]} 기준)</p></section>`;

  /* ===== 2. 원국 핵심 구조 ===== */
  const unD = SAJU.unseong(A.ds,P.day.b);
  const MONTH_SEASON = ["한겨울(자월)의 차가운 물기운","늦겨울(축월)의 언 땅","초봄(인월)의 막 싹트는 나무","봄(묘월)의 한창인 나무","늦봄(진월)의 축축한 흙",
    "초여름(사월)의 달아오르는 불","한여름(오월)의 뜨거운 불","늦여름(미월)의 메마른 흙","초가을(신월)의 단단한 쇠","가을(유월)의 날 선 쇠","늦가을(술월)의 마른 흙","초겨울(해월)의 차가운 물"];
  const themes=[];
  if(A.has("역마")||A.relHit("충","day")||A.relHit("충","month")) themes.push({p:3,t:"<b>변동과 이동</b> — 한 자리에 오래 머무르기보다 환경이 자주 바뀌고, 바뀔 때마다 한 단계씩 올라가는 패턴"});
  if(G.관성>=3) themes.push({p:3,t:"<b>책임과 압박</b> — 늘 무언가를 짊어지고, 그걸 버텨 내는 걸로 인정받는 패턴"});
  if(G.관성===0) themes.push({p:2,t:"<b>내 규칙대로</b> — 남이 정한 틀에 들어가면 답답하고, 내 방식을 만들 때 살아나는 패턴"});
  if(G.재성>=3) themes.push({p:3,t:`<b>돈과 현실</b> — 인생의 큰 선택이 늘 '현실적으로 남는가'로 귀결되는 패턴${A.weakSide?" (다 잡기엔 체력이 모자란 게 숙제)":""}`});
  if(G.재성===0) themes.push({p:2,t:"<b>돈 관리의 숙제</b> — 버는 능력과 별개로 관리 체계가 없어 손에 남지 않는 패턴"});
  if(G.식상>=3) themes.push({p:3,t:"<b>표현과 자유</b> — 말·재능으로 치고 나가지만 그만큼 구설과 윗사람 마찰이 따라오는 패턴"});
  if(G.식상===0) themes.push({p:2,t:"<b>속으로 삼키기</b> — 생각과 실력에 비해 드러내는 힘이 약해 저평가되는 패턴"});
  if(G.인성>=3) themes.push({p:2,t:"<b>생각과 의존</b> — 배우고 준비하는 데는 강하지만 실행 타이밍을 놓치는 패턴"});
  if(G.인성===0) themes.push({p:2,t:"<b>홀로서기</b> — 기댈 곳 없이 스스로 해결하며 단단해지는 패턴"});
  if(G.비겁>=3) themes.push({p:2,t:"<b>자존심과 경쟁</b> — 내 사람·내 방식에 대한 고집이 강하고, 사람으로 인해 돈이 들고 나는 패턴"});
  if(A.has("화개")) themes.push({p:1,t:"<b>고독한 몰입</b> — 혼자 있는 시간에 깊어지고, 예술·학문·영성에 끌리는 패턴"});
  if(A.has("도화")) themes.push({p:1,t:"<b>사람을 끄는 매력</b> — 관계에서 기회가 오지만 관계 때문에 흔들리기도 하는 패턴"});
  if(A.has("천을귀인")) themes.push({p:1,t:"<b>귀인의 손길</b> — 결정적인 순간마다 도와주는 사람이 나타나는 패턴"});
  if(themes.length<3) themes.push({p:0,t:`<b>${A.gyeok}의 길</b> — ${GYEOK_TXT[A.gyeok]}`});
  if(themes.length<3) themes.push({p:0,t:`<b>${dm.img}의 본성</b> — ${jGa(dm.kw)} 인생 전반에 반복되는 무기`});
  themes.sort((a,b)=>b.p-a.p);
  const emo = {비겁:"감정이 상하면 정면으로 맞서거나 아예 선을 그어 버려. 스트레스를 받으면 혼자 해결하려 들고 도움 요청을 자존심 상해해.",
    식상:"감정이 바로 말과 표정으로 나와. 스트레스를 받으면 말이 많아지거나 날카로워지고, 무언가를 만들거나 먹는 걸로 풀어.",
    재성:"감정보다 상황 판단이 먼저야. 스트레스를 받으면 일을 더 벌이거나 돈을 쓰는 걸로 풀고, 통제가 안 되는 상황을 가장 괴로워해.",
    관성:"감정을 누르고 해야 할 일부터 해. 스트레스를 받으면 책임감에 더 매달리고, 속으로 쌓아 두다가 몸으로 터져.",
    인성:"감정을 머릿속에서 오래 곱씹어. 스트레스를 받으면 생각이 많아지고 잠수를 타거나 누군가에게 기대고 싶어 해."};
  const selfEsteem = G.비겁>=2&&G.인성>=1?"스스로를 믿는 힘이 기본으로 깔려 있어. 남의 인정보다 내 기준을 통과했는지가 중요해."
    : G.관성>=2?"자존감이 '역할을 잘 해냈는지'에서 나와. 인정받을 땐 단단하지만, 실패하면 나라는 사람 전체가 무너진 것처럼 느끼기 쉬워."
    : G.식상>=2?"자존감이 '내가 표현한 것에 대한 반응'에서 나와. 칭찬엔 크게 살아나고 무시엔 크게 꺾여."
    : G.재성>=2?"자존감이 '눈에 보이는 성과'에서 나와. 통장과 결과가 쌓일수록 안정되는 구조야."
    : "자존감이 주변의 보살핌과 관계 안에서 자라. 나를 알아주는 사람이 곁에 있을 때 가장 단단해.";
  const crux = A.weakSide && G.재성>=2 ? "가장 크게 부딪히는 문제는 '욕심낸 만큼 감당할 체력이 없는 것'이야. 기회는 보이는데 다 잡다가 지치는 게 반복돼."
    : A.strongSide && G.비겁>=3 ? "가장 크게 부딪히는 문제는 '내 방식이 옳다는 확신'이야. 힘이 넘치는 만큼 남과 부딪히고, 사람과 돈이 같이 빠져나가."
    : G.관성>=3 ? "가장 크게 부딪히는 문제는 '남이 지운 짐을 내려놓지 못하는 것'이야. 책임을 다할수록 내 몫이 줄어드는 구조를 끊어야 해."
    : G.식상>=3 ? "가장 크게 부딪히는 문제는 '말과 자유'야. 재능은 넘치는데 조직과 윗사람과의 마찰이 기회를 깎아 먹어."
    : G.인성>=3 ? "가장 크게 부딪히는 문제는 '준비만 하다 끝나는 것'이야. 생각이 실행을 계속 앞질러."
    : missing.length ? `가장 크게 부딪히는 문제는 ${missing.map(elName).join("·")} 기운의 공백이야. ${missing.map(i=>ELEM[i].none.split(".")[1].trim()+".").join(" ")}`
    : "가장 크게 부딪히는 문제는 '무난함'이야. 크게 모자란 곳이 없어서 오히려 승부처를 정하지 못하고 시간이 흘러가기 쉬워.";
  h+=stepHead(2,"原局","타고난 그릇의 모양 — 성격·강약·설계도·필요한 기운");
  h+=`<h3>일간의 성질 — ${STEMH[A.ds]} ${dm.n}, ${dm.img}</h3>${para([dm.desc, `<b>${SAJU.gzName(P.day)} 일주 · ${ILJU[P.day.i][0]}</b> — ${ILJU[P.day.i][1]}`])}
    <dl class="kv"><dt>강점</dt><dd>${dm.good}</dd><dt>약점</dt><dd>${dm.care}</dd></dl>`;
  h+=`<h3>${term(A.ratio>0.52?"신강":A.ratio<=0.42?"신약":"중화")} 판단 — ${A.strength} ${conf(Math.abs(A.ratio-0.47)>0.12?"high":"mid")}</h3>
    <div class="bars"><div class="bar"><span class="lab">돕는 힘</span><div class="track"><div class="fill" style="width:${Math.round(A.ratio*100)}%;background:var(--grad)"></div></div><span class="n">${Math.round(A.ratio*100)}%</span></div></div>
    ${li([`${term("득령")}: ${A.deukryeong?"O — 태어난 달이 나를 돕는 계절이라 기본 체력이 받쳐 줘":"X — 태어난 달이 나를 빼는 계절이라 스스로 힘을 모아야 해"}`,
      `${term("득지")}: ${A.deukji?"O — 배우자 자리가 나를 받쳐 줘서 가정이 힘이 돼":"X — 앉은 자리가 나를 빼는 쪽이라 쉬어도 쉰 것 같지 않을 때가 있어"}`,
      `${term("득세")}: ${A.deukse?"O — 주변 글자 중 내 편이 많아":"X — 주변 글자가 대부분 나를 쓰는 쪽이라 바빠"}`])}
    <p>쉽게 말하면, ${A.strongSide?"에너지가 넘쳐서 밖으로 써야 건강해지는 사람이야. 할 일이 없으면 오히려 탈이 나.":A.weakSide?"에너지 총량이 적은 대신 섬세한 사람이야. 무리해서 다 하려 하면 쓰러지고, 도와줄 사람·쉴 곳을 확보할 때 실력이 나와.":"에너지 수입과 지출이 비슷한 사람이야. 무리만 안 하면 꾸준하게 오래 가."}</p>`;
  h+=`<h3>월지와 계절 — ${MONTH_SEASON[P.month.b]}</h3>
    <p>${SAJU.gzName(P.month)}월생이야. 월지는 사주에서 힘이 가장 센 자리라서 '사회에서 쓰는 주력 기운'과 '체질의 온도'를 정해. ${A.winter?"추운 계절이라 따뜻한 화(火) 기운이 들어올 때 몸과 일이 함께 풀려.":A.summer?"더운 계절이라 시원한 수(水) 기운이 들어올 때 머리가 맑아지고 일이 풀려.":"계절의 온도는 극단적이지 않아서, 계절보다는 강약 균형이 더 중요해."} 월지의 십성은 <b>${A.ten.month.b}</b>(${TEN_DESC[A.ten.month.b]})이라, 사회에선 이 모습이 가장 먼저 보여.</p>`;
  h+=`<h3>오행의 과다·과소와 균형</h3><div class="bars">${A.cnt.map((c,i)=>`<div class="bar"><span class="lab" style="color:${ELC[i]}">${EL[i]} ${ELH[i]}</span><div class="track"><div class="fill" style="width:${c/A.chars.length*100}%;background:${ELC[i]}"></div></div><span class="n">${c}개</span></div>`).join("")}</div>
    ${para([...many.map(i=>ELEM[i].many), ...missing.map(i=>ELEM[i].none)])}
    <p><b>균형감:</b> ${A.spread<=1?"다섯 기운이 고르게 퍼진 균형형이야. 크게 휘청이지 않는 대신, 승부처를 직접 정해야 해.":A.spread<=3?"한두 기운이 도드라진 개성형이야. 강한 쪽이 무기, 빈 쪽이 숙제야.":"한쪽으로 크게 쏠린 편중형이야. 잘 맞는 운이 오면 크게 터지고, 안 맞는 운엔 크게 흔들려 — 인생의 진폭이 큰 구조야."}</p>`;
  h+=`<h3>${term("격국")} — ${A.gyeok} ${conf(A.gyeokWhy.includes("드러나")?"high":"mid")}</h3><p>${A.gyeokWhy} <b>${A.gyeok}</b>으로 봐. ${GYEOK_TXT[A.gyeok]}</p>`;
  h+=`<h3>${term("용신")} · ${term("희신")} · ${term("기신")} · ${term("구신")} ${conf(A.ratio>0.62||A.ratio<0.3?"high":"mid")}</h3>
    <p>${A.reason}</p>
    <table class="tbl"><tbody>
      <tr><th>용신</th><td><b class="e-c${A.yongEl}">${elName(A.yongEl)}</b> — 가장 필요한 약. 이 기운이 오는 해에 일이 풀려</td></tr>
      <tr><th>희신</th><td><b class="e-c${A.heeEl}">${elName(A.heeEl)}</b> — 용신을 살려 주는 도우미</td></tr>
      <tr><th>기신</th><td><b class="e-c${A.giEl}">${elName(A.giEl)}</b> — 용신을 공격해. 이 기운이 강한 해엔 무리하지 말 것</td></tr>
      <tr><th>구신</th><td><b class="e-c${A.guEl}">${elName(A.guEl)}</b> — 기신을 키우는 기운</td></tr></tbody></table>
    <div class="box">🍀 용신 생활법: 색 <b>${ELEM[A.yongEl].color}</b> · 방향 <b>${ELEM[A.yongEl].dir}</b> · 숫자 <b>${ELEM[A.yongEl].num}</b> · 계절 <b>${ELEM[A.yongEl].season}</b> · 음식 ${ELEM[A.yongEl].food}</div>
    ${A.johu?`<p>${A.johu}</p>`:""}<p class="hint">억부(강약 균형) + 조후(계절 온도)로 정한 간이 판정이야. 정통 용신은 보는 사람에 따라 갈릴 수 있어.</p>`;
  h+=`<h3>인생에서 반복되는 핵심 테마</h3>${li(themes.slice(0,5).map(x=>x.t))}`;
  h+=`<h3>타고난 강점과 치명적 약점</h3>${li([`<b>강점</b> — ${dm.good}. 여기에 ${GROUP_INFO[top].m}(${top})의 힘이 더해져 ${top==="비겁"?"버티는 힘과 독립심":top==="식상"?"표현력과 창의력":top==="재성"?"현실 감각과 돈 감각":top==="관성"?"책임감과 신뢰":"배우는 힘과 통찰"}${top==="관성"?"가":"이"} 남달라.`,
     `<b>치명적 약점</b> — ${crux.replace("가장 크게 부딪히는 문제는 ","")}`])}`;
  h+=`<h3>감정 구조 · 대인관계 · 스트레스 반응</h3>${para([emo[top], A.relHit("충","day")?"가까운 사람과의 관계에서 부딪힘이 반복돼. 일지(배우자 자리)가 충을 맞아서, 친해질수록 거리 조절이 필요한 타입이야.":A.relHit("육합","day")?"한번 정 들면 깊게 엮이는 타입이야. 일지가 합으로 묶여 있어서 사람을 쉽게 못 놓아.":"관계에서 크게 부딪히는 구조는 아니야. 다만 "+careFirst(dm.care)])}`;
  h+=`<h3>자존감이 만들어지는 방식</h3><p>${selfEsteem}</p>`;
  h+=`<h3>사랑에 빠지는 방식 · 집착 포인트 · 무너지는 패턴</h3>${para([dm.love, SPOUSE_SEAT[A.ten.day.b], (T("겁재")+T("편관")>=2?"집착 포인트는 '빼앗길지 모른다'는 불안이야. 경쟁자가 보이면 갑자기 마음이 커져.":T("편인")+T("정인")>=2?"집착 포인트는 '나를 이해해 주는가'야. 정서적으로 통한다고 느낀 사람에게 깊게 기대.":"집착 포인트는 '약속과 일관성'이야. 말과 행동이 다르면 한순간에 마음이 식어."), `무너질 땐 ${A.weakSide?"혼자 다 감당하려다 한꺼번에 터지는 식":"버티다 버티다 단번에 끊어 내는 식"}이야.`])}`;
  h+=`<h3>돈을 다루는 방식 · 욕망 구조</h3><p>${G.재성===0?"돈 자체엔 큰 욕심이 없고, 필요할 때 버는 쪽이야. 현실 감각보다 의미·재미가 먼저라 관리가 숙제야.":G.재성>=3?"돈에 대한 감각과 욕심이 모두 커. 눈앞의 기회를 잘 보지만, 욕심이 체력과 시간을 넘지 않게 선을 그어야 해.":`돈 감각은 적당해. ${T("정재")?"꾸준히 모으는 정재형":"기회를 잡는 편재형"} 성향이고, ${G.식상?"재능을 돈으로 바꾸는 연결고리(식상)가 있어서 현실 감각이 좋아.":"재능과 돈 사이의 연결고리가 약해서 '내 가치를 가격으로 매기는 연습'이 필요해."}`}</p>`;
  h+=`<h3>인생에서 가장 크게 부딪히는 문제의 본질</h3><p>${crux}</p>`;
  const relLines=A.rel.map(x=>{
    if(x.t==="삼합"||x.t==="반합") return `<b>${x.txt}</b> — ${elName(x.el)} 기운이 뭉쳐 힘이 커져. ${x.t==="삼합"?"그 기운이 인생의 큰 테마가 돼.":"운에서 나머지 글자가 오면 크게 살아나."}`;
    const pair=`${jWa(PN[x.a])} ${PN[x.b]}`;
    return `<b>${x.txt}</b> — ${{천간합:`${pair}의 천간이 ${term("합")}. ${jWa(POSA[x.a])} ${POSA[x.b]} 영역이 서로 끌어당겨 협력해.`,
      천간충:`${pair}의 천간이 ${term("충")}. 겉으로 드러나는 생각이 부딪혀 결정할 때 갈등이 생겨.`,
      육합:`${pair}의 지지가 ${term("합")}. ${jWa(POSA[x.a])} ${POSA[x.b]} 영역이 손발이 잘 맞아.`,
      충:`${pair}의 지지가 ${term("충")}. ${jWa(POSA[x.a])} ${POSA[x.b]} 영역이 부딪혀 변화·이동이 잦아.`,
      형:`${pair} 사이의 ${term("형")}. 인간관계·건강·서류 일에 신중하면 오히려 실력이 돼.`,
      원진:`${pair} 사이의 ${term("원진")}. 작은 오해는 그때그때 대화로 풀어.`}[x.t]}`; });
  h+=`<h3>글자끼리의 관계 (합·충·형)</h3>${relLines.length?li(relLines):"<p>원국 안에 뚜렷한 합·충이 없어. 내부 갈등이 적어 기질이 한결같아.</p>"}
    <h3>귀인과 살</h3>${A.allSinsal.length?li(A.allSinsal.map(s=>`<b>${s}</b> (${A.pos.filter(k=>A.sinsal[k].includes(s)).map(k=>PN[k]).join("·")}) — ${SINSAL[s].d}`)):"<p>눈에 띄는 신살은 없어.</p>"}
    <h3>12신살 풀이 <span class="gl">(띠(년지) 기준으로 각 기둥에 걸린 사건·기질 패턴)</span></h3>${(()=>{const seen=[];A.pos.forEach(k=>{const n=A.s12[k];if(!n)return;const e=seen.find(x=>x.n===n);if(e)e.ks.push(k);else seen.push({n,ks:[k]});});return li(seen.map(x=>`<b>${x.n}</b> (${x.ks.map(k=>PN[k]).join("·")}) — ${SINSAL12_TXT[x.n]||"—"}`));})()}</section>`;

  /* ===== 3. 평생 총운 ===== */
  const stages=[["어린 시절",1,9],["10대",10,19],["20대",20,29],["30대",30,39],["40대",40,49],["50대",50,59],["60대 이후",60,79]];
  const palace = a => a<20?["year","년주(초년)"]:a<40?["month","월주(청년)"]:a<60?["day","일주(중년)"]:["hour","시주(말년)"];
  h+=stepHead(3,"一生","시기별 큰 흐름 — 언제 풀리고 언제 막히는지");
  h+=`<p>운은 ${term("대운")}이라는 10년 단위 계절로 바뀌어. 아래는 각 시기에 걸린 대운과 그 시기를 맡은 기둥(궁)을 겹쳐서 읽은 흐름이야.</p>`;
  stages.forEach(([nm,a,b])=>{
    const ys=years.filter(x=>x.age>=a&&x.age<=b); if(!ys.length) return;
    const dset=[...new Set(ys.map(x=>x.d?x.d.age:-1))].map(ag=>ag<0?null:dwList.find(d=>d.age===ag));
    const main = dset.reduce((m,d)=>{ const n=ys.filter(x=>(x.d?x.d.age:-1)===(d?d.age:-1)).length; return n>m.n?{d,n}:m; },{d:null,n:-1}).d;
    const mg = main?main.gz:P.month;
    const L=luck(A,mg); const avg=L.score*0.7+(ys.reduce((s,x)=>s+x.comb,0)/ys.length)*0.3;
    const [pk,pn]=palace(a); const pal=P[pk];
    const turning = dset.filter(Boolean).filter(d=>d.age>a&&d.age<=b).map(d=>`${d.age}세(${d.year}년) ${SAJU.gzName(d.gz)} 대운 시작`);
    const chungYears = ys.filter(x=>x.L.chung("day")||x.L.chung("month")).map(x=>`${x.y}(${x.age}세) ${x.L.chung("day")?"일지":"월지"}`).slice(0,3);
    const isNow = kAge(thisYear)>=a && kAge(thisYear)<=b;
    const youth = a<20;
    h+=`<details class="stage"${isNow?" open":""}><summary><b>${nm}</b> <span class="mut">${birthY+a-1}~${birthY+b-1}년</span> · ${main?SAJU.gzName(main.gz)+" 대운":"대운 전(월주 영향)"} <span class="stars">${starStr(Math.round(avg*2)/2)}</span>${isNow?' <span class="tag bad">지금</span>':""}</summary>
      <p><b>운의 색깔:</b> ${moodOf(avg)} 시기. ${L.gs}·${L.gb}의 기운 — ${TG[L.ts].kw.join("·")}.${youth?` ${YOUTH[L.gs]}.`:""}</p>
      <p><b>잘 풀리는 분야:</b> ${GROUP_FIELD[L.gs][0]}${L.gb!==L.gs?", "+GROUP_FIELD[L.gb][0]:""} / <b>막히는 분야:</b> ${GROUP_FIELD[L.gs][1]}${L.unfavor?" — 기신 기운이 섞여 있어 무리하면 손해":""}</p>
      ${youth?`<p><b>공부·가정:</b> ${{인성:"학업운이 좋고 부모·선생님의 지원을 받기 좋아.",재성:"공부보다 현실·돈에 일찍 눈을 떠. 아버지나 집안 경제의 변화가 있을 수 있어.",관성:"규칙과 성적 압박이 커. 엄한 환경에서 책임감이 일찍 자라.",식상:"끼와 재능이 드러나. 예체능·말하기에 두각을 보이지만 공부엔 흥미가 들쭉날쭉해.",비겁:"형제·친구 관계가 중요하고 자기 고집이 생겨. 경쟁심이 공부 동기가 되기도 해."}[L.gb]}</p>
        <p><b>인간관계:</b> ${TG[L.ts].rel}. <b>건강:</b> ${TG[L.ts].health}.</p>`
      :`<p><b>인간관계:</b> ${TG[L.ts].rel}. <b>돈:</b> ${TG[L.ts].money}. 바탕엔 '${TEN_KW[L.tb]}'(${L.tb}) 흐름도 깔려 있어.</p>
        <p><b>직업·사회적 위치:</b> ${TG[L.ts].career}. <b>연애·결혼:</b> ${L.spouse||L.hapDay?"배우자성/일지합이 들어와 인연과 결혼 이야기가 나오기 좋은 시기야.":TG[L.ts].love+"."}</p>
        <p><b>건강:</b> ${TG[L.ts].health}.${L.chung("day")?" 일지 충까지 겹쳐 몸의 변화가 크게 올 수 있어.":""}</p>`}
      <p><b>이 시기를 맡은 기둥:</b> ${pal?`${pn} ${SAJU.gzName(pal)} — ${pk==="hour"&&!r.timeKnown?"":UNSEONG_TXT[SAJU.unseong(A.ds,pal.b)]+"의 기운"}${A.relHit("충",pk)?", 원국에서 충을 맞아 변동이 많은 자리":A.relHit("육합",pk)?", 합으로 묶여 정이 깊은 자리":""}`:`${pn} — 시간을 몰라 판단 보류`}</p>
      <p><b>방향이 바뀌는 전환점:</b> ${[...turning, ...chungYears.map(s=>s+" 충")].join(", ")||"뚜렷한 전환점 없이 흐름이 이어져"}</p></details>`;
  });
  h+=`</section>`;

  /* ===== 4. 금전운 ===== */
  const moneyType = [
    ["월급형",T("정재")*2+T("정관")*2+T("정인")],["사업형",T("편재")*2+G.식상+(A.strongSide?2:0)+T("비견")],
    ["성과형",T("식신")+T("상관")*1.5+T("편재")],["전문직형",G.인성*1.5+T("식신")+T("정관")+(A.has("문창귀인")?1:0)],
    ["투기형",T("편재")+T("겁재")*1.5+T("상관")*0.5],["축적형",T("정재")*1.5+A.cnt[2]*0.5+T("정인")]].sort((a,b)=>b[1]-a[1]);
  const jae=G.재성;
  const holdPower = A.strongSide ? (G.비겁>=3?"버는 힘은 있는데 비겁(경쟁자·지인)이 많아 새는 구멍이 커":"돈을 감당하고 지키는 힘이 있어") : A.weakSide ? "돈을 지키는 체력이 약해서, 들어온 돈이 다른 사람·일로 빠져나가기 쉬워" : "벌고 지키는 힘이 비슷해서 관리만 하면 꾸준히 쌓여";
  const ageScore = (a,b,fn)=>{ const ys=years.filter(x=>x.age>=a&&x.age<=b); return ys.reduce((s,x)=>s+fn(x),0)/ys.length; };
  const moneyFn = x=>{ const l=x.L, d=x.D; let s=x.comb; if(l.gs==="재성"||l.gb==="재성") s+=A.weakSide?0.3:0.8; if(l.gs==="식상") s+=0.4; if(l.ts==="겁재") s-=0.6; if(d&&(d.gs==="재성"||d.gb==="재성")) s+=0.5; return s; };
  const young=ageScore(20,39,moneyFn), mid=ageScore(40,59,moneyFn);
  const dwMoney = dwList.map(d=>{ const l=luck(A,d.gz); let s=l.score; if(l.gs==="재성"||l.gb==="재성") s+=A.weakSide?0.3:1; if(l.gs==="식상"||l.gb==="식상") s+=0.4; if(l.ts==="겁재"||l.tb==="겁재") s-=0.7; return {d,l,s}; });
  const bestDw = dwMoney.filter(x=>x.d.age+9>=20&&x.d.age<=70).sort((a,b)=>b.s-a.s).slice(0,2).sort((a,b)=>a.d.age-b.d.age);
  const worstDw = dwMoney.filter(x=>x.d.age+9>=20&&x.d.age<=70).sort((a,b)=>a.s-b.s)[0];
  const futureYs = years.filter(x=>x.y>=thisYear && x.y<=thisYear+15);
  const moneyYears = futureYs.slice().sort((a,b)=>moneyFn(b)-moneyFn(a)).slice(0,4).sort((a,b)=>a.y-b.y);
  const leakYears = futureYs.filter(x=>x.L.ts==="겁재"||x.L.tb==="겁재"||(x.L.chung("day")&&x.L.unfavor)).slice(0,3);
  const channel = [["직장 월급",T("정재")+T("정관")+T("정인")*0.5],["부수입·N잡",T("식신")+T("편재")],["외주·프리",G.식상+T("비견")*0.5],
    ["사업",T("편재")*1.5+(A.strongSide?1.5:0)+T("겁재")*0.5],["콘텐츠",T("상관")*1.5+T("식신")+(A.has("도화")?1:0)],
    ["투자",T("편재")+(A.strongSide?1:-0.5)+T("정재")*0.5],["부동산",T("정인")+T("정재")+(A.yongEl===2||A.heeEl===2?1.5:0)]];
  const richType = jae>=2&&!A.weakSide&&G.식상>=1 ? "부자가 될 수 있는 구조야 — 재능(식상)이 돈(재성)을 낳고, 그 돈을 감당할 체력까지 있어." :
    (T("편재")+T("겁재")>=3||A.spread>=4) ? "기복이 큰 구조야 — 크게 벌 때와 크게 나갈 때가 번갈아 와. 벌 때 묶어 두는 게 전부야." :
    jae===0 ? "돈복이 원국에 드러나진 않아서, 재성이 들어오는 운에 맞춰 크게 모으는 '운 따라 레벨업' 구조야." :
    "안정적으로 먹고사는 기반이 있는 구조야. 대박보다 복리로 쌓을 때 결과가 가장 커.";
  h+=stepHead(4,"財運","버는 방식 · 지키는 힘 · 돈이 붙는 시기");
  h+=`<h3>돈을 버는 방식 ${conf(moneyType[0][1]-moneyType[1][1]>=1.5?"high":"mid")}</h3>
    <p><b>${moneyType[0][0]}</b>${moneyType[1][1]>0?` + <b>${moneyType[1][0]}</b>`:""}이야. ${term("재성")}이 ${jae}개(정재 ${T("정재")}·편재 ${T("편재")}), ${term("식상")}이 ${G.식상}개라서 ${G.식상&&jae?"재능이 돈으로 이어지는 통로가 열려 있어.":jae?"돈 그릇은 있는데 그걸 만들어 내는 재능 통로는 운에서 채워야 해.":"돈을 끌어오는 별이 원국엔 없어서 운에서 들어올 때가 승부처야."}</p>
    <h3>큰돈을 만질 그릇인가</h3><p>${holdPower}. ${richType}</p>
    <h3>젊을 때 vs 중년 이후 ${conf(Math.abs(young-mid)>0.4?"high":"low")}</h3><p>20~30대 재물 흐름 ${young.toFixed(1)}점, 40~50대 ${mid.toFixed(1)}점으로 ${young>mid+0.2?"<b>젊을 때가 더 유리</b>해. 초반에 번 돈을 묶어 두는 게 노후를 결정해.":mid>young+0.2?"<b>중년 이후가 더 유리</b>해. 젊을 땐 경험과 기반을 사는 시기로 생각해.":"<b>시기별 차이가 크지 않아.</b> 꾸준함이 곧 재산이야."}</p>
    <h3>손재 위험</h3>${li([G.비겁>=3&&jae?"<b>인간관계 손재</b> — 비겁이 많아 지인·동업·보증으로 돈이 나가(군겁쟁재). 돈 거래는 '안 돌려받아도 되는 금액'까지만.":"",
      T("겁재")+T("편재")>=2?"<b>투자 실수</b> — 한 방을 노리는 기운이 있어. 몰빵·레버리지는 반드시 피해.":"",
      G.식상>=3?"<b>충동 소비</b> — 기분과 표현 욕구가 소비로 이어져. 결제 전 24시간 규칙이 약.":"",
      A.weakSide&&jae>=2?"<b>빚 부담</b> — 기회가 많아 보여 레버리지를 쓰고 싶어지는데, 감당할 체력이 따라가지 못해(재다신약).":"",
      "여기 안 나온 손재 경로(빚·충동소비·투자·인간관계 중 나머지)는 이 사주에선 상대적으로 위험이 낮은 편이야."])}
    <h3>재물운이 강하게 들어오는 대운·세운</h3>
    ${li([`대운: ${bestDw.map(x=>`<b>${x.d.age}세 ${SAJU.gzName(x.d.gz)}</b>(${x.d.year}~${x.d.year+9}) — ${x.l.ts}·${x.l.tb}`).join(", ")} — 재물의 최대치가 커지는 구간이야.`,
      `앞으로의 세운: ${moneyYears.map(x=>`<b>${x.y}년</b>(${x.L.ts})`).join(", ")}`,
      `돈이 새기 쉬운 때: ${leakYears.length?leakYears.map(x=>`<b>${x.y}년</b>(${x.L.ts==="겁재"||x.L.tb==="겁재"?"겁재 — 경쟁·지출":"일지 충 + 기신 — 생활 변동비"})`).join(", "):"향후 15년 안엔 뚜렷한 누수 해가 적어"}${worstDw?` · 대운으론 ${worstDw.d.age}세 ${jGa(SAJU.gzName(worstDw.d.gz))} 가장 조심할 구간`:""}`])}
    <h3>어디서 돈을 벌어야 하나</h3><table class="tbl"><tbody>${channel.map(([n,s])=>`<tr><th>${n}</th><td><span class="stars">${starStr(Math.max(1,Math.min(5,Math.round((1.5+s*0.8)*2)/2)))}</span></td></tr>`).join("")}</tbody></table>
    <p><b>가장 돈이 잘 붙는 일의 형태:</b> ${moneyType[0][0]==="월급형"?"안정된 조직에서 직급과 연차로 쌓는 일":moneyType[0][0]==="사업형"?"내가 판을 짜고 사람을 굴리는 일":moneyType[0][0]==="성과형"?"결과물마다 값이 매겨지는 일(인센티브·건당·판매)":moneyType[0][0]==="전문직형"?"자격과 전문 지식으로 단가를 올리는 일":moneyType[0][0]==="투기형"?"변동성을 다루는 일 — 단, 반드시 규칙과 한도를 정한 상태에서":"꾸준히 모아 자산으로 바꾸는 일(저축·부동산)"} — 분야로는 용신 ${EL[A.yongEl]} 계열인 <b>${EL_FIELD[A.yongEl]}</b>${jGa2(EL_FIELD[A.yongEl])} 잘 맞아.</p>
    <h3>반드시 피해야 할 패턴 & 축재 전략</h3>${li([
      G.비겁>=2?"피할 것: 친한 사람과의 돈 거래·동업 — 이 사주에서 가장 흔한 손재 경로야.":A.weakSide?"피할 것: 감당 못 할 규모의 대출·투자 — 기회보다 체력이 먼저야.":"피할 것: 남의 말만 듣고 하는 투자 — 내가 이해 못 한 상품은 사지 마.",
      `전략: ${A.weakSide?"수입의 일정 비율을 자동으로 떼어 두고, 큰 결정은 인성·비겁 운(도움이 오는 해)에 해.":A.strongSide?"벌리는 힘이 있으니 현금 흐름 표를 만들고, 재성·식상이 들어오는 해에 공격적으로, 겁재 해엔 방어적으로 가.":"자동 저축 + 장기 투자로 복리를 쓰고, 재물운 강한 해에 목돈 이벤트(이직·사업 확장)를 맞춰."}`])}</section>`;

  /* ===== 5. 직업운 ===== */
  const careerType=[["조직형",T("정관")*2+T("정인")+T("정재")],["프리랜서형",T("비견")+T("식신")+T("상관")+(G.관성===0?2:0)],
    ["창업형",T("편재")*1.5+T("비견")+T("겁재")+(A.strongSide?1.5:0)+T("편관")*0.5],["전문기술형",T("식신")+T("편인")*1.5+T("정인")+(A.cnt[3]>=2?1:0)],
    ["기획형",T("편인")+T("상관")+(A.cnt[4]>=2?1:0)+(A.cnt[0]>=2?0.5:0)],["예술형",T("상관")+T("식신")+(A.has("화개")?1.5:0)+(A.cnt[1]>=2?0.5:0)],
    ["상담형",T("정인")+T("식신")+(A.has("화개")?1:0)+(A.cnt[4]>=2?0.5:0)],["영업형",T("편재")+T("상관")+(A.has("도화")?1:0)+(A.has("역마")?1:0)]].sort((a,b)=>b[1]-a[1]);
  const careerFn = x=>{ let s=x.comb; if(x.L.gs==="관성"&&!A.weakSide) s+=0.6; if(x.L.ts==="정관"||x.L.ts==="정인") s+=0.4; if(x.L.ts==="상관"&&G.관성) s-=0.3; return s; };
  const early=ageScore(20,34,careerFn), late=ageScore(35,54,careerFn);
  const moveYears = futureYs.filter(x=>x.L.chung("month")||x.L.ts==="상관"||(x.L.yeokma&&x.comb>=3)).slice(0,4);
  const jumpYears = futureYs.slice().sort((a,b)=>careerFn(b)-careerFn(a)).slice(0,3).sort((a,b)=>a.y-b.y);
  const slumpDw = dwList.filter(d=>d.age+9>=20&&d.age<=60).map(d=>({d,l:luck(A,d.gz)})).sort((a,b)=>a.l.score-b.l.score)[0];
  const peakDw = dwList.filter(d=>d.age+9>=20&&d.age<=60).map(d=>({d,l:luck(A,d.gz)})).sort((a,b)=>(b.l.score+(b.l.gs==="관성"||b.l.gs==="재성"?0.3:0))-(a.l.score+(a.l.gs==="관성"||a.l.gs==="재성"?0.3:0)))[0];
  h+=stepHead(5,"職業","적성 · 커리어 속도 · 이직과 도약 시기");
  h+=`<h3>타고난 직업 적성 ${conf(careerType[0][1]-careerType[2][1]>=1.5?"high":"mid")}</h3>
    <p><b>${careerType[0][0]}</b> + <b>${careerType[1][0]}</b> 성향이 가장 강해. ${top}(${GROUP_INFO[top].m})이 원국의 중심이라 ${GROUP_JOB[top]} 쪽에서 강점이 살아나. 격국으로 봐도 ${A.gyeok}이라 ${GYEOK_TXT[A.gyeok].split(".")[0]}.</p>
    <h3>만족 vs 생계 안정</h3><p>${G.재성+G.관성>G.식상+G.인성?"생계 안정이 먼저인 사람이야. 좋아하는 일보다 '안정적으로 남는 일'을 할 때 마음이 편하고, 그 위에서 만족을 찾아.":"만족이 먼저인 사람이야. 돈이 되더라도 재미·의미가 없으면 오래 못 버텨. 좋아하는 일을 돈 되는 구조로 바꾸는 게 숙제야."}</p>
    <h3>승진운 · 명예운 · 인정 욕구</h3><p>${term("관성")}이 ${G.관성}개, 인성이 ${G.인성}개야. ${G.관성&&G.인성?"관성과 인성이 이어져(관인상생) 조직에서 차근차근 올라가는 승진운이 좋아.":G.관성>=2?"자리와 책임은 잘 따라오는데, 받쳐 주는 인성이 약해 스트레스가 커. 자격·학위로 받침대를 만들어.":G.관성===0?"직함보다 실력과 자유가 중요해. 승진 경쟁보다 '대체 불가능한 사람'이 되는 쪽이 명예를 만들어.":"인정 욕구가 적당해. 성과가 쌓이면 자연스럽게 자리가 따라와."}</p>
    <h3>커리어 속도 ${conf(Math.abs(early-late)>0.4?"mid":"low")}</h3><p>${early>late+0.2?"<b>빨리 피는 편</b>이야. 20대 후반~30대 초반에 기회가 몰리니 그때 확실히 자리 잡아.":late>early+0.2?"<b>늦게 피는 대기만성형</b>이야. 30대 중반 이후 커리어가 본격적으로 올라가니 초반 비교에 흔들리지 마.":"<b>꾸준히 계단식으로 오르는 편</b>이야."}</p>
    <h3>업무 스타일</h3>${li([G.식상+G.재성>G.인성+G.관성?"사람을 상대하고 바깥으로 움직이는 일, 결과가 숫자로 보이는 일이 맞아.":"혼자 깊게 파고드는 일, 결과물·전문성 중심의 일이 맞아.",
      G.비겁>=2?"남 밑에서 지시받기보다 재량권이 있는 구조가 필수야.":"팀 안에서 역할이 분명할 때 실력이 가장 잘 나와.",
      `평생 업으로 삼으면 강해지는 분야: <b>${EL_FIELD[A.yongEl]}</b> (용신 ${EL[A.yongEl]}) · 보조로 ${EL_FIELD[A.heeEl].split("·").slice(0,3).join("·")}`])}
    <h3>이직·퇴사·독립 타이밍</h3><p>${moveYears.length?moveYears.map(x=>`<b>${x.y}년</b>(${x.L.chung("month")?"월지 충 — 환경 변동":x.L.ts==="상관"?"상관 — 틀을 깨고 싶은 해":"역마 — 이동"})`).join(", ")+" — 움직임이 생기기 쉬운 해들이야. 이 중 별점 높은 해에 움직이는 게 유리해.":"앞으로 15년 안엔 억지로 움직이게 되는 해가 드물어. 움직일 땐 내가 준비된 해를 골라."}</p>
    <h3>도약기와 침체기</h3>${li([`도약: <b>${peakDw.d.age}세 ${SAJU.gzName(peakDw.d.gz)} 대운</b>(${peakDw.d.year}~)${peakDw.d.year+9<thisYear?" (지남)":""} — ${TG[peakDw.l.ts].career}. 세운으론 ${jumpYears.map(x=>x.y+"년").join(", ")}`,
      `침체: <b>${slumpDw.d.age}세 ${SAJU.gzName(slumpDw.d.gz)} 대운</b>(${slumpDw.d.year}~)${slumpDw.d.year+9<thisYear?" (지남)":""} — ${TG[slumpDw.l.ts].career}. 이때는 확장보다 내실.`])}
    <h3>상사·조직·동료와의 갈등 패턴</h3><p>${T("상관")&&G.관성?"상관이 관성을 치는 구조라 윗사람의 비합리를 못 참아. 말이 맞아도 타이밍과 방식이 문제가 돼.":G.비겁>=3?"동료와 경쟁 구도가 잘 만들어져. 공을 나누는 문제로 갈등이 생기기 쉬워.":G.관성>=3?"위에서 내려오는 압박을 혼자 다 받아. 거절 못 해서 생기는 갈등이 많아.":"큰 갈등 구조는 없어. 다만 조직에선 이 점이 오해를 부를 수 있어 — "+careFirst(dm.care)}</p>
    <h3>국내 vs 해외</h3><p>${A.has("역마")||A.relHit("충","year")?"역마나 년지 충이 있어서 <b>해외·먼 곳과 인연이 있어.</b> 해외 근무·출장·외국계에서 기회가 크게 열려.":A.cnt[4]>=3?"물 기운이 강해 흐르는 일(무역·해외 교류)과 맞아. 해외도 충분히 길해.":"<b>국내에서 기반을 다지는 게 유리</b>해. 해외는 경험으로는 좋지만 정착보다는 단기가 맞아."} ${conf("mid")}</p></section>`;

  /* ===== 6. 연애운 ===== */
  const loveProp=[["헌신",T("정인")+T("식신")+T("정재")+(A.cnt[2]>=3?1:0)],["집착",T("겁재")+T("정재")*0.5+T("편관")*0.5+(A.cnt[2]>=3?0.5:0)],
    ["불안",T("편인")*1.5+(A.cnt[4]>=3?1:0)+(A.weakSide?1:0)],["회피",G.식상*0.7+(G.관성===0?1:0)+(A.has("화개")?1:0)],
    ["통제",T("편관")+T("정관")*0.5+T("비견")*0.5+(A.cnt[3]>=3?1:0)]].sort((a,b)=>b[1]-a[1]);
  const PROP_TXT={헌신:"상대를 챙기고 맞춰 주는 데서 사랑을 느껴. 단, 헌신이 보상받지 못하면 서운함이 한꺼번에 폭발해.",
    집착:"마음이 크면 확인받고 싶어져. 연락·우선순위에 민감하고, 경쟁자가 보이면 불안이 커져.",
    불안:"좋아할수록 '이 사람이 떠나면 어떡하지'를 먼저 생각해. 생각이 앞서서 혼자 소설을 쓰기 쉬워.",
    회피:"가까워질수록 숨이 막혀서 거리를 두고 싶어져. 자유와 혼자만의 시간이 보장돼야 오래 가.",
    통제:"관계의 방향을 내가 쥐고 싶어 해. 책임감에서 나온 거지만 상대에겐 간섭으로 느껴질 수 있어."};
  const spouseTen = A.male?["정재","편재"]:["정관","편관"];
  const spouseMix = T(spouseTen[0])&&T(spouseTen[1]);
  const shortIntense = T(spouseTen[1])+(A.has("도화")?1:0)+(A.relHit("충","day")?1:0)+(T("상관")?0.5:0) > T(spouseTen[0])+(A.relHit("육합","day")?1:0)+1;
  const loveYs = years.filter(x=>x.y>=thisYear&&x.y<=thisYear+12&&(x.L.spouse||x.L.hapDay||x.L.dohwa)).sort((a,b)=>b.comb-a.comb).slice(0,4).sort((a,b)=>a.y-b.y);
  const breakYs = years.filter(x=>x.y>=thisYear&&x.y<=thisYear+12&&(x.L.chung("day")||(A.male?x.L.ts==="겁재":x.L.ts==="상관"))).slice(0,3);
  const chungAnimal = ZODIAC[BR_CHUNG(P.day.b)], wonjinAnimal = ZODIAC[[...Array(12).keys()].find(b=>BR_WONJIN.has(key2(b,P.day.b)))];
  const hapAnimal = ZODIAC[[...Array(12).keys()].find(b=>BR_HAP[key2(b,P.day.b)]!=null)];
  h+=stepHead(6,"戀愛","끌림의 방식 · 반복되는 패턴 · 인연의 시기");
  h+=`<h3>사랑을 시작하는 방식 · 끌리는 상대</h3>${para([dm.love, `${term("배우자성")}은 ${A.spouseG}(${spouseTen.map(t=>t+" "+T(t)).join(", ")})이야. ${T(spouseTen[0])+T(spouseTen[1])===0?`원국엔 배우자성이 없어서, 정해진 이상형보다 그때그때 운에서 들어오는 기운에 따라 끌리는 사람이 달라져. 대신 ${dm.n}의 기질대로 ${A.weakSide?"나를 품어 주는":"내가 이끌 수 있는"} 사람에게 마음이 가.`:T(spouseTen[0])>=T(spouseTen[1])?`${spouseTen[0]} 쪽이 강해서 반듯하고 안정적인 사람에게 끌려.`:`${spouseTen[1]} 쪽이 강해서 자유롭고 강렬한, 조금은 위험한 매력에 끌려.`}${spouseMix?" 정·편이 섞여 있어서 안정과 자극 사이에서 고민하는 일이 생겨.":""}`])}
    <h3>초반만 강하고 오래 가기 어려운가</h3><p>${shortIntense?"그런 경향이 있어. 강렬하게 시작하는 연애가 많고, 일상이 되면 설렘이 빨리 식어. 오래 가려면 '설렘'이 아니라 '편안함'을 기준으로 골라야 해.":"아니야, 처음엔 천천히 데워지고 시간이 갈수록 깊어지는 타입이야. 길고 안정적인 관계가 맞아."} ${conf("mid")}</p>
    <h3>연애 성향: ${loveProp[0][0]}${loveProp[1][1]>0?` · ${loveProp[1][0]}`:""}</h3>${para([PROP_TXT[loveProp[0][0]], loveProp[1][1]>0?PROP_TXT[loveProp[1][0]]:""])}
    <h3>반복되는 실패 패턴</h3><p>${A.relHit("충","day")?"가까워진 뒤 생활 방식 차이로 부딪히는 패턴이야. 배우자 자리가 충을 맞아 '같이 사는 것'에서 갈등이 생겨.":spouseMix?"안정적인 사람과 자극적인 사람 사이를 오가다 둘 다 놓치는 패턴이야.":A.male&&G.재성===0||!A.male&&G.관성===0?"연애 자체에 시간·에너지를 덜 써서 타이밍을 놓치는 패턴이야.":G.비겁>=3?"자존심 싸움에서 지지 않으려다 관계를 잃는 패턴이야.":G.식상>=3?"말로 상처를 주고 나서 후회하는 패턴이야.":"서운함을 말 안 하고 쌓다가 한 번에 끝내는 패턴이야."}</p>
    <h3>사람 보는 눈</h3><p>${T("편인")+A.cnt[4]*0.5>=2.5?"환상이 강한 편이야. 상대를 내가 그린 이미지로 보기 쉬워서, 친구들 평가를 한 번쯤 들어 봐.":A.cnt[3]>=2||T("정재")+T("정관")>=2?"눈이 정확한 편이야. 첫인상보다 행동을 보고 판단해서 실패가 적어.":"보통이야. 초반 3개월은 판단을 미루고 지켜보는 게 안전해."}</p>
    <h3>이별 후 · 가장 크게 상처받는 포인트</h3><p>${G.관성>=2||G.비겁>=2?"자존심에 상처가 날 때 가장 아파. 겉으론 멀쩡한 척하고 일에 몰두하지만 회복이 오래 걸려.":G.인성>=2?"'이해받지 못했다'는 느낌이 가장 아파. 이별 후 생각이 꼬리를 물어 잠을 못 이루는 시기가 있어.":"버려졌다는 느낌이 가장 아파. 이별 직후엔 크게 흔들리지만 일상 루틴으로 빨리 회복해."} 연애가 삶에 미치는 영향은 ${A.relHit("육합","day")||A.has("도화")?"<b>큰 편</b>이야 — 연애 상태에 따라 일 효율까지 달라져.":"<b>적당한 편</b>이야 — 연애가 흔들려도 일과 생활은 지켜 내."}</p>
    <h3>잘 맞는 사람 · 피해야 할 사람</h3>${li([`잘 맞는 사람: 내게 부족한 <b>${elName(A.yongEl)}</b> 기운을 가진 사람 — ${EL_LOOK[A.yongEl].split(",")[0]} 타입, 일간이 ${STEM[A.yongEl*2]}·${STEM[A.yongEl*2+1]}인 사람. 띠로는 ${hapAnimal}띠와 합이 좋아.`,
      `피해야 할 사람: 이미 넘치는 <b>${elName(A.giEl)}</b> 기운이 강한 사람, 그리고 ${G.비겁>=2?"나보다 고집이 센 사람":G.관성>=2?"나를 통제하려는 사람":"감정 기복이 큰 사람"}. 띠로는 ${chungAnimal}띠(충)·${wonjinAnimal}띠(원진)와 부딪히기 쉬워.`])}
    <h3>연애운의 시기</h3>${li([`인연이 강하게 들어오는 해: ${loveYs.length?loveYs.map(x=>`<b>${x.y}년</b>(${x.L.hapDay?"일지합":x.L.spouse?"배우자성":"도화"})`).join(", "):"향후 12년 안엔 뚜렷하지 않아 — 대운의 흐름을 봐"}`,
      `관계가 틀어지기 쉬운 해: ${breakYs.length?breakYs.map(x=>`<b>${x.y}년</b>(${x.L.chung("day")?"일지 충":x.L.ts})`).join(", "):"뚜렷한 위기 해는 적어"}`,
      shortIntense?"스타일: 짧고 강렬한 연애가 반복되기 쉬워.":"스타일: 길고 안정적인 관계가 맞아."])}</section>`;

  /* ===== 7. 결혼운 ===== */
  const spCnt=G[A.spouseG];
  const lateMarry = (spCnt===0) || A.relHit("충","day") || (spouseMix&&spCnt>=3) || A.has("화개");
  const marryYs = years.filter(x=>x.age>=26&&x.age<=42&&(x.L.spouse||x.L.hapDay)).sort((a,b)=>(b.comb+(b.L.hapDay?0.5:0)+(b.D&&b.D.spouse?0.5:0))-(a.comb+(a.L.hapDay?0.5:0)+(a.D&&a.D.spouse?0.5:0))).slice(0,4).sort((a,b)=>a.y-b.y);
  const marryDw = dwList.filter(d=>{ const l=luck(A,d.gz); return (l.spouse||l.hapDay) && d.age+9>=24 && d.age<=45; }).slice(0,2);
  const crisisYs = years.filter(x=>x.age>=30&&x.age<=60&&x.L.chung("day")&&x.comb<3).slice(0,3);
  const dayTen=A.ten.day.b;
  const spouseAge = A.male ? (G.인성>=2?"연상이나 나이 차가 있는 사람과도 인연이 있어":"동갑이나 연하와 인연이 많아") : (G.인성>=2||T("정관")?"연상과 인연이 깊어":G.식상>=2?"연하나 동갑과 인연이 많아":"나이 차가 크지 않은 사람과 인연이 많아");
  const spouseEco = dayTen.includes("재")||G.재성>=2 ? "경제력이 있는 편" : dayTen.includes("인")?"안정적인 배경이나 학벌을 가진 편":dayTen.includes("관")?"직장·직함이 탄탄한 편":"경제력보다 성격·관계가 강점인 편";
  const marryMood = A.relHit("충","day")?"갈등형":dayTen==="정재"||dayTen==="정관"||dayTen==="정인"?"안정형":dayTen==="식신"?"실속형":dayTen==="상관"||dayTen==="겁재"||dayTen==="편관"?"감정소모형":"실속형";
  const childCnt=G[A.childG];
  h+=stepHead(7,"婚姻","결혼 구조 · 시기 · 배우자상 · 위기");
  h+=`<h3>결혼해야 안정되는 구조인가 ${conf("mid")}</h3><p>${A.deukji||dayTen==="정인"||dayTen==="정재"||dayTen==="정관"?`${term("배우자궁")}이 나를 받쳐 주는 구조라 <b>결혼이 안정의 기반이 돼.</b> 혼자보다 둘일 때 더 단단해져.`:A.relHit("충","day")?`${term("배우자궁")}이 충을 맞아 <b>결혼이 꼭 안정으로 이어지진 않아.</b> 결혼 자체보다 '거리 조절이 되는 관계'가 핵심이야.`:`${term("배우자궁")} 기준으로 <b>결혼은 선택의 영역</b>이야. 하면 생활이 정돈되고, 안 해도 큰 결핍은 아니야.`}</p>
    <h3>늦게 vs 빨리</h3><p>${lateMarry?`<b>늦게 하는 쪽이 유리해.</b> ${spCnt===0?"배우자성이 원국에 없어서":A.relHit("충","day")?"배우자 자리가 충을 맞아서":"인연이 복잡하게 얽히는 구조라서"} 너무 이른 결혼은 흔들리기 쉬워. 30대 이후, 내 생활 기반이 잡힌 뒤가 좋아.`:"<b>적령기에 하는 게 자연스러워.</b> 인연의 별이 원국에 자리 잡고 있어서, 좋은 사람이 오면 미루지 않는 게 나아."}</p>
    <h3>결혼이 유력한 시기</h3>${li([`대운: ${marryDw.length?marryDw.map(d=>`<b>${d.age}세 ${SAJU.gzName(d.gz)}</b>(${d.year}~${d.year+9})`).join(", "):"배우자성이 크게 들어오는 대운이 드물어 — 세운에서 기회를 잡아"}`,
      `세운(26~42세 중): ${marryYs.length?marryYs.map(x=>`<b>${x.y}년 ${x.age}세</b>${x.y<thisYear?" (지남)":""}`).join(", "):"뚜렷한 해가 적어"}`])}
    <h3>배우자의 모습 ${conf("low")}</h3>${li([`성향: ${SPOUSE_SEAT[dayTen].replace(/^배우자 자리에 '.+?' — /,"")}`,
      `분위기·외형: ${EL_LOOK[A.spouseEl]} (배우자성 ${EL[A.spouseEl]} 기운)`,`나이: ${spouseAge}`,`경제력: ${spouseEco}`,
      `생활력: ${A.cnt[2]>=2||dayTen.includes("재")?"현실적이고 살림을 잘 챙기는 편":"생활보다 정서적 교감에 강한 편"}`])}
    <h3>결혼 생활의 분위기 — ${marryMood}</h3><p>${{안정형:"서로 역할이 분명하고 예측 가능한 결혼이야. 큰 파도는 적은데, 대화가 줄면 무미건조해질 수 있어.",갈등형:"생활 방식 차이로 자주 부딪히지만, 부딪히면서 맞춰 가는 결혼이야. 각자의 공간이 필수.",실속형:"함께 먹고 즐기고 모으는 실속 있는 결혼이야. 경제적으로 같이 성장해.",감정소모형:"감정의 온도 차가 큰 결혼이야. 좋은 땐 뜨겁고 나쁜 땐 차가워 — 감정 관리 규칙을 미리 정해 둬."}[marryMood]}</p>
    ${li([`결혼 후 좋아지는 것: ${A.spouseEl===A.yongEl||A.spouseEl===A.heeEl?"배우자가 용신 기운이라 결혼 후 운이 확 펴져. 일·돈이 같이 좋아져.":"생활의 안정과 소속감."}`,
      `무너질 수 있는 것: ${A.spouseEl===A.giEl?"배우자 기운이 기신 쪽이라 결혼 후 내 시간·건강이 깎이기 쉬워. 배우자 탓보다 생활 구조를 바꿔.":G.비겁>=3?"돈 관리 — 가계 경제의 주도권 문제가 생기기 쉬워.":"내 개인 시간 — 의식적으로 지켜야 해."}`,
      `배우자복: ${A.deukji||A.spouseEl===A.yongEl?"<b>강한 편</b>":A.relHit("충","day")||A.spouseEl===A.giEl?"<b>약한 편</b> — 기대치를 조절하면 오히려 편해":"<b>보통</b>"}`,
      `갈등 포인트: ${A.relHit("충","day")?"생활 습관·주거·시간 사용":dayTen.includes("재")?"돈 쓰는 방식":dayTen.includes("관")?"서로에 대한 기대와 역할":dayTen.includes("식")||dayTen.includes("상")?"말투와 표현":"가족(양가) 문제"}`])}
    <h3>위기 · 이혼 · 재혼 가능성 ${conf("low")}</h3><p>${A.relHit("충","day")||spouseMix&&spCnt>=3?"원국 구조상 결혼 생활의 변동성이 있는 편이야. 위기는 갑자기 오기보다 생활 방식 차이가 누적되어 와.":"원국 구조상 이혼을 강하게 시사하는 요소는 적어."} ${crisisYs.length?`특히 <b>${crisisYs.map(x=>x.y+"년").join(", ")}</b>은 일지 충에 운까지 약해서 관계 점검이 필요한 해야.`:""} ${A.has("화개")&&spCnt===0?"화개가 있고 배우자성이 없어서, 동거·비혼처럼 형식에 매이지 않는 관계도 잘 맞을 수 있어.":""}</p>
    <h3>자녀운</h3><p>${term("자녀성")}인 ${A.childG}이 ${childCnt}개야. ${childCnt===0?"원국에 자녀성이 드러나지 않아 자녀 인연이 늦거나 적을 수 있고, 운에서 들어올 때 인연이 와.":childCnt>=3?"자녀 인연이 많고, 그만큼 양육에 에너지가 많이 들어. 양육 스트레스 관리가 필요해.":"자녀와의 인연이 자연스러워."} ${P.hour?`자녀 자리(시주)는 ${jRo(SAJU.gzName(P.hour))}${A.relHit("충","hour")?" 충을 맞아 자녀와 생각 차이가 있을 수 있어.":" 비교적 안정적이야."}`:"(시주를 몰라 자녀 자리는 판단 보류)"}</p>
    <h3>결혼으로 생기는 현실적 변화</h3><p>${A.spouseEl===A.yongEl||A.spouseEl===A.heeEl?"생활 안정과 신분 상승 쪽으로 작용해. 결혼이 인생의 레벨업 이벤트가 될 수 있어.":A.weakSide&&G.재성>=2?"책임과 지출이 늘어 부담이 커질 수 있어. 결혼 전 재정 계획을 같이 세우는 게 필수야.":"생활이 정돈되고 안정되는 쪽이야. 큰 신분 변화보다는 일상의 안정."}</p></section>`;

  /* ===== 8. 건강운 ===== */
  const weakEls = missing.length?missing:[A.cnt.indexOf(Math.min(...A.cnt))];
  const healthYs = years.filter(x=>x.y>=thisYear&&x.y<=thisYear+20&&((x.L.chung("day")&&x.L.unfavor)||(x.L.ts==="편관"&&A.weakSide)||(x.L.unfavor===2))).slice(0,4);
  const healthDw = dwList.filter(d=>d.age<=80).filter(d=>{ const l=luck(A,d.gz); return l.score<=2.5&&(l.gs==="관성"||l.unfavor); }).slice(0,2);
  h+=stepHead(8,"健康","체질의 약점 · 스트레스 패턴 · 조심할 시기");
  h+=`<p class="hint">의학적 진단이 아니라 사주 구조상 '취약하기 쉬운 경향'이야. 증상이 있으면 꼭 병원에 가.</p>
    <h3>타고난 체질적 약점</h3>${li([...weakEls.map(i=>`<b>${elName(i)} ${A.cnt[i]===0?"부족":"약함"}</b> — ${EL_HEALTH[i].sys} 계통이 상대적으로 약해.`),
      ...many.map(i=>`<b>${elName(i)} 과다</b> — ${EL_HEALTH[i].sys}에 과부하가 오기 쉬워.`)])}
    <h3>스트레스가 몸으로 드러나는 방식</h3><p>${jRo(EL_HEALTH[weakEls[0]].stress)} 나타나기 쉬워. ${EL_HEALTH[many.length?many[0]:most].pat}.</p>
    <h3>취약 포인트 체크</h3><table class="tbl"><tbody>
      <tr><th>수면</th><td>${A.cnt[4]===0||A.cnt[1]>=3?"<b>주의</b> — 열이 많거나 물이 없어 잠이 얕아지기 쉬워":A.cnt[4]>=3?"<b>주의</b> — 잠이 많아지고 무기력으로 빠지기 쉬워":"보통"}</td></tr>
      <tr><th>소화</th><td>${A.cnt[2]===0||A.cnt[2]>=4||(A.cnt[0]>=3)?"<b>주의</b> — 위장이 스트레스의 첫 신호를 보내":"보통"}</td></tr>
      <tr><th>염증</th><td>${A.cnt[1]>=3||(A.cnt[3]>=2&&A.cnt[1]>=2)?"<b>주의</b> — 열이 많아 염증·트러블이 잦아":"보통"}</td></tr>
      <tr><th>순환</th><td>${A.cnt[1]===0||A.cnt[4]>=3?"<b>주의</b> — 손발이 차고 순환이 느려":"보통"}</td></tr>
      <tr><th>호르몬</th><td>${A.cnt[4]===0||A.cnt[4]>=4?"<b>주의</b> — 수(水) 기운의 불균형으로 호르몬 리듬이 흔들리기 쉬워":"보통"}</td></tr>
      <tr><th>정신적 피로</th><td>${G.인성>=3||T("편인")>=2||G.관성>=3?"<b>주의</b> — 생각이 많거나 압박을 혼자 짊어져":"보통"}</td></tr></tbody></table>
    <h3>사고수 · 수술수 · 과로 · 우울/불안</h3>${li([A.has("백호")||A.has("양인")?"<b>사고·수술</b>: 백호·양인이 있어 다치거나 칼(수술·시술)을 대는 일이 생기기 쉬워. 운전·운동 시 안전이 최우선.":"<b>사고·수술</b>: 원국상 두드러진 요소는 적어.",
      A.strongSide&&G.재성+G.관성>=3||G.관성>=3?"<b>과로</b>: 할 일을 계속 떠안아 몸이 먼저 신호를 보내기 전까지 멈추지 않아.":"<b>과로</b>: 보통 수준. 다만 몰입기엔 끼니부터 거르는 편.",
      G.인성>=3||A.cnt[4]>=3||(A.weakSide&&G.관성>=2)?"<b>우울·불안</b>: 생각이 많고 압박에 약한 구조라 우울·불안 경향이 있어. 혼자 버티지 말고 털어놓을 곳을 만들어.":"<b>우울·불안</b>: 구조적으로 크게 기울어 있진 않아."])}
    <h3>건강이 꺾이기 쉬운 시기</h3><p>${healthDw.length?`대운: ${healthDw.map(d=>`<b>${d.age}세 ${SAJU.gzName(d.gz)}</b>`).join(", ")} — 기신·관성 압박이 겹쳐. `:""}${healthYs.length?`세운: ${healthYs.map(x=>`<b>${x.y}년</b>(${x.L.chung("day")?"일지 충":x.L.ts==="편관"?"편관":"기신"})`).join(", ")}`:"향후 20년 안엔 크게 꺾이는 해가 두드러지지 않아."}</p>
    <h3>무너질 때의 전조 & 꼭 지킬 생활습관</h3>${li([`전조: ${jGa(EL_HEALTH[weakEls[0]].stress)} 2주 이상 이어지면 이미 과부하야.`,
      `습관: ${jEul(ELEM[A.yongEl].food)} 챙기고, ${A.yongEl===1?"햇볕과 유산소 운동":A.yongEl===4?"충분한 수면과 수분":A.yongEl===0?"스트레칭과 숲 산책":A.yongEl===3?"호흡 운동과 규칙적인 배변":"규칙적인 식사 시간"}을 루틴으로 만들어.`,
      A.strongSide?"에너지가 넘치는 사주라 운동으로 반드시 밖으로 빼 줘야 병이 안 생겨.":"에너지 총량이 적은 사주라 휴식이 곧 치료야. 쉬는 걸 일정에 넣어."])}</section>`;

  /* ===== 9. 인간관계·가족운 ===== */
  const fatherG = T("편재")?"편재":T("정재")?"정재":null, motherG = T("정인")?"정인":T("편인")?"편인":null;
  const guinYs = years.filter(x=>x.y>=thisYear&&x.y<=thisYear+12&&GWIN[A.ds].includes(x.L.g.b)).slice(0,3);
  const cutYs = years.filter(x=>x.y>=thisYear&&x.y<=thisYear+12&&(x.L.ts==="겁재"||x.L.chung("year"))).slice(0,3);
  h+=stepHead(9,"人緣","부모·형제 · 귀인 · 사람으로 인한 득실");
  h+=`<h3>부모와의 인연</h3>${para([`부모 자리(년주·월주)는 ${SAJU.gzName(P.year)}·${jYa(SAJU.gzName(P.month))}. ${A.relHit("충","month")&&(A.rel.some(x=>x.t==="충"&&((x.a==="day"&&x.b==="month")||(x.a==="month"&&x.b==="day"))))?"월지와 일지가 충이라 부모와 가치관이 부딪히고, 일찍 독립하는 경우가 많아.":A.rel.some(x=>(x.t==="육합"||x.t==="천간합")&&((x.a==="day"&&x.b==="month")||(x.a==="month"&&x.b==="day")))?"월주와 일주가 합으로 묶여 부모와 정이 깊고, 성인이 돼서도 가깝게 지내.":"부모와의 관계는 무난한 편이야."}`,
    `아버지를 뜻하는 재성은 ${fatherG?jRo(fatherG)+" 드러나 있고":"원국에 드러나지 않아"}, 어머니를 뜻하는 인성은 ${motherG?jRo(motherG)+" 드러나 있어":"원국에 드러나지 않아"}. ${!motherG?"어머니의 보살핌이 부족했다고 느끼거나, 일찍부터 스스로 챙기며 자랐을 가능성이 있어.":G.인성>=3?"어머니(또는 보호자)의 영향이 매우 커. 그 기대가 지금의 기준이 되었을 수 있어.":""} ${G.재성>=2&&G.인성>=1?"재성이 인성을 누르는 구조라 현실 문제(돈)가 부모와의 정서보다 앞서는 일이 생겨.":""} ${conf("mid")}`])}
    <h3>형제·가족과의 거리감</h3><p>${G.비겁===0?"형제·또래와의 인연이 약하거나 거리가 있는 편이야. 가족 안에서도 독자적인 역할을 해.":G.비겁>=3?"형제·친구 같은 '나와 같은 사람'이 많아. 의지가 되지만 경쟁과 금전 문제도 같이 와.":"형제·가족과 적당한 거리를 유지해."}</p>
    <h3>가족 때문에 짊어지기 쉬운 짐</h3><p>${A.weakSide&&G.재성>=2?"집안의 경제적 책임을 떠맡기 쉬운 구조야. 도와주더라도 한도를 정해 두지 않으면 내 인생이 밀려.":G.관성>=3?"장남·장녀 같은 '책임자 역할'을 떠맡기 쉬워.":G.비겁>=3&&G.재성>=1?"형제·친척 간 돈 문제에 엮이기 쉬워.":"가족의 짐이 크게 쏠리는 구조는 아니야."}</p>
    <h3>인간관계의 갈등 구조 · 귀인운</h3>${li([`갈등 구조: ${emo[top].split(".")[0]}. ${A.rel.some(x=>x.t==="원진")?"원진이 있어 이유 없이 서운해지는 관계가 반복돼.":""}`,
      `${term("천을귀인")}: ${A.has("천을귀인")?"원국에 있어 — 결정적인 순간에 도와주는 사람이 꼭 나타나.":"원국엔 없어 — 귀인은 운에서 와."} ${guinYs.length?`귀인이 들어오는 해: ${guinYs.map(x=>x.y+"년").join(", ")}`:""}`,
      `사람을 잘못 믿어 손해 보는 구조: ${G.비겁>=2&&G.재성>=1||T("편인")>=2?"<b>있어.</b> 가까운 사람일수록 돈·일 경계를 분명히 해.":"<b>약한 편.</b> 사람 보는 기준이 뚜렷해."}`,
      `인간관계 단절·정리 해: ${cutYs.length?cutYs.map(x=>x.y+"년").join(", "):"두드러지지 않음"}`])}
    <h3>평생 옆에 남는 사람</h3><p>${G.인성>=2?"나를 이해하고 기다려 주는 어른스러운 사람":G.식상>=2?"함께 웃고 즐길 수 있는 편한 사람":G.관성>=2?"약속을 지키는 믿을 만한 사람":G.비겁>=2?"같은 방향을 보는 동료 같은 사람":"현실적으로 서로 도움을 주고받는 사람"}이 끝까지 남아. 용신 ${EL[A.yongEl]} 기운을 가진 사람이 특히 오래 가.</p>
    <h3>외로움 · 자존심 · 인정 욕구</h3><p>${G.관성>=2&&(A.relHit("충","day")||G.식상===0)?"<b>사회적으로는 강해 보이지만 사적으로는 약한 타입</b>이야. 밖에선 책임자, 안에선 기댈 곳이 없어 외로워.":A.has("화개")?"혼자 있는 시간이 필요한 타입이야. 외로움을 타지만 동시에 혼자서 깊어져.":"사회와 사생활의 온도 차가 크지 않아."} ${G.비겁>=2?"자존심이 상하면 관계를 먼저 끊는 편이야.":G.관성>=2?"인정받지 못하면 쉽게 지쳐.":"인정 욕구는 적당해."}</p></section>`;

  /* ===== 10. 대운 분석 ===== */
  h+=stepHead(10,"大運",`대운수 ${r.daewoon.start} · ${r.daewoon.forward?"순행":"역행"} — 각 10년의 키워드와 분야별 흐름`);
  h+=`<div class="scroll"><div class="dw">${dwList.map(d=>{ const l=luck(A,d.gz);
    return `<a class="it${d===curDw?" now":""}" href="#dw${d.age}"><div>${d.age}세</div><div class="g">${STEMH[d.gz.s]}<br>${BRH[d.gz.b]}</div><div>${SAJU.gzName(d.gz)}</div><div class="t">${l.ts}<br>${l.tb}</div><div class="stars" style="font-size:10px;letter-spacing:0">${starStr(l.score)}</div></a>`; }).join("")}</div></div>`;
  dwList.slice(0,9).forEach(d=>{
    const l=luck(A,d.gz), past=d.year+9<thisYear, isCur=d===curDw;
    const kw=[...new Set([...TG[l.ts].kw.slice(0,2),TG[l.tb].kw[0]])].slice(0,3);
    const elNote = l.favor?`용신·희신(${[l.se,l.be].filter(e=>e===A.yongEl||e===A.heeEl).map(elName).join("·")}) 기운이 들어와 기본 체력이 받쳐 줘.`:l.unfavor?`기신·구신(${[l.se,l.be].filter(e=>e===A.giEl||e===A.guEl).map(elName).join("·")}) 기운이 강해 무리하면 손실이 커져.`:"한신 기운이라 좋고 나쁨보다 내 선택이 결과를 정해.";
    h+=`<details class="stage" id="dw${d.age}"${isCur?" open":""}><summary><b>${d.age}세 ${SAJU.gzName(d.gz)}(${SAJU.gzHan(d.gz)})</b> <span class="mut">${d.year}~${d.year+9}</span> <span class="stars">${starStr(l.score)}</span>${isCur?' <span class="tag bad">지금</span>':past?' <span class="tag">지남</span>':""}</summary>
      <p><b>핵심 키워드:</b> ${kw.map(k=>`<span class="chip">${k}</span>`).join(" ")}</p>
      <p>천간 ${l.ts}(${TEN_DESC[l.ts].split(" — ")[0]}), 지지 ${l.tb}(${TEN_DESC[l.tb].split(" — ")[0]})의 10년. ${elNote}</p>
      <table class="tbl"><tbody>
        <tr><th>돈</th><td>${TG[l.ts].money}${l.tb!==l.ts?` / 바탕: ${TG[l.tb].money}`:""}</td></tr>
        <tr><th>직업</th><td>${TG[l.ts].career}</td></tr>
        <tr><th>연애·결혼</th><td>${d.age+9<18?"아직 어린 시기라 연애보다 또래·가족 관계의 영향이 커.":l.spouse||l.hapDay?"배우자성·일지합이 들어와 결혼·동거 등 관계가 '확정'되기 좋은 10년이야.":TG[l.ts].love}</td></tr>
        <tr><th>건강</th><td>${TG[l.ts].health}.${l.chung("day")?" 일지 충까지 겹쳐 몸의 변화가 커.":""}</td></tr>
        <tr><th>인간관계</th><td>${TG[l.ts].rel}</td></tr></tbody></table>
      ${l.ev.length?li(l.ev.map(e=>`${e.t==="good"?"✅":e.t==="bad"?"⚠️":"🔸"} ${e.d}`)):""}
      <p><b>주의할 사건:</b> ${TG[l.ts].ev}. <b>레벨업 포인트:</b> ${TG[l.ts].up}.</p>
      <p><b>좋아지는 선택:</b> ${TG[l.ts].good} · <b>손실을 키우는 행동:</b> ${TG[l.ts].bad}</p></details>`;
  });
  h+=`</section>`;

  /* ===== 11. 세운 분석 ===== */
  const scanFrom=Math.max(birthY+17,thisYear-3), scanTo=thisYear+15;
  const scan=years.filter(x=>x.y>=scanFrom&&x.y<=scanTo);
  const pick=(fn,n,sort)=>{ let a=scan.filter(fn); if(sort) a=a.sort(sort); return a.slice(0,n).sort((x,y)=>x.y-y.y); };
  const why = x=>{ const p=[`세운 ${SAJU.gzName(x.L.g)}(${x.L.ts}/${x.L.tb})`]; if(x.d) p.push(`대운 ${SAJU.gzName(x.d.gz)}`); return p.join(" × ")+(x.inter.length?" — "+x.inter[0]:""); };
  const cats=[
    ["인생이 크게 열리는 해",pick(x=>x.comb>=4,3,(a,b)=>b.comb-a.comb),x=>`용신 기운과 좋은 대운이 겹쳐 기회가 커져. ${TG[x.L.ts].ev.split(",").slice(0,2).join(",")} 등으로 나타나기 쉬워.`],
    ["크게 꺾이는 해",pick(x=>x.comb<=2||(x.L.chung("day")&&x.L.chung("month")),3,(a,b)=>a.comb-b.comb),x=>`${x.L.ev.filter(e=>e.t==="bad").map(e=>e.k).join("·")||"기신 기운"} — ${x.L.ev.find(e=>e.t==="bad")?.d.split(" — ")[1]||"무리하면 크게 손실"}`],
    ["돈이 커지는 해",pick(x=>x.L.gs==="재성"||x.L.gb==="재성"||x.L.gs==="식상",3,(a,b)=>moneyFn(b)-moneyFn(a)),x=>`${x.L.ts}·${x.L.tb} — ${TG[x.L.gs==="재성"?x.L.ts:x.L.tb].money}${A.weakSide&&x.L.gs==="재성"?" (단, 체력 범위 안에서만)":""}`],
    ["연애·결혼 가능성이 높은 해",pick(x=>x.L.spouse||x.L.hapDay,3,(a,b)=>b.comb-a.comb),x=>x.L.hapDay?"일지와 합 — 관계가 묶이고 확정되는 해":"배우자성이 들어와 인연이 생기는 해"],
    ["이별·관계 변동 해",pick(x=>x.L.chung("day"),2),x=>"일지 충 — 가까운 관계의 형태가 바뀌어(이별·이사·별거·관계 재정의)"],
    ["이직·독립·시험·이사 관련 해",pick(x=>x.L.chung("month")||x.L.ts==="정관"||x.L.ts==="정인"||x.L.yeokma,4),x=>x.L.chung("month")?"월지 충 — 일터·환경 이동":x.L.ts==="정관"?"정관 — 합격·승진·취업":x.L.ts==="정인"?"정인 — 계약·문서·이사·자격":"역마 — 이동·이사"],
    ["건강 주의 해",pick(x=>(x.L.chung("day")&&x.L.unfavor)||x.L.ts==="편관"&&A.weakSide||x.L.unfavor===2,3),x=>x.L.ts==="편관"&&A.weakSide?"편관 — 약한 몸에 압박이 실려 과로·사고·수술 조심":x.L.chung("day")?"일지 충 + 기신 기운 — 몸의 리듬이 크게 흔들려, 컨디션 관리 최우선":"천간·지지 모두 기신 쪽 기운 — 무리하면 바로 탈이 나는 해"],
    ["귀인 유입 / 관계 정리 해",pick(x=>GWIN[A.ds].includes(x.L.g.b)||x.L.ts==="겁재",3),x=>GWIN[A.ds].includes(x.L.g.b)?"천을귀인 — 도와줄 사람이 나타나":"겁재 — 사람과 돈이 정리되는 해"],
    ["함정의 해 — 겉보기와 다르게 작동",pick(x=>(STEM_EL(x.L.g.s)===A.yongEl||STEM_EL(x.L.g.s)===A.heeEl)&&(x.L.chung("day")||x.L.chung("month")||BR_EL[x.L.g.b]===A.giEl)||(A.weakSide&&x.L.gs==="재성"&&x.L.gb==="재성"),3),
      x=>A.weakSide&&x.L.gs==="재성"?"돈 기회처럼 보이지만 감당할 힘이 모자라 오히려 손해가 날 수 있어(재다신약)":"천간은 좋은 기운이라 기대가 크지만, 지지에서 충·기신이 받쳐 줘서 결과가 생각보다 작거나 뒤집혀"],
    ["해외·먼 이동에 좋은 해",pick(x=>x.L.yeokma||x.L.chung("year"),3),x=>x.L.yeokma?"역마 — 해외·이동 운이 열려":"년지 충 — 익숙한 곳을 떠나는 흐름"]];
  h+=stepHead(11,"歲運",`${scanFrom}~${scanTo}년 중 중요한 해 — 원국 × 대운 × ${term("세운")} 교차 분석`);
  cats.forEach(([nm,arr,fn])=>{ h+=`<h3>${nm}</h3>${arr.length?li(arr.map(x=>`<b>${x.y}년 ${SAJU.gzName(x.L.g)} (${x.age}세)</b>${x.y<thisYear?' <span class="mut">지남</span>':""} — ${fn(x)}<br><span class="mut">${why(x)}</span>`)):`<p class="mut">이 기간엔 해당하는 해가 두드러지지 않아.</p>`}`; });
  const yrs=[thisYear,thisYear+1,thisYear+2];
  h+=`<h3 style="margin-top:22px">올해부터 3년, ${term("월운")}까지</h3><div class="tabs" id="ytabs">${yrs.map((y,i)=>`<button class="${i?"":"on"}" data-y="${y}">${y}년</button>`).join("")}</div>`;
  const nr=SAJU.calc({y:thisYear,m:today.getMonth()+1,d:today.getDate(),hour:today.getHours(),min:today.getMinutes(),gender:"f",lon:null});
  yrs.forEach((y,i)=>{ const x=Y(y), L=x.L;
    h+=`<div data-yp="${y}" ${i?"hidden":""}><p><b>${y}년 ${SAJU.gzName(L.g)}(${SAJU.gzHan(L.g)})</b> <span class="stars">${starStr(x.comb)}</span> · ${x.age}세 · ${x.d?SAJU.gzName(x.d.gz)+" 대운 속":"대운 전"}</p>
      <p><b>${L.ts}</b>의 해 — ${TEN_YEAR[L.ts]}</p><p>바닥엔 '<b>${TEN_KW[L.tb]}</b>'(${L.tb}) 기운. 실제로는 ${TG[L.ts].ev} 같은 형태로 나타나기 쉬워.</p>
      ${L.ev.length?li(L.ev.map(e=>`${e.t==="good"?"✅":e.t==="bad"?"⚠️":"🔸"} ${e.d}`)):""}${x.inter.length?`<p>🔁 ${x.inter.join(" / ")}.</p>`:""}
      <div class="months">`;
    for(let m=0;m<12;m++){ const mg=SAJU.monthGzOf(y,m), ml=luck(A,mg), calM=m+2>12?m+2-12:m+2;
      const flag=ml.ev.filter(e=>/충|합|귀인|역마/.test(e.k)).map(e=>e.k).join(" ");
      h+=`<div class="mo${nr.sajuYear===y&&nr.pillars.month.i===mg.i?" now":""}"><div class="mh">${calM}월<span>${SAJU.gzName(mg)}</span></div><div class="stars" style="font-size:12px">${starStr(ml.score)}</div><div>${ml.ts===ml.tb?TEN_KW[ml.ts]:TEN_KW[ml.ts]+" · "+TEN_KW[ml.tb]}</div>${flag?`<div style="color:var(--seal);font-size:12px">${flag}</div>`:""}</div>`; }
    h+=`</div><p class="hint">월운은 절기 기준(예: 2월=입춘~경칩 전).</p></div>`; });
  h+=`</section>`;

  /* ===== 12. 현실 조언 ===== */
  const fixes=[];
  if(G.비겁>=3) fixes.push("<b>내 방식이 정답이라는 확신</b>을 내려놓기 — 사람과 돈이 같이 빠져나가는 구멍이야.");
  if(G.식상>=3) fixes.push("<b>말이 먼저 나가는 습관</b> 고치기 — 맞는 말도 타이밍이 틀리면 기회를 잃어.");
  if(G.관성>=3) fixes.push("<b>모든 책임을 혼자 지는 습관</b> 버리기 — 거절도 능력이야.");
  if(G.인성>=3) fixes.push("<b>준비만 하는 습관</b> 끊기 — 70% 준비되면 출발해.");
  if(G.재성>=3&&A.weakSide) fixes.push("<b>다 잡으려는 욕심</b> 줄이기 — 감당할 만큼만 확실하게.");
  if(G.재성===0) fixes.push("<b>돈 관리의 무계획</b> 고치기 — 자동 저축부터 시작해.");
  if(G.식상===0) fixes.push("<b>드러내지 않는 습관</b> 고치기 — 실력은 보여줘야 값이 매겨져.");
  if(G.관성===0) fixes.push("<b>스스로 정한 규칙 없이 흘러가는 것</b> 고치기 — 마감과 루틴을 직접 만들어.");
  if(A.relHit("충","day")) fixes.push("<b>가까운 사람과의 거리 조절</b> — 붙어 있을수록 부딪히는 구조라 각자의 공간이 필요해.");
  missing.forEach(i=>fixes.push(`<b>${elName(i)} 기운 채우기</b> — ${ELEM[i].none.split(".").slice(1).join(".").trim()}`));
  fixes.push(`<b>기질의 그림자 의식하기</b> — ${careFirst(dm.care)}`);
  const strengths=[`<b>${dm.kw.split(" · ")[0]}</b> — ${dm.n}의 타고난 무기야.`, `<b>${GROUP_INFO[top].m}</b> — 원국의 중심인 ${top}의 힘.`];
  if(A.has("천을귀인")) strengths.push("<b>귀인복</b> — 결정적인 순간마다 도움이 와. 사람을 소중히 하면 복이 커져.");
  if(A.relHit("육합","day")||A.deukji) strengths.push("<b>가정의 힘</b> — 배우자 자리가 나를 받쳐 줘.");
  strengths.push(`<b>${A.gyeok}의 설계도</b> — ${GYEOK_TXT[A.gyeok].split(".")[0]}.`);
  const futureDw = dwList.filter(d=>d.year>thisYear).slice(0,2);
  const turns = futureDw.map(d=>{ const l=luck(A,d.gz), pi=dwList.indexOf(d)-1, pl=pi>=0?luck(A,dwList[pi].gz):luck(A,P.month);
    const dir = l.score>pl.score+0.4?"앞 10년보다 바람이 확실히 좋아져":l.score<pl.score-0.4?"앞 10년보다 바람이 거세져 — 미리 대비가 필요해":"흐름의 세기는 비슷하지만 주제가 바뀌어";
    return `<b>${d.year}년(${d.age}세) ${SAJU.gzName(d.gz)} 대운 진입</b> — ${l.ts}·${l.tb}의 10년(${TG[l.ts].kw.join("·")}). ${dir}.`; });
  const bigYear = scan.filter(x=>x.y>=thisYear).sort((a,b)=>Math.abs(b.comb-3)+(b.L.chung("day")?1:0)-(Math.abs(a.comb-3)+(a.L.chung("day")?1:0)))[0];
  if(bigYear) turns.push(`<b>${bigYear.y}년(${bigYear.age}세)</b> — ${bigYear.comb>=3?"크게 열리는":"크게 흔들리는"} 해. ${why(bigYear)}`);
  const pastLine = (()=>{ const ys=years.filter(x=>x.y<thisYear&&x.age>=10); if(!ys.length) return ""; const lo=ys.slice().sort((a,b)=>a.comb-b.comb)[0], hi=ys.slice().sort((a,b)=>b.comb-a.comb)[0];
    return `지금까지는 ${hi.y}년 무렵 가장 순풍이, ${lo.y}년 무렵 가장 역풍이 불었을 거야. `; })();
  h+=stepHead(12,"結論","가장 먼저 고칠 것 · 붙잡을 강점 · 분야별 생존 전략");
  h+=`<h3>가장 먼저 고쳐야 할 것 3가지</h3>${li(fixes.slice(0,3))}
    <h3>반드시 붙잡아야 할 강점 3가지</h3>${li(strengths.slice(0,3))}
    <h3>분야별 생존 전략</h3><table class="tbl"><tbody>
      <tr><th>돈</th><td>${moneyType[0][0]}으로 벌고, ${G.비겁>=2?"사람과의 돈 거래를 끊는 게":A.weakSide?"감당할 규모를 지키는 게":"복리로 묶어 두는 게"} 핵심.</td></tr>
      <tr><th>연애</th><td>${shortIntense?"설렘보다 편안함을 기준으로 고르기.":"천천히 깊어지는 관계를 믿기."} ${(PROP_TXT[loveProp[0][0]].split(".")[1]||"").trim()}.</td></tr>
      <tr><th>결혼</th><td>${lateMarry?"내 생활 기반이 잡힌 뒤에.":"좋은 인연이 오면 미루지 말기."} 갈등 포인트(${A.relHit("충","day")?"생활 습관":dayTen.includes("재")?"돈":"역할 기대"})는 결혼 전에 합의.</td></tr>
      <tr><th>건강</th><td>${EL_HEALTH[weakEls[0]].sys} 관리 + ${A.strongSide?"운동으로 에너지 배출":"휴식을 일정에 넣기"}.</td></tr></tbody></table>
    <h3>지금까지의 삶이 왜 이렇게 흘렀는지</h3><p>${pastLine}<b>"${top==="비겁"?"내 힘으로 버텨 온":top==="식상"?"표현하고 부딪치며 길을 낸":top==="재성"?"현실을 붙잡고 결과로 증명해 온":top==="관성"?"책임을 짊어지고 인정받아 온":"배우고 견디며 내공을 쌓아 온"} ${ILJU[P.day.i][0]}"</b> — ${crux.replace("가장 크게 부딪히는 문제는 ","핵심 숙제는 ")}</p>
    <h3>앞으로 가장 중요한 변곡점 3개</h3>${li(turns.slice(0,3))}</section>`;

  /* ===== 사주 총정리 (맨 끝 한눈 요약) ===== */
  const _goodWin = dwList.filter(d=>{const l=luck(A,d.gz);return l.favor>=1&&d.year+9>=thisYear;}).slice(0,2).map(d=>`${d.year}~${d.year+9}년`).join(", ")||"앞으로 용신이 들어오는 시기";
  h+=`<section class="card"><h2>사주 한눈 총정리 <span class="hj">總評</span></h2>
    <p class="sub">긴 리포트를 딱 줄이면 이래 — 어떤 사주고, 어떤 사람인지.</p>
    <dl class="kv">
      <dt>어떤 사주</dt><dd><b>${STEM[A.ds]}${EL[A.de]}(${STEMH[A.ds]}) 일간</b>의 <b>${A.gyeok}</b>, <b>${A.strength}</b> 사주야. 오행은 <b class="e-c${most}">${elName(most)}</b> 기운이 가장 세고${missing.length?`, <b>${missing.map(elName).join("·")}</b> 기운이 비어 있어`:" 비교적 고르게 퍼져 있어"}. 꼭 필요한 약(용신)은 <b class="e-c${A.yongEl}">${elName(A.yongEl)}</b>.</dd>
      <dt>어떤 사람</dt><dd><b>${ILJU[P.day.i][0]}</b> — ${dm.kw.replace(/ · /g,"·")} 기질의 ${jYa(dm.img)}. 강점은 <b>${dm.kw.split(" · ")[0]}</b>, 그리고 원국의 중심인 ${top}(${GROUP_INFO[top].m})의 힘이야. 조심할 건 ${A.strongSide?"넘치는 힘을 엉뚱한 데 쏟는 것":A.weakSide?"주변에 휘둘려 중심을 잃는 것":"균형에 안주해 결단을 미루는 것"}이고.</dd>
      <dt>삶의 방향</dt><dd>${themes[0].t.replace(/<\/?b>/g,"").split(" — ")[0]} — 이게 평생 반복되는 테마야. <b class="e-c${A.yongEl}">${elName(A.yongEl)}</b> 기운이 들어오는 <b>${_goodWin}</b>에 인생의 큰 문이 열려.</dd>
    </dl>
    <div class="box">${dm.e} 한마디로, <b>${A.strength} ${dm.img}</b>. ${A.strongSide?"힘이 넘치니 그 힘을 쏟을 곳만 정하면 크게 돼.":A.weakSide?"기운을 채워 줄 사람과 환경을 만나면 확 피어나.":"균형이 좋으니 승부처만 잘 고르면 돼."} 인생은 네가 쓰는 거야.</div></section>`;

  h+=`<section class="card"><h2>용어 한눈에 <span class="hj">用語</span></h2><p class="sub">리포트에 나온 사주 용어를 쉬운 말로 모아 뒀어. 모르는 단어가 나오면 여기서 찾아봐.</p>
    <details class="stage"><summary>용어 사전 펼치기 (${Object.keys(GLOSS).length}개)</summary>
    <dl class="kv" style="margin-top:4px">${Object.entries(GLOSS).map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl></details></section>`;
  h+=`<div class="actions"><button class="btn ghost" id="btnAgain">${meta.shared?"내 사주 보기":"다시 입력하기"}</button></div>
    <p class="foot">절입 시각은 VSOP87 기반 정밀 계산값, 음력 변환은 한국천문연구원 기준.<br>규칙 기반 자동 풀이라 실제 상담과 다를 수 있어. 인생은 네가 쓰는 거야 🐯</p>`;
  return h;
}
