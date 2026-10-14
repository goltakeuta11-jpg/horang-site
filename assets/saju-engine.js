/* ===== 사주 계산 엔진 (브라우저·노드 공용) =====
   - 절기: Meeus 태양 겉보기황경 + 섭동항 보정 → Newton 반복으로 절입 시각(UTC) 계산
   - 년주: 입춘 기준 / 월주: 12절 기준 / 일주: 율리우스일 / 시주: 진태양시 기준 2시간
   - 한국 표준시 변천(1954~61 UTC+8:30) · 서머타임 반영 */
const SAJU = (function(){
const STEM  = ["갑","을","병","정","무","기","경","신","임","계"];
const STEMH = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const BR    = ["자","축","인","묘","진","사","오","미","신","유","술","해"];
const BRH   = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const ZODIAC= ["쥐","소","호랑이","토끼","용","뱀","말","양","원숭이","닭","개","돼지"];
const EL    = ["목","화","토","금","수"];          // 0 목 1 화 2 토 3 금 4 수
const ELH   = ["木","火","土","金","水"];
const STEM_EL = s => Math.floor(s/2);
const BR_EL   = [4,2,0,0,2,1,1,2,3,3,2,4];
const BR_YANG = [1,0,1,0,1,0,1,0,1,0,1,0];         // 체(體) 기준 음양
// 지장간 [여기, 중기, 정기] (정기는 마지막)
const JIJANG = [[8,9],[9,7,5],[4,2,0],[0,1],[1,9,4],[4,6,2],[2,5,3],[3,1,5],[4,8,6],[6,7],[7,3,4],[4,0,8]];
const BR_MAIN = JIJANG.map(a=>a[a.length-1]);
const TEN = ["비견","겁재","식신","상관","편재","정재","편관","정관","편인","정인"];
const TEN_GROUP = ["비겁","비겁","식상","식상","재성","재성","관성","관성","인성","인성"];
const UNSEONG = ["장생","목욕","관대","건록","제왕","쇠","병","사","묘","절","태","양"];
const JANGSAENG = [11,6,2,9,2,9,5,0,8,3];          // 일간별 장생지

const D2R = Math.PI/180;
const norm360 = x => ((x%360)+360)%360;
const mod = (a,n) => ((a%n)+n)%n;

/* ---------- 달력 기본 ---------- */
function jdFromDate(y,m,d){                       // 그레고리력 → 율리우스일(정오 기준 정수일 = JDN)
  const a=Math.floor((14-m)/12), yy=y+4800-a, mm=m+12*a-3;
  return d+Math.floor((153*mm+2)/5)+365*yy+Math.floor(yy/4)-Math.floor(yy/100)+Math.floor(yy/400)-32045;
}
function dateFromJdn(J){
  const a=J+32044, b=Math.floor((4*a+3)/146097), c=a-Math.floor(146097*b/4);
  const d=Math.floor((4*c+3)/1461), e=c-Math.floor(1461*d/4), m=Math.floor((5*e+2)/153);
  return {y:100*b+d-4800+Math.floor(m/10), m:m+3-12*Math.floor(m/10), d:e-Math.floor((153*m+2)/5)+1};
}
const msToJD = ms => ms/86400000 + 2440587.5;
const jdToMs = jd => (jd-2440587.5)*86400000;

function deltaT(y){                               // 초 단위 (Espenak & Meeus)
  let t;
  if(y<1900){ t=(y-1860); return 7.62+0.5737*t-0.251754*t*t+0.01680668*t**3-0.0004473624*t**4+t**5/233174; }
  if(y<1920){ t=y-1900; return -2.79+1.494119*t-0.0598939*t*t+0.0061966*t**3-0.000197*t**4; }
  if(y<1941){ t=y-1920; return 21.20+0.84493*t-0.0761*t*t+0.0020936*t**3; }
  if(y<1961){ t=y-1950; return 29.07+0.407*t-t*t/233+t**3/2547; }
  if(y<1986){ t=y-1975; return 45.45+1.067*t-t*t/260-t**3/718; }
  if(y<2005){ t=y-2000; return 63.86+0.3345*t-0.060374*t*t+0.0017275*t**3+0.000651814*t**4+0.00002373599*t**5; }
  if(y<2050){ t=y-2000; return 62.92+0.32217*t+0.005589*t*t; }
  t=(y-1820)/100; return -20+32*t*t-0.5628*(2150-y);
}

/* ---------- 태양 겉보기 황경 ---------- */
function sunLon(jdUT){
  const y = 2000+(jdUT-2451545)/365.25;
  const jde = jdUT + deltaT(y)/86400;
  const T = (jde-2451545)/36525;
  const L0 = 280.46646+36000.76983*T+0.0003032*T*T;
  const M  = (357.52911+35999.05029*T-0.0001537*T*T)*D2R;
  const C  = (1.914602-0.004817*T-0.000014*T*T)*Math.sin(M)+(0.019993-0.000101*T)*Math.sin(2*M)+0.000289*Math.sin(3*M);
  const Om = (125.04-1934.136*T)*D2R;
  const Ls = (280.4665+36000.7698*T)*D2R, Lm=(218.3165+481267.8813*T)*D2R;
  const dpsi = (-17.20*Math.sin(Om)-1.32*Math.sin(2*Ls)-0.23*Math.sin(2*Lm)+0.21*Math.sin(2*Om))/3600;
  return norm360(L0 + C + dpsi - 0.00569);
}
/* 주어진 황경에 태양이 도달하는 시각(JD, UT). 추정 jd 근처에서 Newton 반복 */
function solarTermJD(targetLon, jdGuess){
  let jd = jdGuess;
  for(let i=0;i<30;i++){
    let diff = targetLon - sunLon(jd);
    diff = ((diff+540)%360)-180;
    jd += diff/0.98564736;
    if(Math.abs(diff)<1e-7) break;
  }
  return jd;
}
/* 해당 양력연도 k번째 절(0=소한 … 11=대설)의 JD. 절 황경: 285,315,345,15,…,255 */
const JIE_NAME = ["소한","입춘","경칩","청명","입하","망종","소서","입추","백로","한로","입동","대설"];
const JIE_LON  = [285,315,345,15,45,75,105,135,165,195,225,255];
const JIE_DAY  = [6,4,6,5,6,6,7,8,8,8,7,7];            // 대략 날짜(추정 시작점)
// 1899~2051 절입 시각 정밀표(UTC 분, 차분 base36) — 寿星 VSOP87 계산값(lunar-javascript, MIT)에서 생성.
// 범위 밖은 위 근사식(±15분)으로 계산.
const JIE_T0 = 1899;
const JIE_TBL = (()=>{ const a="-m88bj,wrq,x2v,xl7,y61,ynv,yxg,yw3,yk0,y0w,xg3,wz6,wqb,wro,x2u,xl7,y62,ynw,yxj,yw5,yk2,y0w,xg3,wz4,wq9,wrn,x2v,xl9,y66,yny,yxk,yw2,yk0,y0w,xg4,wz7,wqb,wrm,x2u,xl5,y62,ynt,yxe,yw0,yk0,y0z,xg9,wzb,wqf,wrn,x2s,xl3,y5z,ynu,yxi,yw3,yk2,y10,xg7,wza,wqe,wrn,x2s,xl3,y60,ynu,yxj,yw4,yk2,y0y,xg5,wz8,wqe,wrp,x2u,xl4,y60,yns,yxe,yw1,yk1,y0y,xg6,wz9,wqe,wrr,x2w,xl7,y61,ynt,yxe,yw1,yk0,y0z,xg8,wza,wqe,wro,x2s,xl4,y5z,ynr,yxe,yw1,yk2,y11,xg9,wzb,wqe,wrm,x2r,xl2,y5y,ynt,yxh,yw3,yk1,y0z,xg7,wza,wqd,wro,x2s,xl4,y62,ynv,yxi,yw2,yk1,y0w,xg6,wza,wqf,wrp,x2u,xl2,y5w,ynp,yxd,yw0,yk1,y0z,xg8,wzc,wqg,wrp,x2t,xl2,y5v,ynq,yxf,yw3,yk5,y12,xg8,wz9,wqb,wrn,x2r,xl3,y5z,yns,yxi,yw4,yk5,y11,xg8,wz8,wqb,wrl,x2q,xl3,y5z,ynq,yxe,yw1,yk2,y12,xga,wzb,wqe,wrm,x2r,xl2,y5y,yns,yxf,yw2,yk3,y13,xgc,wze,wqf,wrl,x2n,xkx,y5u,ynp,yxg,yw4,yk5,y14,xgd,wze,wqg,wrm,x2n,xkx,y5s,yno,yxg,yw5,yk6,y13,xga,wzc,wqf,wrp,x2r,xl1,y5w,ynp,yxf,yw4,yk5,y13,xgb,wzc,wqf,wrp,x2s,xl0,y5t,ynl,yx9,yvz,yk4,y15,xgf,wzf,wqh,wro,x2q,xl0,y5t,ynn,yxc,yw1,yk6,y15,xgf,wze,wqf,wrl,x2p,xl0,y5w,ynr,yxh,yw3,yk5,y12,xgc,wzd,wqg,wrm,x2p,xl0,y5v,ynp,yxe,yw0,yk3,y11,xgb,wzd,wqi,wrp,x2s,xl0,y5v,ynp,yxf,yw4,yk5,y13,xgc,wze,wqf,wrm,x2o,xky,y5s,yno,yxg,yw6,yk9,y16,xgd,wzd,wqd,wrk,x2m,xkx,y5t,yno,yxf,yw7,yka,y16,xgd,wzc,wqc,wrk,x2n,xky,y5w,ynq,yxh,yw6,yk9,y17,xgf,wze,wqe,wrk,x2m,xku,y5q,ynm,yxc,yw2,yk8,y19,xgj,wzj,wqi,wrl,x2k,xks,y5n,ynk,yxd,yw5,yka,y1a,xgi,wzh,wqh,wrl,x2l,xku,y5o,ynm,yxf,yw8,yka,y18,xgg,wzf,wqh,wrn,x2n,xkv,y5p,ynj,yx9,yw1,yk7,y17,xgg,wzh,wqj,wro,x2q,xkw,y5q,ynj,yxa,yw1,yk7,y19,xgj,wzj,wqh,wrl,x2l,xku,y5q,ynk,yxc,yw3,yk8,y1a,xgj,wzi,wqh,wrk,x2k,xkt,y5p,ynl,yxc,yw4,yk7,y17,xgg,wzg,wqh,wrm,x2m,xkv,y5s,ynn,yxf,yw6,yk7,y17,xgf,wzg,wqh,wro,x2m,xku,y5n,yni,yxb,yw4,yk8,y19,xgi,wzi,wqh,wrn,x2l,xks,y5m,yni,yxc,yw6,ykc,y1c,xgi,wzf,wqe,wri,x2k,xku,y5q,ynm,yxf,yw9,yke,y1b,xgj,wzf,wqe,wri,x2i,xkt,y5q,ynk,yxb,yw3,yka,y1c,xgk,wzj,wqh,wrk,x2j,xkr,y5m,ynk,yxc,yw6,ykb,y1d,xgn,wzm,wqi,wri,x2g,xkn,y5k,ynj,yxe,yw9,ykf,y1f,xgn,wzl,wqj,wrk,x2g,xkn,y5h,yng,yxc,yw7,yke,y1d,xgl,wzj,wqi,wrm,x2k,xkr,y5l,ynh,yxc,yw7,yke,y1e,xgm,wzk,wqi,wrn,x2k,xkr,y5j,yne,yx7,yw2,ykc,y1g,xgp,wzo,wqk,wrl,x2j,xko,y5i,yne,yx8,yw4,ykc,y1f,xgp,wzm,wqi,wrk,x2h,xkq,y5m,ynj,yxd,yw7,ykd,y1d,xgm,wzl,wqi,wrl,x2j,xkq,y5l,yng,yxa,yw2,yk9,y1b,xgl,wzm,wqk,wro,x2l,xkq,y5i,yng,yxa,yw5,ykb,y1e,xgm,wzl,wqi,wrk,x2i,xko,y5j,yng,yxd,yw9,ykg,y1g,xgn,wzk,wqg,wri,x2g,xkn,y5j,yng,yxb,yw7,ykf,y1f,xgn,wzj,wqf,wri,x2g,xkp,y5l,yni,yxd,yw7,ykf,y1h,xgp,wzl,wqi,wri,x2e,xkl,y5h,yne,yxa,yw6,ykf,y1i,xgs,wzq,wqk,wrj,x2e,xki,y5c,ync,yx9,yw7,ykh,y1i,xgr,wzn,wqk,wrj,x2e,xkk,y5f,yne,yxd,ywa,ykj,y1i,xgq,wzm,wqi,wrk,x2g,xkn,y5f,ync,yx7,yw4,yke,y1h,xgr,wzo,wqk,wrm,x2i,xkm,y5f,ynb,yx6,yw4,ykf,y1j,xgu,wzp,wqk,wri,x2d,xkk,y5f,ynd,yxb,yw8,yki,y1k,xgt,wzq,wqj,wri,x2c,xkj,y5f,yne,yxa,yw6,ykf,y1h,xgq,wzo,wqk,wrl,x2f,xkl,y5f,ynf,yxb,yw8,ykg,y1i,xgq,wzo,wqk,wrl,x2g,xkj,y5d,ynb,yx9,yw8,yki,y1k,xgt,wzq,wqk,wrk,x2f,xki,y5c,yn9,yx8,yw8,ykk,y1m,xgs,wzn,wqh,wrh,x2d,xkk,y5f,yne,yxc,ywb,ykl,y1o,xgt,wzo,wqh,wrf,x2d,xkj,y5f,ynd,yx9,yw5,ykh,y1m,xgv,wzs,wql,wri,x2c,xkh,y5b,yna,yx8,yw7,ykh,y1n,xgx,wzu,wql,wri,x29,xke,y59,yna,yxc,ywb,ykn,y1o,xgw,wzt,wql,wrj,x2b,xke,y59,yn9,yx8,yw8,ykj,y1n,xgt,wzq,wql,wrk,x2f,xki,y5b,yn8,yx7,yw8,ykj,y1n,xgw,wzr,wqk,wrk,x2d,xkh,y5a,yn8,yx5,yw6,ykj,y1p,xgy,wzv,wqm,wrj,x2b,xkf,y58,yn7,yx5,yw6,ykj,y1n,xgw,wzs,wql,wrh,x2b,xkf,y5b,ynb,yxb,yw9,ykk,y1n,xgv,wzr,wql,wri,x2c,xkg,y5b,yn9,yx9,yw6,ykh,y1m,xgu,wzs,wqn,wrk,x2c,xkg,y58,yn6,yx7,yw7,ykk,y1o,xgw,wzr,wqk,wrg,x2a,xkd,y58,yn9,yxa,ywd,ykq,y1t,xgy,wzr,wqi,wre,x28,xkd,y58,yn9,yx9,yw9,ykn,y1r,xgx,wzs,wqi,wrf,x29,xkd,y58,yn9,yx8,ywa,ykm,y1s,xh1,wzu,wqm,wrg,x27,xka,y55,yn6,yx7,ywa,yko,y1u,xh3,wzz,wqp,wrh,x27,xk8,y51,yn3,yx5,ywa,yko,y1t,xh1,wzv,wqn,wri,x29,xka,y54,yn5,yx8,ywb,ykq,y1u,xh1,wzu,wqm,wri,x2b,xke,y56,yn4,yx4,yw6,ykm,y1s,xh2,wzx,wqo,wrk,x2b,xkd,y56,yn2,yx2,yw5,ykk,y1t,xh3,wzy,wqo,wrg,x28,xka,y55,yn6,yx8,ywa,ykp,y1u,xh3,wzx,wqn,wrg,x27,xkb,y55,yn8,yx8,yw9,ykk,y1q,xgz,wzv,wqo,wri,x2a,xkc,y56,yn6,yx7,yw9,ykm,y1r,xgy,wzv,wqo,wri,x2a,xka,y53,yn4,yx7,ywb,ykq,y1u,xh2,wzw,wqn,wrh,x27,xk9,y53,yn3,yx5,ywb,ykq,y1v,xh1,wzu,wqj,wre,x26,xk9,y55,yn6,yx8,ywd,yks,y1x,xh3,wzu,wqj,wrd,x24,xka,y55,yn5,yx7,yw9,ykp,y1w,xh4,wzz,wqo,wrg,x24,xk6,y51,yn1,yx5,yw9,ykp,y1w,xh6,x00,wqo,wrf,x22,xk2,y4y,yn1,yx8,ywe,ykv,y20,xh6,wzy,wqo,wrf,x24,xk4,y4z,yn1,yx6,ywb,yks,y1x,xh4,wzx,wqo,wrh,x27,xk8,y50,ymz,yx2,yw9,ykq,y1x,xh7,wzz,wqo,wrh,x25,xk6,y4y,ymz,yx2,ywa,ykr,y21,xha,x02,wqq,wrg,x24,xk5,y4y,ymz,yx3,yw8,ykq,y1y,xh7,x00,wqp,wrf,x24,xk5,y50,yn1,yx6,ywb,ykr,y1x,xh6,wzz,wqp,wrg,x26,xk6,y51,yn1,yx5,ywa,ykq,y1w,xh6,x00,wqq,wrj,x27,xk6,y4y,ymz,yx2,yw9,ykr,y1y,xh7,wzz,wqn,wrf,x23,xk4,y4y,yn0,yx7,ywf,ykx,y22,xh9,wzy,wql,wrd,x22,xk4,y50,yn3,yx7,ywd,ykt,y21,xh8,wzz,wqm,wre,x22,xk4,y4z,yn2,yx4,ywb,ykt,y20,xha,x02,wqp,wrf,x20,xk0,y4u,ymy,yx5,ywe,ykw,y24,xhc,x06,wqr,wrg,x21,xjz,y4s,ymw,yx4,ywd,ykw,y22,xha,x01,wqq,wrf,x23,xk1,y4u,ymx,yx3,ywd,ykw,y23,xha,x01,wqo,wrg,x23,xk4,y4x,ymx,yx1,yw9,yku,y23,xhc,x04,wqr,wrg,x24,xk2,y4v,ymw,ywz,yw7,yks,y22,xhd,x04,wqq,wrd,x20,xjz,y4u,ymy,yx4,ywc,ykw,y25,xhc,x04,wqq,wrd,x20,xjz,y4v,yn0,yx5,ywd,ykt,y20,xha,x02,wqq,wrg,x22,xk1,y4v,ymx,yx3,ywa,yku,y20,xh9,x03,wqq,wrg,x22,xjz,y4r,ymu,yx2,ywe,yky,y26,xhe,x04,wqp,wre,x20,xjz,y4r,ymv,yx3,ywd,yky,y26,xhd,x02,wqn,wrb,x1z,xjz,y4t,ymx,yx3,ywd,yky,y27,xhe,x03,wqo,wrc,x1y,xjy,y4t,ymw,yx2,ywc,ykx,y26,xhg,x08,wqt,wrf,x1y,xjx,y4p,ymt,yx1,ywb,ykw,y25,xhh,x07,wqt,wre,x1x,xju,y4n,yms,yx3,ywf,yl1,y29,xhg,x06,wqr,wre,x1z,xjx,y4q,ymu,yx3,ywe,yky,y27,xhe,x05,wqr,wrf,x22,xjz,y4s,ymt,yx0,yw9,ykw,y27,xhf,x07,wqr,wrf,x1z,xjx,y4o,yms,yx0,ywb,ykz,y2b,xhj,x09,wqt,wrd,x1y,xjv,y4q,ymt,yx2,ywd,ykz,y27,xhg,x06,wqr,wre,x1y,xjw,y4q,ymv,yx2,ywe,yky,y26,xhf,x05,wqr,wre,x1z,xjw,y4q,ymu,yx2,ywd,ykz,y27,xhg,x07,wqs,wrg,x1z,xjx,y4o,yms,yx1,ywd,ykz,y29,xhh,x06,wqp,wrb,x1w,xjt,y4o,ymr,yx3,ywg,yl4,y2d,xhi,x07,wqn,wr9,x1u,xjt,y4p,ymv,yx4,ywg,yl2,y2b,xhj,x08,wqp,wrc,x1v,xjt,y4o,ymt,yx1,ywd,ykz,y2a,xhk,x0a,wqt,wrd,x1t,xjo,y4i,ymo,yx0,ywf,yl3,y2e,xho,x0c,wqv,wre,x1t,xjp,y4i,ymn,yx1,ywg,yl4,y2d,xhk,x09,wqs,wre,x1w,xjr,y4k,ymo,ywy,ywd,yl2,y2d,xhk,x09,wqs,wrd,x1x,xju,y4k,ymo,yww,ywb,yl0,y2d,xhn,x0d,wqu,wrf,x1x,xjt,y4l,ymn,ywx,ywa,yky,y2c,xhn,x0d,wqt,wrc,x1u,xjq,y4j,ymp,ywz,ywe,yl1,y2d,xhm,x0b,wqt,wrc,x1u,xjq,y4l,yms,yx2,ywf,yl1,y2b,xhi,x0a,wqt,wrf,x1x,xjs,y4m,ymq,yx0,ywe,yl0,y2a,xhj,x09,wqt,wrd,x1v,xjq,y4h,ymn,ywy,ywg,yl6,y2g,xho,x0b,wqr,wrb,x1t,xjp,y4j,ymp,yx1,ywi,yl7,y2h,xhn,x09,wqp,wr9,x1r,xjq,y4k,ymq,yx1,ywg,yl5,y2g,xho,x0b,wqr,wra,x1q,xjo,y4i,ymn,yx0,ywf,yl4,y2i,xhr,x0g,wqw,wrc,x1r,xjm,y4f,ymm,ywz,ywf,yl5,y2h,xhr,x0f,wqv,wrc,x1q,xjk,y4d,ymk,ywy,ywh,yl9,y2j,xhq,x0e,wqu,wrc,x1s,xjm,y4f,ymm,ywz,ywf,yl6,y2i,xhq,x0d,wqu,wre,x1u,xjq,y4h,ymm,yww,ywc,yl3,y2g,xhq,x0f,wqw,wrd,x1s,xjl,y4e,ymj,ywv,ywc,yl5,y2k,xht,x0h,wqx,wrc,x1q,xjl,y4e,ymm,ywy,ywg,yl6,y2h,xhq,x0e,wqv,wrc,x1r,xjn,y4f,ymn,ywz,ywf,yl4,y2g,xhn,x0d,wqu,wrd,x1t,xjn,y4e,ymj,ywx,ywe,yl5,y2h,xhq,x0f,wqv,wre,x1t,xjn,y4e,ymj,ywx,ywg,yl7,y2j,xhr,x0d,wqs,wra,x1p,xjk,y4e,ymk,ywy,ywh,yl9,y2m,xhs,x0d,wqs,wr7,x1o,xjj,y4f,ymm,yx0,ywh,yl8,y2k,xht,x0f,wqu,wr9,x1p,xjk,y4f,yml,ywz,ywg,yl6,y2j,xht,x0i,wqw,wrb,x1n,xjf,y48,ymf,yww,ywh,yla,y2o,xhv,x0j,wqx,wrc,x1n,xjg,y48,ymg,ywy,ywj,ylc,y2o,xht,x0g,wqu,wrc,x1p,xjj,y4c,ymh,ywx,ywg,yl9,y2n,xhu,x0g,wqu,wra,x1q,xjj,y4b,ymf,ywt,ywd,yl8,y2n,xhy,x0k,wqx,wrc,x1p,xji,y4b,ymh,ywv,ywf,yl8,y2n,xhy,x0k,wqw,wra,x1m,xjg,y49,ymi,ywx,ywg,yl9,y2o,xhv,x0j".split(","); const r=[]; let v=0;
  a.forEach((x,i)=>{ v = i? v+parseInt(x,36) : parseInt(x,36); r.push(v); }); return r; })();
function jieJD(year,k){
  const i=(year-JIE_T0)*12+k;
  if(i>=0 && i<JIE_TBL.length) return msToJD(JIE_TBL[i]*60000);
  return solarTermJD(JIE_LON[k], jdFromDate(year,k+1,JIE_DAY[k]) - 0.5);
}

/* ---------- 한국 시간대 ---------- */
// 서머타임 구간 [시작, 끝) 현지 벽시계 기준 (y,m,d,h)
const KDST = [
 [1948,6,1,0, 1948,9,13,0],[1949,4,3,0, 1949,9,11,0],[1950,4,1,0, 1950,9,10,0],[1951,5,6,0, 1951,9,9,0],
 [1955,5,5,0, 1955,9,9,0],[1956,5,20,0, 1956,9,30,0],[1957,5,5,0, 1957,9,22,0],[1958,5,4,0, 1958,9,21,0],
 [1959,5,3,0, 1959,9,20,0],[1960,5,1,0, 1960,9,18,0],[1987,5,10,2, 1987,10,11,3],[1988,5,8,2, 1988,10,9,3]];
function koreaOffset(y,m,d,h){                     // 반환: {std: 표준시 경도기준 분, dst: 서머타임 분}
  const key=((y*100+m)*100+d)*100+h;
  let std = 540;
  const k1=((1954*100+3)*100+21)*100, k2=((1961*100+8)*100+10)*100;
  const k0=((1908*100+4)*100+1)*100,  k3=((1912*100+1)*100+1)*100;
  if((key>=k1 && key<k2) || (key>=k0 && key<k3)) std = 510;
  let dst = 0;
  for(const r of KDST){
    const a=((r[0]*100+r[1])*100+r[2])*100+r[3], b=((r[4]*100+r[5])*100+r[6])*100+r[7];
    if(key>=a && key<b){ dst=60; break; }
  }
  return {std, dst};
}
// 균시차(분) — 진태양시 옵션용
function equationOfTime(jd){
  const T=(jd-2451545)/36525;
  const L0=(280.46646+36000.76983*T)*D2R, M=(357.52911+35999.05029*T)*D2R;
  const e=0.016708634-0.000042037*T, eps=(23.439291-0.0130042*T)*D2R, yv=Math.tan(eps/2)**2;
  const E=yv*Math.sin(2*L0)-2*e*Math.sin(M)+4*e*yv*Math.sin(M)*Math.cos(2*L0)-0.5*yv*yv*Math.sin(4*L0)-1.25*e*e*Math.sin(2*M);
  return E*4/D2R;
}

/* ---------- 관계 함수 ---------- */
function tenGod(dayStem, stem){
  const a=STEM_EL(dayStem), b=STEM_EL(stem), same=(dayStem%2)===(stem%2);
  const rel = mod(b-a,5);       // 0 같음 1 내가 생 2 내가 극 3 나를 극 4 나를 생
  return rel*2 + (same?0:1);
}
function unseong(dayStem, br){
  const s=JANGSAENG[dayStem];
  return dayStem%2===0 ? mod(br-s,12) : mod(s-br,12);
}
const gz = i => ({s:i%10, b:i%12, i});
const gzIndex = (s,b) => { for(let i=0;i<60;i++) if(i%10===s && i%12===b) return i; return -1; };
const gzName = g => STEM[g.s]+BR[g.b];
const gzHan  = g => STEMH[g.s]+BRH[g.b];

/* ---------- 메인 계산 ----------
 in: {y,m,d, hour, min (null이면 시간 모름), gender:'m'|'f', lon(경도, null이면 보정 안 함), eot:bool, yaja:bool} */
function calc(inp){
  const timeKnown = inp.hour!=null;
  const hh = timeKnown?inp.hour:12, mi = timeKnown?(inp.min||0):0;
  const off = koreaOffset(inp.y,inp.m,inp.d,hh);
  const totalOff = off.std + off.dst;              // 분
  const localMs = Date.UTC(inp.y,inp.m-1,inp.d,hh,mi);
  const utcMs = localMs - totalOff*60000;
  const jdUT = msToJD(utcMs);

  // 진태양시(지방평균시) = UT + 경도*4분 (+ 균시차)
  let solarShift = 0;   // 분: 벽시계 대비 보정량
  if(inp.lon!=null){
    solarShift = inp.lon*4 - totalOff;
    if(inp.eot) solarShift += equationOfTime(jdUT);
  }
  const solarMs = localMs + solarShift*60000;
  const sd = new Date(solarMs);
  const S = {y:sd.getUTCFullYear(), m:sd.getUTCMonth()+1, d:sd.getUTCDate(), h:sd.getUTCHours(), mi:sd.getUTCMinutes()};

  // 년·월주: 절입 시각(UT 순간)과 출생 순간 비교
  let yr = inp.y;
  // 출생 순간의 연도 기준 절기 목록(전년 대설 ~ 다음해 소한까지)
  const terms=[];
  for(const Y of [yr-1,yr,yr+1]) for(let k=0;k<12;k++) terms.push({Y,k,jd:jieJD(Y,k)});
  terms.sort((a,b)=>a.jd-b.jd);
  let prev=null,next=null;
  for(const t of terms){ if(t.jd<=jdUT) prev=t; else { next=t; break; } }
  // prev.k → 월지: 소한(0)=축(1), 입춘(1)=인(2) …
  const monthBr = mod(prev.k+1,12);
  // 사주 연도: 입춘(k=1) 이전이면 전년
  const ipchun = jieJD(inp.y,1);
  const sajuYear = jdUT < ipchun ? inp.y-1 : inp.y;
  const yearGz = gz(mod(sajuYear-4,60));
  const monthStemStart = mod((yearGz.s%5)*2+2,10);         // 인월 천간 (오호둔)
  const monthStem = mod(monthStemStart + mod(monthBr-2,12),10);
  const monthGz = gz(gzIndex(monthStem,monthBr));

  // 일주: 진태양시 날짜 기준, 23시 이후는 다음날(조자시) — yaja 옵션이면 당일 유지
  let dayJdn = jdFromDate(S.y,S.m,S.d);
  let hourBr=null, hourGz=null;
  const late = timeKnown && S.h>=23;
  if(late && !inp.yaja) dayJdn += 1;
  const dayGz = gz(mod(dayJdn+49,60));
  if(timeKnown){
    hourBr = Math.floor((S.h*60+S.mi+60)/120)%12;
    const baseDayStem = late && inp.yaja ? (dayGz.s+1)%10 : dayGz.s;   // 야자시는 다음날 자시 천간
    const hs = mod((baseDayStem%5)*2 + hourBr,10);
    hourGz = gz(gzIndex(hs,hourBr));
  }

  // 대운
  const yang = yearGz.s%2===0, male = inp.gender==='m';
  const forward = (yang&&male)||(!yang&&!male);
  const gapDays = forward ? (next.jd - jdUT) : (jdUT - prev.jd);
  const startExact = gapDays/3;                    // 년
  let dwStart = Math.round(startExact); if(dwStart<1) dwStart=1; if(dwStart>10) dwStart=10;
  const daewoon=[];
  for(let i=1;i<=10;i++){
    const idx = mod(monthGz.i + (forward?i:-i),60);
    daewoon.push({gz:gz(idx), age:dwStart+(i-1)*10, year: inp.y + dwStart+(i-1)*10 - 1});
  }

  const pillars = {hour:hourGz, day:dayGz, month:monthGz, year:yearGz};
  return {
    input:inp, timeKnown, pillars, solar:S, solarShift, offset:off,
    jie:{prev:{name:JIE_NAME[prev.k], ms:jdToMs(prev.jd)}, next:{name:JIE_NAME[next.k], ms:jdToMs(next.jd)}},
    daewoon:{forward, start:dwStart, startExact, list:daewoon}, sajuYear
  };
}
function yearGz(Y){ return gz(mod(Y-4,60)); }
function monthGzOf(Y, mIdx){ // 사주 연도 Y의 mIdx번째 달(0=인월)
  const ys = yearGz(Y).s, st = mod((ys%5)*2+2+mIdx,10), br = mod(2+mIdx,12);
  return gz(gzIndex(st,br));
}

return {STEM,STEMH,BR,BRH,ZODIAC,EL,ELH,STEM_EL,BR_EL,BR_YANG,JIJANG,BR_MAIN,TEN,TEN_GROUP,UNSEONG,JIE_NAME,
  calc,tenGod,unseong,gz,gzIndex,gzName,gzHan,yearGz,monthGzOf,jieJD,sunLon,jdFromDate,dateFromJdn,jdToMs,koreaOffset,mod};
})();
if(typeof module!=="undefined") module.exports=SAJU;
